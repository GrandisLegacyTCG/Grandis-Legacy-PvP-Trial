#!/usr/bin/env python3
import re,sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
VPS=[('desktop',1366,768),('tablet-landscape',1024,768),('tablet-portrait',768,1024),('phone',390,844)]

def clean_html():
    s=(PUBLIC/'index.html').read_text(encoding='utf-8')
    s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I)
    s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I)
    return s

HTML=clean_html()
CSS='\n'.join((PUBLIC/f).read_text(encoding='utf-8') for f in [
    'css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'
])
JS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js',
    'js/runtime-authority.js','js/app.bundle.js','js/pvp-network.js','js/mobile-app-nav.js']

def boot(page):
    page.set_content(HTML)
    page.add_style_tag(content=CSS)
    # Opaque set_content() origin has browser localStorage disabled. Supply only a test storage facade;
    # production application JS remains unchanged and no network PASS is inferred from this UI harness.
    page.evaluate("""()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});class TestWS{static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;constructor(url){this.url=url;this.readyState=0;setTimeout(()=>{if(this.onerror)this.onerror(new Event('error'));},20)}send(){}close(){this.readyState=3;}}Object.defineProperty(window,'WebSocket',{configurable:true,writable:true,value:TestWS});}""")
    # Use real production application JS. TestWS deliberately simulates a failed transport only to verify
    # Lobby error-state rendering; it is NOT evidence of real network connectivity.
    for f in JS:
        page.add_script_tag(content=(PUBLIC/f).read_text(encoding='utf-8'))
    page.wait_for_selector('#pvpSetupDeck',timeout=10000)
    page.wait_for_timeout(100)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    page=ctx.new_page()
    page.route('**/*',lambda r:r.abort())
    page.set_default_timeout(5000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    boot(page)
    results=[]
    for name,w,h in VPS:
        cdp=ctx.new_cdp_session(page)
        cdp.send('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':name!='desktop',
                 'screenWidth':w,'screenHeight':h,'screenOrientation':{'type':'portraitPrimary' if h>w else 'landscapePrimary','angle':0 if h>w else 90}})
        cdp.send('Emulation.setTouchEmulationEnabled',{'enabled':name!='desktop','maxTouchPoints':5 if name!='desktop' else 1})
        page.evaluate("window.dispatchEvent(new Event('resize'))")
        page.wait_for_timeout(60)
        options=page.locator('#pvpSetupDeck option').count()
        assert options==5,(name,options)
        assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK I'
        assert page.locator('#pvpFormationPreview .pvp-v260-hero').count()==3
        r=page.locator('.pvp-v260-rank-preview').bounding_box()
        panel=page.locator('.pvp-v260-deck-panel').bounding_box()
        assert r and panel and r['x']>=panel['x']-1 and r['x']+r['width']<=panel['x']+panel['width']+1

        # Exercise every Starter at every rank.
        for i in range(5):
            page.locator('#pvpSetupDeck').select_option(index=i)
            page.wait_for_timeout(20)
            assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK I'
            for rank in (1,2,3):
                while int(page.locator('#pvpFormationPreview .pvp-v260-hero').first.get_attribute('data-lobby-rank'))<rank:
                    page.locator('#pvpRankNext').click()
                assert page.locator(f'#pvpFormationPreview [data-lobby-rank="{rank}"]').count()==3
                src=page.locator('#pvpFormationPreview img').evaluate_all("(els)=>els.map(e=>e.getAttribute('src'))")
                assert len(src)==3 and all(src)

        # Returning to a different Starter always resets local preview to Rank I.
        page.locator('#pvpSetupDeck').select_option(index=0)
        page.locator('#pvpRankNext').click()
        assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK II'
        page.locator('#pvpSetupDeck').select_option(index=1)
        assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK I'
        results.append({'viewport':f'{w}x{h}','kind':name,'starters':5,'rankI':True,'rankII':True,'rankIII':True,'layout':True})

    page.wait_for_timeout(80)
    diag=page.evaluate("()=>window.GL_PVP_NETWORK&&window.GL_PVP_NETWORK.getConnectionDiagnostics()")
    hint=page.locator('#pvpSetupHint').inner_text().strip()
    assert diag and diag.get('state')=='error',diag
    assert 'Cannot reach' in hint and 'Connecting to' not in hint,hint
    out={'ok':not errors,'viewports':results,'page_errors':errors,'connection_diagnostics':diag,'failed_transport_ui':'PASS'}
    print(json.dumps(out,indent=2))
    browser.close()
    sys.exit(0 if out['ok'] else 1)
