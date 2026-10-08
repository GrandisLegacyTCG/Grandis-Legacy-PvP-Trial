#!/usr/bin/env python3
import re,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v348-final-ui'; OUT.mkdir(parents=True,exist_ok=True)
VPS=[('desktop',1366,768,False),('tablet-landscape',1024,768,True),('tablet-portrait',768,1024,True),('phone',390,844,True)]
def html():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=html(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASEJS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']
def base(page):
 page.set_content(HTML); page.add_style_tag(content=CSS); page.evaluate("window.GL_APP_MODE='PVP';document.body.classList.remove('pvp-booting')")
 for f in BASEJS: page.add_script_tag(content=(P/f).read_text())
def lobby(page):
 page.evaluate("""()=>{const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});class X{static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;constructor(){this.readyState=0;setTimeout(()=>this.onerror&&this.onerror(new Event('error')),5)}send(){}close(){this.readyState=3}};window.WebSocket=X}""")
 page.add_script_tag(content=(P/'js/pvp-network.js').read_text()); page.add_script_tag(content=(P/'js/mobile-app-nav.js').read_text()); page.wait_for_selector('#pvpFormationPreview .pvp-v260-swap-button')
def match(page):
 page.evaluate("""()=>{window.GL_PVP_SHARED_BOARD_ACTIVE=true;window.GL_PVP_LOCAL_ROLE='player';window.GL_LOCAL_AI_BRIDGE.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',player1Name:'A',player2Name:'B'});window.GL_LOCAL_AI_BRIDGE.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});}"""); page.wait_for_timeout(80)
def main():
 out={'ok':True,'lobby':{},'surrender':{}}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for name,w,h,mob in VPS:
   c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob); p=c.new_page(); p.route('**/*',lambda r:r.abort()); base(p); lobby(p)
   btns=p.locator('#pvpFormationPreview .pvp-v260-swap-button'); assert btns.count()==2
   for i in range(2):
    bt=btns.nth(i); im=bt.locator('img'); assert im.count()==1 and 'assets/lobby/swap.png' in im.get_attribute('src'); bb=bt.bounding_box(); ib=im.bounding_box(); assert bb and ib and abs(bb['width']-bb['height'])<1.5 and ib['width']>0 and ib['height']>0
   # formation semantics unchanged
   before=p.locator('#pvpFormationPreview .pvp-v260-hero').evaluate_all("els=>els.map(e=>e.dataset.rankOneHero)"); btns.nth(0).click(); after=p.locator('#pvpFormationPreview .pvp-v260-hero').evaluate_all("els=>els.map(e=>e.dataset.rankOneHero)"); assert after==[before[1],before[0],before[2]]
   nav={'tested':False}
   if w<=768:
    hb=p.locator('#glMobileAppMenuButton'); menu=p.locator('#glMobileAppMenu'); assert hb.is_visible(); z1=int(hb.evaluate("e=>getComputedStyle(e).zIndex")); z2=int(menu.evaluate("e=>getComputedStyle(e).zIndex")); lobbyz=int(p.locator('.pvp-v260-lobby').evaluate("e=>getComputedStyle(e).zIndex") or 0); assert z1>z2>lobbyz,(z1,z2,lobbyz); hb.click(); assert not menu.get_attribute('hidden'); assert hb.get_attribute('aria-expanded')=='true'; hb.click(); assert menu.get_attribute('hidden') is not None; nav={'tested':True,'buttonZ':z1,'menuZ':z2,'lobbyZ':lobbyz}
   p.screenshot(path=str(OUT/f'lobby-{name}-{w}x{h}.png')); out['lobby'][name]={'swapPng':True,'swapWorks':True,'nav':nav}; c.close()
  for name,w,h,mob in VPS:
   c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob); p=c.new_page(); p.route('**/*',lambda r:r.abort()); base(p); match(p)
   s=p.locator('#surrenderButton')
   if not s.is_visible():
    mb=p.locator('#mobileMatchMenuButton'); assert mb.is_visible(),(name,'no visible match menu'); mb.click(); p.wait_for_timeout(20); s=p.locator('#mobileSurrenderButton')
   assert s.count()==1 and s.is_visible(),(name,'surrender not visible'); bb=s.bounding_box(); assert bb and bb['width']>10 and bb['height']>10 and bb['x']>=0 and bb['x']+bb['width']<=w+1 and bb['y']>=0 and bb['y']+bb['height']<=h+1,(name,bb)
   p.screenshot(path=str(OUT/f'surrender-{name}-{w}x{h}.png')); out['surrender'][name]={'visible':True,'box':bb,'control':s.get_attribute('id')}; c.close()
  b.close()
 print(json.dumps(out,indent=2)); (OUT/'results.json').write_text(json.dumps(out,indent=2)+'\n'); return 0
if __name__=='__main__':
 try: sys.exit(main())
 except Exception:
  import traceback; traceback.print_exc(); sys.exit(1)
