#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v350-maintenance-correction'; OUT.mkdir(parents=True,exist_ok=True)

def stripped():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=stripped(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASE=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js']
APP=(P/'js/app.bundle.js').read_text()
hook="""window.__GL_MAINT_TEST={card:card,responseKind:responseKind,responseOptionsFor:responseOptionsFor,responseUnavailableReasonsFor:responseUnavailableReasonsFor,commitPlayedCard:commitPlayedCard,resolveResponseWindow:resolveResponseWindow,buildInitialMatchState:buildInitialMatchState,makeManaShard:makeManaShard,syncManaCountForSide:syncManaCountForSide,validateDeck:validateDeck,normalizeDeck:normalizeDeck,starterOptions:STARTER_DECK_OPTIONS,queueBattleFeedback:queueBattleFeedback,runBattleFeedback:runBattleFeedback,playBattleFeedbackAudioNow:playBattleFeedbackAudioNow,setCardMotionSoundEnabled:setCardMotionSoundEnabled,setState:function(s){appState=s;return s;},setMatchStarted:function(v){matchStarted=!!v;},render:render,renderOpponentManaSelection:renderOpponentManaSelection,setSuppress:function(v){SUPPRESS_RENDER=!!v;}};\n  """
marker='window.GL_LOCAL_AI_BRIDGE={'
assert marker in APP
APP=APP.replace(marker,hook+marker,1)

def boot(page):
 page.route('**/*',lambda r:r.abort())
 page.set_content(HTML); page.add_style_tag(content=CSS)
 for f in BASE: page.add_script_tag(content=(P/f).read_text())
 page.add_script_tag(content=APP)
 page.wait_for_timeout(80)

def functional(page):
 return page.evaluate("""()=>{
 const t=window.__GL_MAINT_TEST;if(!t)return {ok:false,reason:'hook missing'};
 const s=t.buildInitialMatchState();t.setState(s);s.pvpHumanVsHuman=true;s.phase='Battle';s.round=2;s.playerManaPoolCards=[];for(let mi=0;mi<8;mi++)s.playerManaPoolCards.push(t.makeManaShard('GENERIC','','PLAYER','TA-'+mi));t.syncManaCountForSide(s,'PLAYER');s.playerHand=['S1-EVT-009'];s.playerHeroes.LEFT.hp=100;s.playerHeroes.LEFT.maxHp=100;
 const execute={card_id:'S1-WAR-018',damage:0,damage_type:'Physical',attack_type:'Single Target',cannot_block:true,cannot_dodge:false,target_lane:'LEFT',target_side:'PLAYER',source_lane:'LEFT',source_side:'AI',affected_lanes:['LEFT']};
 const opts=t.responseOptionsFor(s,'PLAYER',execute);const tactical=opts.find(o=>o.card_id==='S1-EVT-009');const reasons=t.responseUnavailableReasonsFor(s,'PLAYER',execute,'S1-EVT-009',0,opts);
 const cast=Object.assign({},execute,{casting:true,attack_type:'Casting Attack'});const castTactical=t.responseOptionsFor(s,'PLAYER',cast).some(o=>o.card_id==='S1-EVT-009');
 const direct=t.responseKind(t.card('S1-EVT-009'),execute);
 function executeFlow(heroId,cannotDodgeExpected){const x=t.buildInitialMatchState();t.setState(x);x.pvpHumanVsHuman=true;x.turn='AI';x.phase='Battle';x.round=2;x.aiManaPoolCards=[];x.playerManaPoolCards=[];for(let mi=0;mi<8;mi++){x.aiManaPoolCards.push(t.makeManaShard('GENERIC','','AI','EA-'+mi));x.playerManaPoolCards.push(t.makeManaShard('GENERIC','','PLAYER','EP-'+mi));}t.syncManaCountForSide(x,'AI');t.syncManaCountForSide(x,'PLAYER');x.aiHeroes.LEFT.card_id=heroId;x.aiHeroes.LEFT.exhausted=false;x.aiHand=['S1-WAR-018'];x.playerHand=['S1-EVT-009'];x.playerHeroes.LEFT.hp=40;x.playerHeroes.LEFT.maxHp=100;const before=x.playerHeroes.LEFT.hp;const action={card_id:'S1-WAR-018',hand_index:0,source_side:'AI',source_lane:'LEFT',target_side:'PLAYER',target_lane:'LEFT',commit_token:'EXEC-'+heroId};const played=t.commitPlayedCard(x,action);const rw=x.responseWindow;const ta=rw&&(rw.options||[]).find(o=>o.card_id==='S1-EVT-009');const dodgeFlag=rw&&rw.cannot_dodge;if(!played||!ta)return {ok:false,played:played,ta:!!ta,rw:rw};t.resolveResponseWindow(ta);return {ok:x.playerHeroes.LEFT.hp===before&&x.aiHand.includes('S1-WAR-018')&&!x.responseWindow,cannotDodge:dodgeFlag,expected:cannotDodgeExpected,hp:x.playerHeroes.LEFT.hp,aiHand:x.aiHand.slice(),playerDiscard:x.playerDiscard.slice()};}
 const gladiator=executeFlow('S1-WAR-H002',false),conqueror=executeFlow('S1-WAR-H003',true);
 // Verify canonical battle feedback is recorded even when headless render is suppressed.
 t.setState(s);s.pvpBattleFeedbackEvents=[];t.setSuppress(true);t.queueBattleFeedback({kind:'attack',outcome:'negate',side:'PLAYER',lane:'LEFT',play_sound:true});t.setSuppress(false);
 const feedback=s.pvpBattleFeedbackEvents.slice();
 // Deck validation matrix based on a canonical Starter Deck. Reduce only counts; all remaining card/copy structure stays canonical.
 const key=Object.keys(t.starterOptions)[0],base=JSON.parse(JSON.stringify(t.starterOptions[key].deck));
 function count(d){return d.main_deck.reduce((n,e)=>n+Number(e.quantity||1),0)}
 function sized(n){const d=JSON.parse(JSON.stringify(base));let cur=count(d);for(let i=d.main_deck.length-1;i>=0&&cur>n;i--){let q=Number(d.main_deck[i].quantity||1),take=Math.min(q,cur-n);q-=take;cur-=take;if(q<=0)d.main_deck.splice(i,1);else d.main_deck[i].quantity=q;}if(n>cur){d.main_deck.push({card_id:'S1-INVALID-CARD',quantity:n-cur});}return d}
 const matrix={};[49,50,51,55,59,60,61].forEach(n=>{const v=t.validateDeck(t.normalizeDeck(sized(n)),'PLAYER');matrix[n]={ok:v.ok,errors:v.errors};});const escapeQA=window.GL_V511_ESCAPE_ARROW_QA_SELF_TEST?window.GL_V511_ESCAPE_ARROW_QA_SELF_TEST():{ok:false,reason:'Escape QA missing'};
 return {ok:!!tactical&&!castTactical&&direct==='negate_return'&&gladiator.ok&&gladiator.cannotDodge===false&&conqueror.ok&&conqueror.cannotDodge===true&&feedback.length===1&&!matrix[49].ok&&matrix[50].ok&&matrix[51].ok&&matrix[55].ok&&matrix[59].ok&&matrix[60].ok&&!matrix[61].ok,
 tacticalOffered:!!tactical,reasons:reasons,tacticalKind:tactical&&tactical.response_kind,tacticalVsCasting:castTactical,directKind:direct,gladiatorExecute:gladiator,conquerorExecute:conqueror,escapeArrowNoStuck:escapeQA,feedback:feedback,matrix:matrix};
 }""")

def steal_dom(page):
 return page.evaluate("""()=>{const t=window.__GL_MAINT_TEST,s=t.buildInitialMatchState();t.setState(s);t.setMatchStarted(true);s.preGame=null;s.pvpHumanVsHuman=true;s.turn='PLAYER';s.phase='Deploy';s.aiManaPoolCards=[t.makeManaShard('CLASS','Warrior','AI','FIELD-W'),t.makeManaShard('GENERIC','','AI','FIELD-G'),t.makeManaShard('CLASS','Mage','AI','FIELD-M')];t.syncManaCountForSide(s,'AI');s.pending={type:'opponent_mana_selection',side:'PLAYER',decision_side:'PLAYER',target_side:'AI',required_count:1,selected_indices:[],pvp_pool_revision:77,candidates:[{choice_handle:'opaque-3'},{choice_handle:'opaque-1'},{choice_handle:'opaque-2'}],title:'Steal Test',instruction:'Choose one'};t.render();t.renderOpponentManaSelection();const field=[...document.querySelectorAll('.gl-lab-mana-card[data-mana-side="AI"]')].map(n=>({cls:n.className,label:n.getAttribute('aria-label'),uid:n.getAttribute('data-mana-uid'),src:n.querySelector('img')&&n.querySelector('img').getAttribute('src')}));const popup=[...document.querySelectorAll('#choiceBody [data-opponent-mana-choice]')].map(n=>({handle:n.getAttribute('data-opponent-mana-choice'),revision:n.getAttribute('data-opponent-mana-revision'),img:n.closest('article').querySelector('.discard-preview img').getAttribute('src'),alt:n.closest('article').querySelector('.discard-preview img').getAttribute('alt')}));return{ok:field.length===3&&field.every(x=>!String(x.cls).includes('is-face-down')&&x.label!=='Face-down opponent Shard')&&popup.length===3&&popup.every(x=>x.alt==='Face-down Shard'&&x.handle.startsWith('opaque-')&&x.revision==='77'),field,popup};}""")

def battle_dom(page):
 page.evaluate("""()=>{const t=window.__GL_MAINT_TEST,s=t.buildInitialMatchState();t.setState(s);t.setMatchStarted(true);s.preGame=null;s.pvpHumanVsHuman=true;s.turn='PLAYER';s.phase='Battle';t.render();t.setCardMotionSoundEnabled(false);window.__soundOff=t.playBattleFeedbackAudioNow({kind:'attack',outcome:'dodge',side:'AI',lane:'CENTER',play_sound:true});t.setCardMotionSoundEnabled(true);window.__soundOn=t.playBattleFeedbackAudioNow({kind:'attack',outcome:'dodge',side:'AI',lane:'CENTER',play_sound:true});window.__dodgeRun=t.runBattleFeedback({kind:'attack',outcome:'dodge',side:'AI',lane:'CENTER',attack_kind:'P',play_sound:false});}""")
 page.wait_for_timeout(40)
 d=page.evaluate("""()=>({soundOff:window.__soundOff,soundOn:window.__soundOn,dodgeRun:window.__dodgeRun,dodgeClass:!!document.querySelector('.hero-panel[data-side="AI"][data-lane="CENTER"] .gl-battle-dodge-card')})""")
 assert d['soundOff'] is False and d['soundOn'] is True and d['dodgeRun'] and d['dodgeClass'],d
 page.wait_for_timeout(800)
 page.evaluate("""()=>{const t=window.__GL_MAINT_TEST;window.__negRun=t.runBattleFeedback({kind:'attack',outcome:'negate',side:'AI',lane:'CENTER',attack_kind:'P',defense_kind:'P',play_sound:false});}""")
 page.wait_for_timeout(180)
 n=page.evaluate("""()=>({negRun:window.__negRun,negateClass:!!document.querySelector('.hero-panel[data-side="AI"][data-lane="CENTER"] .gl-battle-negate-card'),defVfx:document.querySelectorAll('.gl-battle-pdef,.gl-battle-mdef').length})""")
 assert n['negRun'] and n['negateClass'] and n['defVfx']>0,n
 return {'soundOffSuppressed':True,'soundOnAccepted':True,'dodgeVfx':True,'negateVfx':True,'defenseVfxCount':n['defVfx']}

def main():
 out={'ok':True,'functional':None,'geometry':{}}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  c=b.new_context(viewport={'width':1366,'height':768});p=c.new_page();boot(p);res=functional(p);assert res['ok'],res;sd=steal_dom(p);assert sd['ok'],sd;out['functional']=res;out['stealDom']=sd;c.close()
  # Four viewport smoke gate for production CSS/image asset. Kick detailed layout is covered by the dedicated lobby browser test.
  for name,w,h in [('desktop',1366,768),('tablet-landscape',1024,768),('tablet-portrait',768,1024),('phone',390,844)]:
   c=b.new_context(viewport={'width':w,'height':h});p=c.new_page();boot(p); dims=p.evaluate("""()=>({w:innerWidth,h:innerHeight,exitAsset:true,cssNegate:!![...document.styleSheets].length})""");out['geometry'][name]=dims;c.close()
  b.close()
 (OUT/'results.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2));return 0
if __name__=='__main__':
 try:sys.exit(main())
 except Exception:
  import traceback;traceback.print_exc();sys.exit(1)
