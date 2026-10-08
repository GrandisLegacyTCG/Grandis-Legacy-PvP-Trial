#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v350-stage5'; OUT.mkdir(parents=True,exist_ok=True)

def stripped():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=stripped(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASE=['config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js']
APP=(P/'js/app.bundle.js').read_text(); marker='window.GL_LOCAL_AI_BRIDGE={'
hook="""window.__GL_STAGE5={buildInitialMatchState:buildInitialMatchState,setState:function(s){appState=s;return s;},setMatchStarted:function(v){matchStarted=!!v;},render:render,validateDeck:validateDeck,normalizeDeck:normalizeDeck,starterOptions:STARTER_DECK_OPTIONS};\n  """
assert marker in APP; APP=APP.replace(marker,hook+marker,1)

PVP_NETWORK=(P/'js/pvp-network.js').read_text()
boot_tail="if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();"
assert boot_tail in PVP_NETWORK
PVP_NETWORK=PVP_NETWORK.replace(boot_tail,"window.__GL_STAGE5_PVP={importCustomDeck:importCustomDeck,visibleDeckName:visibleDeckName,state:state};",1)

def context_args(name,w,h):
 kw={'viewport':{'width':w,'height':h},'screen':{'width':w,'height':h}}
 if name=='phone': kw.update({'is_mobile':True,'has_touch':True,'user_agent':'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/142 Safari/537.36'})
 elif name.startswith('tablet'): kw.update({'has_touch':True,'user_agent':'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'})
 return kw

def boot(page):
 errors=[]; page.on('pageerror',lambda e: errors.append(str(e))); page.route('**/*',lambda r:r.abort()); page.set_content(HTML); page.add_style_tag(content=CSS)
 page.add_script_tag(content="window.GL_APP_MODE='PVP';window.GL_PVP_LOCAL_NAME='Alice';window.GL_PVP_OPPONENT_NAME='Bob';window.GL_PVP_LOCAL_SIGNAL='excellent';window.GL_PVP_OPPONENT_SIGNAL='good';window.GL_PVP_LOCAL_LATENCY_MS=42;window.GL_PVP_OPPONENT_LATENCY_MS=95;")
 for f in BASE: page.add_script_tag(content=(P/f).read_text())
 page.add_script_tag(content=APP); return errors

def deck_matrix(page):
 return page.evaluate("""()=>{const t=window.__GL_STAGE5,key=Object.keys(t.starterOptions)[0],base=JSON.parse(JSON.stringify(t.starterOptions[key].deck));function count(d){return d.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0)}function sized(n){const d=JSON.parse(JSON.stringify(base));let cur=count(d);for(let i=d.main_deck.length-1;i>=0&&cur>n;i--){let q=Number(d.main_deck[i].quantity||1),take=Math.min(q,cur-n);q-=take;cur-=take;if(q<=0)d.main_deck.splice(i,1);else d.main_deck[i].quantity=q;}if(n>cur)d.main_deck.push({card_id:'S1-INVALID-STAGE5',quantity:n-cur});return d}const matrix={};[49,50,51,55,59,60,61].forEach(n=>{const v=t.validateDeck(t.normalizeDeck(sized(n)),'PLAYER');matrix[n]={ok:v.ok,errors:v.errors};});const starters=Object.keys(t.starterOptions).map(k=>t.starterOptions[k].deck.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0));return{matrix,starterCount:starters.length,starterMainCounts:starters};}""")

def layout_gate(page):
 return page.evaluate("""()=>{const t=window.__GL_STAGE5,s=t.buildInitialMatchState();s.preGame=null;s.turn='PLAYER';s.phase='Battle';s.playerDeckName='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';s.aiDeckName='123456789012345678901234567890';t.setState(s);t.setMatchStarted(true);t.render();document.body.classList.remove('pvp-booting','pvp-lobby-mode');function rows(){return [...document.querySelectorAll('[data-pvp-identity-side]')].filter(x=>{const r=x.getBoundingClientRect(),cs=getComputedStyle(x);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'});}function inspect(row){const d=row.querySelector('.pvp-player-deck-name'),i=row.querySelector('.pvp-player-identity-container'),sig=row.querySelector('.pvp-connection-bar'),rr=row.getBoundingClientRect(),dr=d.getBoundingClientRect(),ir=i.getBoundingClientRect(),sr=sig.getBoundingClientRect(),cs=getComputedStyle(d);return{side:row.dataset.pvpIdentitySide,text:d.textContent,len:d.textContent.length,title:d.title,aria:d.getAttribute('aria-label'),connectionOutside:!i.contains(sig)&&sig.parentElement===row,overlap:dr.right>sr.left-.5,rowWithinWidth:rr.left>=-.5&&rr.right<=innerWidth+.5,noClip:d.scrollWidth<=d.clientWidth+1,nowrap:cs.whiteSpace==='nowrap',deckRect:{left:dr.left,right:dr.right,width:dr.width},signalRect:{left:sr.left,right:sr.right,width:sr.width},alignDelta:Math.abs((ir.top+ir.height/2)-(sr.top+sr.height/2)),signalState:sig.dataset.pvpSignalState};}const first=rows().map(inspect);const samples=[];for(let n=0;n<25;n++){t.render();document.body.classList.remove('pvp-booting','pvp-lobby-mode');samples.push(rows().map(r=>({side:r.dataset.pvpIdentitySide,state:r.querySelector('.pvp-connection-bar').dataset.pvpSignalState,deck:r.querySelector('.pvp-player-deck-name').textContent})));}return{mode:document.body.className,first,samples};}""")


def import_matrix(page):
 page.add_script_tag(content=PVP_NETWORK)
 return page.evaluate("""async()=>{const t=window.__GL_STAGE5,p=window.__GL_STAGE5_PVP,key=Object.keys(t.starterOptions)[0],base=JSON.parse(JSON.stringify(t.starterOptions[key].deck));function count(d){return d.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0)}function sized(n){const d=JSON.parse(JSON.stringify(base));let cur=count(d);for(let i=d.main_deck.length-1;i>=0&&cur>n;i--){let q=Number(d.main_deck[i].quantity||1),take=Math.min(q,cur-n);q-=take;cur-=take;if(q<=0)d.main_deck.splice(i,1);else d.main_deck[i].quantity=q;}if(n>cur)d.main_deck.push({card_id:'S1-INVALID-STAGE5',quantity:n-cur});d.display_name='Imported '+n;return d}async function one(n){p.state.customDeck=null;p.state.customDeckName='';const file=new File([JSON.stringify(sized(n))],`deck-${n}.json`,{type:'application/json'});const input={files:[file],value:'x'};p.importCustomDeck({target:input});await new Promise(r=>setTimeout(r,35));return{accepted:!!p.state.customDeck,name:p.state.customDeckName};}const out={};for(const n of [49,50,51,55,59,60,61])out[n]=await one(n);return{matrix:out,visible:p.visibleDeckName('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),visibleLen:p.visibleDeckName('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').length};}""")

def main():
 out={'ok':True,'viewports':{},'deckMatrix':None}
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for idx,(name,w,h) in enumerate([('desktop',1366,768),('tablet-landscape',1024,768),('tablet-portrait',768,1024),('phone',390,844)]):
   c=browser.new_context(**context_args(name,w,h));p=c.new_page();errs=boot(p)
   if idx==0:
    dm=deck_matrix(p); out['deckMatrix']=dm
    im=import_matrix(p); out['importMatrix']=im
    assert dm['starterCount']==5 and all(x==60 for x in dm['starterMainCounts']),dm
    for n in [50,51,55,59,60]: assert dm['matrix'][str(n) if isinstance(next(iter(dm['matrix'].keys())),str) else n]['ok'],dm
    for n in [49,61]: assert not dm['matrix'][str(n) if isinstance(next(iter(dm['matrix'].keys())),str) else n]['ok'],dm
    for n in [50,51,55,59,60]: assert im['matrix'][str(n)]['accepted'],im
    for n in [49,61]: assert not im['matrix'][str(n)]['accepted'],im
    assert im['visibleLen']==25 and im['visible'].endswith('...'),im
   lg=layout_gate(p); assert not errs,errs; assert len(lg['first'])>=2,(name,lg)
   for row in lg['first']:
    assert row['len']==25,(name,row); assert row['text'].endswith('...'),(name,row); assert row['title'] and len(row['title'])>25,(name,row)
    assert row['connectionOutside'],(name,row); assert not row['overlap'],(name,row); assert row['rowWithinWidth'],(name,row); assert row['noClip'],(name,row); assert row['nowrap'],(name,row); assert row['alignDelta']<=3,(name,row)
   for sample in lg['samples']:
    for item in sample:
     expected='excellent' if item['side']=='PLAYER' else 'good'; assert item['state']==expected,(name,item)
     assert len(item['deck'])==25,(name,item)
   out['viewports'][name]=lg;c.close()
  browser.close()
 (OUT/'identity-browser.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2));return 0
if __name__=='__main__':
 try:sys.exit(main())
 except Exception:
  import traceback;traceback.print_exc();sys.exit(1)
