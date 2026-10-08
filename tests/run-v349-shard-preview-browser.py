#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import importlib.util, subprocess, os, time, urllib.request, random, json, traceback, sys, mimetypes

ROOT=Path(__file__).resolve().parents[1]
CORE=ROOT/'tests/run-v349-shard-parity-browser.py'
OUT=ROOT/'tests/artifacts/v349-shard-parity-part1'
FIX=ROOT/'tests/fixtures/v349-artwork'
OUT.mkdir(parents=True,exist_ok=True)

spec=importlib.util.spec_from_file_location('v349core',CORE)
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def reachable_point(page, locator):
    for i in range(locator.count()):
        card=locator.nth(i); box=card.bounding_box()
        if not box or box['width']<=2 or box['height']<=2: continue
        uid=card.get_attribute('data-mana-uid')
        for fx,fy in ((.5,.5),(.5,.25),(.5,.75),(.25,.5),(.75,.5),(.25,.25),(.75,.75)):
            x=box['x']+box['width']*fx; y=box['y']+box['height']*fy
            ok=page.evaluate("([x,y,uid])=>{const nodes=[...document.querySelectorAll('[data-shard-preview-src][data-mana-side=\\\"PLAYER\\\"]')];const t=nodes.find(n=>n.getAttribute('data-mana-uid')===uid);const e=document.elementFromPoint(x,y);return !!(t&&e&&(e===t||t.contains(e)));}",[x,y,uid])
            if ok: return card, {'x':box['width']*fx,'y':box['height']*fy}
    return None,None


def open_preview_when_input_unlocked(page, touch, timeout_ms=30000):
    # Starting-hand / starting-Shard presentation legitimately locks gameplay input.
    # Probe the real production Shard control (no force click, no local handler call)
    # until the lock releases and the same user gesture opens the approved preview.
    elapsed=0
    last_err=None
    while elapsed<timeout_ms:
        cards=page.locator('[data-shard-preview-src][data-mana-side="PLAYER"]')
        card,pos=reachable_point(page,cards)
        if card is not None:
            try:
                if touch:
                    card.tap(position=pos, timeout=1500)
                else:
                    box=card.bounding_box(); page.mouse.move(box['x']+pos['x'],box['y']+pos['y'])
                page.wait_for_timeout(120)
                visible=page.evaluate("()=>{const z=document.getElementById('hoverCardZoom');return !!(z&&!z.hidden&&z.classList.contains('is-visible'));}")
                if visible:
                    return card,pos
            except Exception as exc:
                last_err=exc
        page.wait_for_timeout(250); elapsed+=370
    raise AssertionError('Shard preview did not become usable after legitimate presentation lock'+(('; '+str(last_err)) if last_err else ''))

def run_device(pw,name,width,height,screen_width,screen_height,touch):
    port=random.randint(49100,53000)
    proc=subprocess.Popen(['node',m.SERVER_TMP.name],cwd=m.ROOT,env={**os.environ,'HOST':'127.0.0.1','PORT':str(port),'GL_PVP_QA':'1'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,text=True)
    try:
        for _ in range(160):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.2) as r:
                    if r.status==200: break
            except Exception: time.sleep(.05)
        else:
            raise RuntimeError('server health timeout')
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-web-security'])
        opts={'viewport':{'width':width,'height':height},'screen':{'width':screen_width,'height':screen_height},'has_touch':touch}
        if touch and screen_width<600:
            opts['is_mobile']=True; opts['user_agent']='Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/142 Mobile Safari/537.36'
        elif touch:
            opts['user_agent']='Mozilla/5.0 (Linux; Android 14; Tablet) AppleWebKit/537.36 Chrome/142 Safari/537.36'
        c1=browser.new_context(**opts); c2=browser.new_context(**opts)
        a=c1.new_page(); b=c2.new_page()
        def route_shared(route):
            name_=Path(route.request.url.split('?',1)[0]).name
            f=FIX/name_
            if f.is_file(): route.fulfill(status=200,content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream',body=f.read_bytes())
            else: route.abort()
        a.route('https://grandislegacytcg.github.io/**',route_shared); b.route('https://grandislegacytcg.github.io/**',route_shared)
        m.setup_page(a,port,width,height); m.setup_page(b,port,width,height); m.start_match(a,b)
        # Starting presentation may still be settling when the authoritative match status first becomes started.
        # Wait for the real local Shard control instead of treating that legitimate presentation window as missing UI.
        a.wait_for_selector('[data-shard-preview-src][data-mana-side="PLAYER"]',state='attached',timeout=20000)
        cards=a.locator('[data-shard-preview-src][data-mana-side="PLAYER"]'); assert cards.count()>=1,(name,'own Shard missing')
        card,pos=open_preview_when_input_unlocked(a,touch)
        cls=a.locator('#hoverCardZoom').get_attribute('class') or ''
        if name=='phone': assert 'is-phone-shard-preview' in cls,(name,cls)
        if name=='tablet-portrait': assert 'is-tablet-portrait-shard-preview' in cls,(name,cls)
        remote=m.app(a)['aiManaPoolCards']; assert all(x.get('hidden') and not any(k in x for k in ('uid','kind','class_name','value')) for x in remote),remote
        a.screenshot(path=str(OUT/f'preview-{name}.png'))
        browser.close()
        return {'visible':True,'touch':touch,'class':cls,'hiddenRemote':True}
    finally:
        proc.terminate()
        try: proc.wait(timeout=3)
        except Exception: proc.kill()

DEVICE_SPECS={
    'phone':('phone',390,844,390,844,True),
    'tabletPortrait':('tablet-portrait',768,1024,768,1024,True),
    'tabletLandscape':('tablet-landscape',1024,768,1024,768,True),
    'desktop':('desktop',1366,768,1366,768,False),
}

def run_single_device(key):
    if key not in DEVICE_SPECS: raise AssertionError('unknown device '+str(key))
    with sync_playwright() as pw:
        result=run_device(pw,*DEVICE_SPECS[key])
    print(json.dumps(result,separators=(',',':')),flush=True)
    return result

def main():
    # Isolate each real Chromium device run in its own Python/Playwright process.
    # Repeated launch/close cycles in one Playwright driver can retain transport state
    # in this CI container; process isolation is deterministic and does not alter the
    # production interaction path being tested.
    if len(sys.argv)>=3 and sys.argv[1]=='--device':
        run_single_device(sys.argv[2]);
        try: m.SERVER_TMP.unlink()
        except Exception: pass
        return 0
    results={}
    script=str(Path(__file__).resolve())
    for key in DEVICE_SPECS:
        cp=subprocess.run([sys.executable,script,'--device',key],cwd=str(ROOT),capture_output=True,text=True,timeout=45)
        if cp.returncode!=0:
            raise AssertionError(key+' preview subprocess failed\nSTDOUT:\n'+cp.stdout+'\nSTDERR:\n'+cp.stderr)
        lines=[line.strip() for line in cp.stdout.splitlines() if line.strip()]
        if not lines: raise AssertionError(key+' preview subprocess returned no result')
        results[key]=json.loads(lines[-1])
    out={'ok':True,'realChromium':True,'responsiveShardPreview':results}
    (OUT/'preview-results.json').write_text(json.dumps(out,indent=2)+'\n')
    try: m.SERVER_TMP.unlink()
    except Exception: pass
    print(json.dumps(out,indent=2)); return 0

if __name__=='__main__':
    try: sys.exit(main())
    except Exception:
        traceback.print_exc();
        try: m.SERVER_TMP.unlink()
        except Exception: pass
        sys.exit(1)
