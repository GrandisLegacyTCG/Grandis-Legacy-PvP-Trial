import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'tests'/'artifacts'/'candidate3b';ART.mkdir(parents=True,exist_ok=True)
VPS=[(1366,768,'desktop'),(1024,768,'tablet-landscape'),(1180,820,'tablet-landscape'),(768,1024,'tablet-portrait'),(820,1180,'tablet-portrait'),(360,800,'phone'),(390,844,'phone'),(412,915,'phone')]
def clean(p):
 s=p.read_text(encoding='utf-8');s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I);s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I);return s
HTML=clean(ROOT/'public'/'index.html')
CSS='\n'.join((ROOT/'public'/f).read_text(encoding='utf-8') for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
JS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js','js/mobile-app-nav.js']
def boot(page):
 page.set_content(HTML);page.add_style_tag(content=CSS);page.evaluate("window.GL_APP_MODE='PVP';window.GL_PVP_SHARED_BOARD_ACTIVE=true;document.body.classList.remove('pvp-booting','pvp-lobby-mode')")
 for f in JS: page.add_script_tag(content=(ROOT/'public'/f).read_text(encoding='utf-8'))
 page.wait_for_timeout(60)
def fixture(page):
 return page.evaluate("""(()=>{GL_LOCAL_AI_BRIDGE.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger'});GL_LOCAL_AI_BRIDGE.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS',firstPlayer:'PLAYER',completed:true});const snap=GL_LOCAL_AI_BRIDGE.getSnapshot(),s=snap.appState;s.pvpHumanVsHuman=true;s.phase='Deploy';s.turn='PLAYER';s.mana=9;s.manaRegen=3;s.racial=2;s.playerHand=['S1-ITM-020','S1-WAR-001','S1-MAG-002','S1-EVT-009'];s.playerHeroes.CENTER.attachments=['S1-ITM-011',null];s.activeAttachments=[{side:'PLAYER',lane:'CENTER',slot:0,card_id:'S1-ITM-011',remaining:2,counters:2}];const now=Date.now();s.opponentPlayedEvents=[];s.pvpActionEventsBySide={PLAYER:[{id:'p1',card_id:'S1-WAR-001',title:'Rage Swing',label:'ACTION',timestamp:now-30},{id:'p2',card_id:'S1-MAG-002',title:'Ice Lance',label:'ACTION',timestamp:now-20},{id:'p3',card_id:'S1-ITM-020',title:'Freeze Bomb',label:'ACTION',timestamp:now-10}],AI:[]};const H='__HIDDEN_CARD_BACK__';s.aiHandCount=Array.isArray(s.aiHand)?s.aiHand.length:Number(s.aiHandCount||3);s.aiHand=Array(s.aiHandCount).fill(H);snap.pvpPrivateStateMasked=true;snap.pvpRecipientSeat=1;snap.pvpSpectatorView='CARD_BACKS';return snap;})()""")
def device(page,w,h,kind):
 cdp=page.context.new_cdp_session(page);mobile=kind!='desktop';cdp.send('Emulation.setTouchEmulationEnabled',({'enabled':True,'maxTouchPoints':5} if mobile else {'enabled':False}));cdp.send('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':mobile,'screenWidth':w,'screenHeight':h,'screenOrientation':{'type':'portraitPrimary' if h>w else 'landscapePrimary','angle':0 if h>w else 90}});page.evaluate("delete window.__GL_PHYSICAL_DEVICE_FAMILY;window.dispatchEvent(new Event('resize'));true");page.wait_for_timeout(80)
def import_snap(page,snap):page.evaluate("snap=>{GL_PVP_PRESENTATION_ADAPTER.setSharedBoardMode(true);return GL_PVP_PRESENTATION_ADAPTER.importViewerSafeSnapshot(snap,1,{skipImportAnimations:true})}",snap);page.wait_for_timeout(80)
def border(page,sel):
 return page.evaluate("sel=>{const e=[...document.querySelectorAll(sel)].find(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0});if(!e)return null;const s=getComputedStyle(e);return {width:s.borderTopWidth,style:s.borderTopStyle,outline:s.outlineStyle,boxShadow:s.boxShadow}}",sel)
def played(page):
 return page.evaluate("""()=>[...document.querySelectorAll('.combined-played-card img')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).slice(0,3).map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,border:getComputedStyle(e).borderTopWidth}})""")
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1366,'height':768});p=ctx.new_page();p.route('**/*',lambda r:r.abort());p.set_default_timeout(3000);errs=[];p.on('pageerror',lambda e:errs.append(str(e)));boot(p);snap=fixture(p);rows=[]
 for w,h,k in VPS:
  device(p,w,h,k);import_snap(p,snap);sizes=played(p);sizepass=len(sizes)>=3 and max(x['w'] for x in sizes)-min(x['w'] for x in sizes)<=1 and max(x['h'] for x in sizes)-min(x['h'] for x in sizes)<=1
  arts={name:border(p,sel) for name,sel in {'hero':'.heroImg','hand':'.hand-art img','card_played':'.combined-played-card img','card_played_wrapper':'.combined-played-card','card_back':'.back','attachment':'.attachment-row img'}.items()}
  borderpass=all(v is None or float(v['width'].replace('px','') or 0)==0 for v in arts.values())
  highlight=p.evaluate("""()=>{const e=[...document.querySelectorAll('.hero-panel')].find(x=>x.getBoundingClientRect().width>0);if(!e)return null;e.classList.add('source-candidate','selectable-legal');const s=getComputedStyle(e),v=s.boxShadow;e.classList.remove('source-candidate','selectable-legal');return v;}""")
  functional=bool(highlight and highlight!='none')
  rows.append({'viewport':f'{w}x{h}','kind':k,'played':sizes,'scale_pass':sizepass,'art_borders':arts,'decorative_border_pass':borderpass,'functional_highlight':highlight,'functional_highlight_pass':functional,'pass':sizepass and borderpass and functional})
 result={'viewports':rows,'page_errors':errs,'pass':all(r['pass'] for r in rows) and not errs}
 (ART/'ui-corrections.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result,indent=2));b.close();sys.exit(0 if result['pass'] else 1)
