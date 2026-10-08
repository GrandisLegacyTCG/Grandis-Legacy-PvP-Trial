import os,re,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
PVP=Path(__file__).resolve().parents[1]
VS=Path(os.environ['GL_CANDIDATE15_ROOT'])
ART=PVP/'tests'/'artifacts'/'candidate2r-partb';ART.mkdir(parents=True,exist_ok=True)
VPS=[(1366,768,'desktop'),(1440,900,'desktop'),(1920,1080,'desktop'),(1024,600,'tablet-landscape'),(1024,768,'tablet-landscape'),(1180,820,'tablet-landscape'),(1195,615,'tablet-landscape'),(1366,1024,'tablet-landscape'),(768,1024,'tablet-portrait'),(820,1180,'tablet-portrait'),(360,800,'phone'),(390,844,'phone'),(412,915,'phone')]
_vpf=os.environ.get('GL_VP_INDEXES','').strip()
if _vpf:
 _all=VPS;VPS=[_all[int(i)] for i in _vpf.split(',') if i.strip()]
COMP={
'shell':'.gl-lab-authority','p_left':'.hero-panel[data-side="PLAYER"][data-lane="LEFT"] .hero-main','p_center':'.hero-panel[data-side="PLAYER"][data-lane="CENTER"] .hero-main','p_right':'.hero-panel[data-side="PLAYER"][data-lane="RIGHT"] .hero-main','o_left':'.hero-panel[data-side="AI"][data-lane="LEFT"] .hero-main','o_center':'.hero-panel[data-side="AI"][data-lane="CENTER"] .hero-main','o_right':'.hero-panel[data-side="AI"][data-lane="RIGHT"] .hero-main','hp':'.hero-panel[data-side="PLAYER"][data-lane="CENTER"] .hp-bar','hero_control':'.hero-panel[data-side="PLAYER"][data-lane="CENTER"] .heroActions button','status':'.hero-panel[data-side="PLAYER"][data-lane="LEFT"] .negative-status-indicator','attachment':'.hero-panel[data-side="PLAYER"][data-lane="CENTER"] .attachment-row img, .hero-panel[data-side="PLAYER"][data-lane="CENTER"] .attachment-row button','hand':'.gl-lab-hand--player, .player-hand','hand_card':'.hand-card[data-card-id]','shard_pool':'.gl-lab-mana-pool--player, .mobile-shard-pool--player','shard':'.gl-lab-mana-pool--player .gl-lab-mana-card:not(.is-pending-draw), .mobile-shard-pool--player .mobile-shard-card:not(.is-opening-draw-hidden)','racial':'.gl-lab-racial, .racial-coins','legacy':'[data-zone-side="PLAYER"][data-zone-type="Legacy Deck"]','shard_deck':'[data-zone-side="PLAYER"][data-zone-type="Shard Deck"]','discard':'[data-zone-side="PLAYER"][data-zone-type="Discard Pile"]','main_deck':'[data-zone-side="PLAYER"][data-zone-type="Main Deck"]','mana_regen':'.gl-lab-mana-regen','phase':'.phase-panel','card_played':'.card-played-panel'}
STYLE=['display','position','top','left','right','bottom','width','height','gap','padding','margin','transform','font-size','line-height','border','border-radius','overflow','z-index']
def clean(p):
 s=p.read_text(encoding='utf-8');s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I);s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I);return s
VS_HTML=clean(VS/'index.html'); PVP_HTML=clean(PVP/'public'/'index.html')
VS_CSS='\n'.join((VS/f).read_text(encoding='utf-8') for f in ['shared-app/app.css','shared-app/battlefield-authority.css','shared-ui/battlefield-ui.css'])
PVP_CSS='\n'.join((PVP/'public'/f).read_text(encoding='utf-8') for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
VS_JS=['shared-ui/battlefield-ui.js','js/static-data.js','js/runtime-authority.js','shared-app/active-starters.js','shared-app/app.bundle.js','js/mobile-app-nav.js']
PVP_JS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js','js/mobile-app-nav.js']
def boot(page,which):
 page.set_content(VS_HTML if which=='vs' else PVP_HTML);page.add_style_tag(content=VS_CSS if which=='vs' else PVP_CSS);page.evaluate("window.GL_APP_MODE='LOCAL_AI'" if which=='vs' else "window.GL_APP_MODE='PVP';window.GL_PVP_SHARED_BOARD_ACTIVE=true;document.body.classList.remove('pvp-booting','pvp-lobby-mode')")
 root=VS if which=='vs' else PVP/'public'
 for f in (VS_JS if which=='vs' else PVP_JS): page.add_script_tag(content=(root/f).read_text(encoding='utf-8'))
 page.wait_for_timeout(60)
def make_fixture(page):
 return page.evaluate("""(()=>{GL_LOCAL_AI_BRIDGE.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger'});GL_LOCAL_AI_BRIDGE.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS',firstPlayer:'PLAYER',completed:true});const snap=GL_LOCAL_AI_BRIDGE.getSnapshot(),s=snap.appState;s.pvpHumanVsHuman=true;s.phase='Deploy';s.turn='PLAYER';s.mana=9;s.manaRegen=3;s.racial=2;s.aiMana=8;s.aiManaRegen=2;s.aiRacial=1;s.playerHand=['S1-ITM-020','S1-WAR-001','S1-MAG-002','S1-EVT-009'];s.playerDiscard=['S1-MAG-004','S1-WAR-003'];s.playerHeroes.LEFT.hp=s.playerHeroes.LEFT.maxHp-20;s.playerHeroes.LEFT.statuses=[{status:'Burn',duration:2,source_name:'Parity Fixture'}];s.playerHeroes.CENTER.hp=s.playerHeroes.CENTER.maxHp-10;s.playerHeroes.CENTER.attachments=['S1-ITM-011',null];s.activeAttachments=[{side:'PLAYER',lane:'CENTER',slot:0,card_id:'S1-ITM-011',remaining:2,counters:2}];s.playerHeroes.RIGHT.exhausted=true;s.playerHeroes.RIGHT.exhaust_reason='Parity Fixture';s.aiHeroes.LEFT.hp=s.aiHeroes.LEFT.maxHp-15;s.aiHeroes.CENTER.exhausted=true;s.opponentPlayedEvents=[{id:'p1',card_id:'S1-WAR-001',title:'Rage Swing',label:'ACTION',timestamp:Date.now()-10}];const H='__HIDDEN_CARD_BACK__';for(const pair of [['playerDeck','playerDeckCount'],['aiDeck','aiDeckCount']]){const n=Array.isArray(s[pair[0]])?s[pair[0]].length:Number(s[pair[1]]||0);s[pair[1]]=n;s[pair[0]]=Array(n).fill(H);}s.aiHandCount=Array.isArray(s.aiHand)?s.aiHand.length:Number(s.aiHandCount||0);s.aiHand=Array(s.aiHandCount).fill(H);s.aiLegacyCount=Array.isArray(s.aiLegacy)?s.aiLegacy.length:Number(s.aiLegacyCount||0);s.aiLegacy=Array(s.aiLegacyCount).fill(H);snap.pvpPrivateStateMasked=true;snap.pvpRecipientSeat=1;snap.pvpSpectatorView='CARD_BACKS';return snap;})()""")
def apply_device(page,w,h,kind):
 cdp=page.context.new_cdp_session(page);mobile=kind!='desktop';ua='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/144 Safari/537.36'
 if kind.startswith('tablet'):ua='Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 Chrome/144 Safari/537.36'
 if kind=='phone':ua='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/144 Mobile Safari/537.36'
 cdp.send('Network.setUserAgentOverride',{'userAgent':ua});cdp.send('Emulation.setTouchEmulationEnabled',({'enabled':True,'maxTouchPoints':5} if mobile else {'enabled':False}));cdp.send('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':mobile,'screenWidth':w,'screenHeight':h,'screenOrientation':{'type':'portraitPrimary' if h>w else 'landscapePrimary','angle':0 if h>w else 90}})
 page.evaluate("delete window.__GL_PHYSICAL_DEVICE_FAMILY;window.dispatchEvent(new Event('resize'));true");page.wait_for_timeout(70)
def import_snap(page,which,snap):
 if which=='vs':page.evaluate("snap=>{window.GL_PVP_SHARED_BOARD_ACTIVE=true;return GL_LOCAL_AI_BRIDGE.importCanonicalSnapshot(snap,1,{skipImportAnimations:true})}",snap)
 else:page.evaluate("snap=>{GL_PVP_PRESENTATION_ADAPTER.setSharedBoardMode(true);return GL_PVP_PRESENTATION_ADAPTER.importViewerSafeSnapshot(snap,1,{skipImportAnimations:true})}",snap)
 page.wait_for_timeout(70)
def metric(page,sel):
 return page.evaluate("""([sel,props])=>{const es=[...document.querySelectorAll(sel)],e=es.find(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e),st={};for(const p of props)st[p]=s.getPropertyValue(p);return{rect:{x:r.x,y:r.y,w:r.width,h:r.height},style:st};}""",[sel,STYLE])
def metrics_all(page):
 return page.evaluate("""([comp,props])=>{const out={};for(const [name,sel] of Object.entries(comp)){const es=[...document.querySelectorAll(sel)],e=es.find(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});if(!e){out[name]=null;continue;}const r=e.getBoundingClientRect(),cs=getComputedStyle(e),st={};for(const p of props)st[p]=cs.getPropertyValue(p);out[name]={rect:{x:r.x,y:r.y,w:r.width,h:r.height},style:st};}return out;}""",[COMP,STYLE])

def interaction(page,kind):
 page.bring_to_front()
 def vis(sel):return page.locator(sel).count()>0
 def quick():return page.evaluate("(()=>{const z=document.querySelector('#hoverCardZoom');return !!z&&!z.hidden&&getComputedStyle(z).display!=='none'})()")
 def detail():return page.evaluate("(()=>{const d=document.querySelector('#previewOverlay');return !!d&&d.classList.contains('open')})()")
 def hover(sel,idx=0):return page.evaluate("([sel,idx])=>{const e=[...document.querySelectorAll(sel)][idx];if(!e)return false;e.dispatchEvent(new PointerEvent('pointerenter',{pointerType:'mouse',bubbles:false}));return true}",[sel,idx])
 def tap(sel,idx=0):
  pt=page.evaluate("([sel,idx])=>{const e=[...document.querySelectorAll(sel)][idx];if(!e)return null;e.scrollIntoView({block:'center',inline:'nearest'});const r=e.getBoundingClientRect();return{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}}",[sel,idx])
  if not pt:return False
  cdp=page.context.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':pt['x'],'y':pt['y'],'radiusX':1,'radiusY':1,'force':1,'id':1}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});return True
 out={};hero='.hero-panel[data-side="PLAYER"][data-lane="LEFT"] .hero-main';hand='.hand-card[data-card-id] .hand-art[data-preview]';shard=('.gl-lab-mana-pool--player .gl-lab-mana-card:not(.is-pending-draw)' if kind in ('desktop','tablet-landscape') else '.mobile-shard-pool--player .mobile-shard-card[data-shard-preview-src]:not(.is-opening-draw-hidden)')
 if kind=='desktop':
  if vis(hero):hover(hero);out['hero_quick']=quick()
  if vis(hand):hover(hand);out['hand_quick']=quick()
  if vis(shard):hover(shard);out['shard_quick']=quick();out['shard_detail']=detail()
  out['pointer_events']=page.evaluate("getComputedStyle(document.querySelector('#hoverCardZoom')).pointerEvents")
 else:
  n=page.locator(shard).count();seq=[0,1,2,0,2,1,0,1,2,1,0,2,0,1,2,0,1,2,0,1] if kind=='tablet-landscape' else ([0,1,0]*4 if kind=='phone' else [0,1,0,1,0,1]);fail=det=0
  for i in seq:
   if n<1 or not tap(shard,i%n):fail+=1;continue
   if not quick():fail+=1
   if detail():det+=1
   page.wait_for_timeout(1)
   if not quick():fail+=1
   if detail():det+=1
  out.update(shard_transitions=len(seq),shard_fail_count=fail,shard_detail_count=det)
  if kind=='tablet-landscape' and vis(hero):
   tap(hero);a=[quick(),detail()];tap(hero);b=[quick(),detail()];out['hero_two_stage']=[a,b]
  if kind=='tablet-landscape' and vis(hand):
   tap(hand);a=[quick(),detail()];tap(hand);b=[quick(),detail()];out['hand_two_stage']=[a,b]
  if kind in ('tablet-portrait','phone') and vis(hero):
   tap(hero);out['hero_first']=[quick(),detail()]
   page.evaluate("document.querySelector('#previewOverlay')?.classList.remove('open')")
  if kind in ('tablet-portrait','phone') and vis(hand):
   tap(hand);out['hand_first']=[quick(),detail()]
 return out

with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1440,'height':900});vs=ctx.new_page();pvp=ctx.new_page();vs.route('**/*',lambda r:r.abort());pvp.route('**/*',lambda r:r.abort());vs.set_default_timeout(2500);pvp.set_default_timeout(2500);errs={'vs':[],'pvp':[]};vs.on('pageerror',lambda e:errs['vs'].append(str(e)));pvp.on('pageerror',lambda e:errs['pvp'].append(str(e)))
 print('boot',flush=True);boot(vs,'vs');boot(pvp,'pvp');snap=make_fixture(vs);assert snap['pvpPrivateStateMasked'] and all(x=='__HIDDEN_CARD_BACK__' for x in snap['appState']['aiHand']);res={'viewports':[],'interactions':{},'page_errors':errs}
 for w,h,k in VPS:
  print(w,h,k,flush=True);apply_device(vs,w,h,k);apply_device(pvp,w,h,k);import_snap(vs,'vs',snap);import_snap(pvp,'pvp',snap);row={'viewport':f'{w}x{h}','kind':k,'components':{},'overflow':{'vs':vs.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+2'),'pvp':pvp.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth+2')}}
  if os.environ.get('GL_SCREENSHOTS'):
   (ART/'screenshots').mkdir(parents=True,exist_ok=True);vs.screenshot(path=str(ART/'screenshots'/f'vsai15-{w}x{h}.png'),full_page=True,timeout=10000);pvp.screenshot(path=str(ART/'screenshots'/f'pvp2rb-{w}x{h}.png'),full_page=True,timeout=10000)
  ok=True; all_a=metrics_all(vs); all_c=metrics_all(pvp)
  for name in COMP:
   a=all_a.get(name);c=all_c.get(name)
   if a is None and c is None:d=None;gp=sp=True
   elif a is None or c is None:d=None;gp=sp=False
   else:d=max(abs(a['rect'][q]-c['rect'][q]) for q in ['x','y','w','h']);gp=d<=2.0;sp=a['style']==c['style']
   row['components'][name]={'vs':a['rect'] if a else None,'pvp':c['rect'] if c else None,'delta':d,'geometry_pass':gp,'style_pass':sp};ok=ok and gp and sp
  row['pass']=ok and not row['overflow']['pvp'];res['viewports'].append(row)
  if not os.environ.get('GL_SKIP_INTERACTIONS') and (w,h) in [(1440,900),(1180,820),(768,1024),(390,844)]:res['interactions'][row['viewport']]={'vs':interaction(vs,k),'pvp':interaction(pvp,k)}
 res['geometry_pass']=all(r['pass'] for r in res['viewports']);res['interaction_pass']=all(v['vs']==v['pvp'] for v in res['interactions'].values());(ART/'browser-parity-results.json').write_text(json.dumps(res,indent=2),encoding='utf-8');print(json.dumps({'geometry_pass':res['geometry_pass'],'interaction_pass':res['interaction_pass'],'fails':[r['viewport'] for r in res['viewports'] if not r['pass']],'interactions':res['interactions'],'errors':errs},indent=2),flush=True);b.close();sys.exit(0 if res['geometry_pass'] and res['interaction_pass'] else 1)
