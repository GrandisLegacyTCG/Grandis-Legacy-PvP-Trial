#!/usr/bin/env python3
import re,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v350-maintenance'; OUT.mkdir(parents=True,exist_ok=True)
VPS=[('desktop',1366,768,False),('tablet-landscape',1024,768,True),('tablet-portrait',768,1024,True),('phone',390,844,True)]
def stripped():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=stripped(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css']); BASEJS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']
SNAP={
 'type':'snapshot','buildId':'gl-pvp-3.50-maint-reconnect-kick-r1-2026-09-27','room':{'id':'LOBBY','generation':1},
 'match':{'status':'setup','serverBoardRevision':0,'serverBoard':None},
 'players':[{'clientId':'p1','name':'Alice','role':'player','seat':1,'seatLabel':'Player 1','ready':False,'connected':True,'hasDeck':True,'deckKey':'starter_01_elemental_lord_conqueror_renegade'}, {'clientId':'p2','name':'Bob','role':'player','seat':2,'seatLabel':'Player 2','ready':False,'connected':True,'hasDeck':True,'deckKey':None}],
 'spectators':[], 'local':{'clientId':'p1','name':'Alice','role':'player','seat':1,'seatLabel':'Player 1','seatToken':'test-token','ready':False,'deckKey':'starter_01_elemental_lord_conqueror_renegade','deckName':'Starter 1'}
}
def boot(page):
 page.route('**/*',lambda r:r.abort()); page.set_content(HTML); page.add_style_tag(content=CSS); page.evaluate("window.GL_APP_MODE='PVP';document.body.classList.remove('pvp-booting')")
 for f in BASEJS: page.add_script_tag(content=(P/f).read_text())
 page.evaluate("""()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});class MockWS{static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;constructor(){this.readyState=0;this.sent=[];window.__mockWs=this;setTimeout(()=>{this.readyState=1;if(this.onopen)this.onopen({});},5)}send(x){this.sent.push(JSON.parse(x))}close(){this.readyState=3}}window.WebSocket=MockWS;}""")
 page.add_script_tag(content=(P/'js/pvp-network.js').read_text()); page.wait_for_timeout(40); page.evaluate("s=>window.__mockWs.onmessage({data:JSON.stringify(s)})",SNAP); page.wait_for_timeout(60)
def main():
 out={'ok':True,'viewports':{}}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for name,w,h,mob in VPS:
   c=b.new_context(viewport={'width':w,'height':h},is_mobile=mob,has_touch=mob); p=c.new_page(); boot(p)
   btn=p.locator('[data-kick-seat="2"]'); assert btn.count()==1 and btn.is_visible(),(name,'kick icon not visible')
   seat=btn.locator('xpath=ancestor::article[contains(@class,"pvp-v260-seat")]'); status=seat.locator('p'); bb=btn.bounding_box(); sb=seat.bounding_box(); pb=status.bounding_box(); assert bb and sb and pb
   assert abs(bb['width']-bb['height'])<=1.5,(name,'not circular',bb)
   assert bb['x']>=sb['x'] and bb['x']+bb['width']<=sb['x']+sb['width']+1,(name,'outside seat',bb,sb)
   assert pb['x']+pb['width']<=bb['x']+1,(name,'status overlaps kick icon',pb,bb)
   assert btn.get_attribute('aria-label')=='Kick Player 2'
   img=btn.locator('img'); assert img.count()==1 and (img.get_attribute('src') or '').endswith('assets/lobby/exit.png'),(name,'exit.png not used')
   btn.click(); p.wait_for_timeout(10); sent=p.evaluate("window.__mockWs.sent"); assert any(x.get('type')=='kick-seat-2' for x in sent),(name,'kick click did not send intent',sent[-5:])
   shot=OUT/f'kick-layout-{name}-{w}x{h}.png'; p.screenshot(path=str(shot),full_page=False)
   out['viewports'][name]={'viewport':f'{w}x{h}','circular':True,'insideSeat':True,'noOverlap':True,'clickIntent':True,'box':bb,'screenshot':str(shot.relative_to(ROOT))}; c.close()
  b.close()
 (OUT/'results.json').write_text(json.dumps(out,indent=2)+'\n'); print(json.dumps(out,indent=2)); return 0
if __name__=='__main__':
 try: sys.exit(main())
 except Exception:
  import traceback; traceback.print_exc(); sys.exit(1)
