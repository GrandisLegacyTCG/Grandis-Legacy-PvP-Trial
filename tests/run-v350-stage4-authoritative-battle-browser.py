#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; DATA=ROOT/'tests/artifacts/v350-stage4/server-flow.json'; OUT=ROOT/'tests/artifacts/v350-stage4/browser-flow.json'
assert DATA.exists(), 'run stage4 server-flow test first'
SERVER=json.loads(DATA.read_text())

def stripped():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=stripped(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASE=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']
NET=(P/'js/pvp-network.js').read_text()
end="  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();\n})();"
assert end in NET
NET=NET.replace(end,"  window.__STAGE4_NET={state:state,importServerBoard:importServerBoard};\n})();",1)

def boot(page):
 page.route('**/*',lambda r:r.abort())
 page.set_content(HTML); page.add_style_tag(content=CSS)
 page.evaluate("""()=>{window.__AUDIO_PLAYS=[];window.Audio=class FakeAudio{constructor(src){this.src=src||'';this.preload='';this.volume=1;this.currentTime=0;}load(){}cloneNode(){return new window.Audio(this.src)}play(){window.__AUDIO_PLAYS.push(this.src);return Promise.resolve()}pause(){}addEventListener(){}removeEventListener(){}};}""")
 for f in BASE: page.add_script_tag(content=(P/f).read_text())
 page.add_script_tag(content=NET)
 page.evaluate("""()=>{window.__STAGE4_ORDER=[];const b=GL_LOCAL_AI_BRIDGE,a=GL_PVP_PRESENTATION_ADAPTER;const oa=b.playAuthoritativeBattleFeedbackAudio,ov=b.playAuthoritativeBattleFeedback,oi=a.importViewerSafeSnapshot;b.playAuthoritativeBattleFeedbackAudio=function(e){window.__STAGE4_ORDER.push('audio');return oa.call(this,e)};b.playAuthoritativeBattleFeedback=function(e){window.__STAGE4_ORDER.push('vfx');return ov.call(this,e)};a.importViewerSafeSnapshot=function(...args){window.__STAGE4_ORDER.push('import');return oi.apply(this,args)};}""")

def apply_event(page, scenario, seat, rev, event_override=None):
 event=dict(event_override or scenario['event']); event['revision']=rev
 return page.evaluate("""x=>{const b=GL_LOCAL_AI_BRIDGE,t=window.__STAGE4_NET;t.state.lastAppliedRevision=0;t.state.seenAnimationIds={};window.__STAGE4_ORDER=[];const board=b.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});board.pvpPrivateStateMasked=true;const s=board.appState;s.preGame=null;s.phase='Battle';s.turn='PLAYER';s.round=2;s.pvpHumanVsHuman=true;s.gameOver=false;s.playerHeroes.CENTER.card_id='S1-WAR-H001';s.aiHeroes.CENTER.card_id='S1-WAR-H001';s.playerHeroes.CENTER.hp=100;s.aiHeroes.CENTER.hp=100;s.playerHeroes.CENTER.maxHp=120;s.aiHeroes.CENTER.maxHp=120;const msg={local:{seat:x.seat,role:'player',name:x.seat===1?'Alice':'Bob',deckName:'Deck'},players:[{seat:1,name:'Alice',deckName:'Deck A',connected:true},{seat:2,name:'Bob',deckName:'Deck B',connected:true}],match:{status:'started',serverBoardRevision:x.rev,lastIntent:{processingMs:1},serverBoard:board,lastAnimationEvents:[x.event],lastAnimationEvent:x.event},room:{id:'STAGE4',generation:1},logs:[]};t.state.snapshot=msg;const before=window.__AUDIO_PLAYS.length;const ok=t.importServerBoard(false);return{ok,before,after:window.__AUDIO_PLAYS.length,event:x.event};}""", {'seat':seat,'rev':rev,'event':event})

def inspect(page,outcome):
 page.wait_for_timeout(180)
 return page.evaluate("""outcome=>{const target=document.querySelector('.hero-panel[data-side="AI"][data-lane="CENTER"] .hero-card-anchor')||document.querySelector('.hero-panel[data-side="AI"][data-lane="CENTER"] .heroImg');return{order:window.__STAGE4_ORDER.slice(),audio:window.__AUDIO_PLAYS.slice(),attack:document.querySelectorAll('.gl-battle-pattack,.gl-battle-mattack').length,defense:document.querySelectorAll('.gl-battle-pdef,.gl-battle-mdef').length,dodge:!!(target&&target.classList.contains('gl-battle-dodge-card')),negate:!!(target&&target.classList.contains('gl-battle-negate-card'))};}""",outcome)

def main():
 result={'ok':True,'scenarios':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  c=b.new_context(viewport={'width':1366,'height':768});p=c.new_page();boot(p)
  assert p.evaluate("typeof GL_LOCAL_AI_BRIDGE.playAuthoritativeBattleFeedbackAudio==='function' && typeof GL_LOCAL_AI_BRIDGE.playAuthoritativeBattleFeedback==='function'"), 'production battle feedback bridge methods missing'
  rev=100
  for sc in SERVER['scenarios']:
   seat=1 if sc['attacker']=='PLAYER' else 2; rev+=1
   before_calls=p.evaluate("window.__AUDIO_PLAYS.length")
   a=apply_event(p,sc,seat,rev); assert a['ok'],(sc,a)
   v=inspect(p,sc['outcome']); delta=len(v['audio'])-before_calls
   assert v['order'][:2]==['audio','import'],(sc,v['order'])
   assert 'vfx' in v['order'][2:],(sc,v['order'])
   assert delta==1,(sc,'audio delta',delta,v['audio'])
   if sc['outcome']=='hit': assert v['attack']>0,(sc,v)
   if sc['outcome']=='block': assert v['attack']>0 and v['defense']>0,(sc,v)
   if sc['outcome']=='dodge': assert v['attack']>0 and v['dodge'],(sc,v)
   if sc['outcome']=='negate': assert v['attack']>0 and v['defense']>0 and v['negate'],(sc,v)
   # Duplicate authoritative revision/event must not replay.
   audio_before=p.evaluate("window.__AUDIO_PLAYS.length");vfx_before=p.evaluate("window.__STAGE4_ORDER.filter(x=>x==='vfx').length")
   dup=p.evaluate("()=>window.__STAGE4_NET.importServerBoard(false)")
   p.wait_for_timeout(60)
   assert dup is False and p.evaluate("window.__AUDIO_PLAYS.length")==audio_before and p.evaluate("window.__STAGE4_ORDER.filter(x=>x==='vfx').length")==vfx_before,(sc,'duplicate replay')
   result['scenarios'].append({'attacker':sc['attacker'],'seat':seat,'outcome':sc['outcome'],'audioDelta':delta,'order':v['order'],'attackVfx':v['attack'],'defenseVfx':v['defense'],'dodgeVfx':v['dodge'],'negateVfx':v['negate']})
   p.wait_for_timeout(900)
  # Muted canonical event must produce zero audio and must not poison the same-family dedup ledger.
  hit=next(x for x in SERVER['scenarios'] if x['attacker']=='PLAYER' and x['outcome']=='hit')
  p.wait_for_timeout(250)
  btn=p.locator('#soundToggleButton'); assert btn.count()==1
  if btn.get_attribute('aria-pressed')!='false': btn.click()
  assert btn.get_attribute('aria-pressed')=='false'
  muted_event=dict(hit['event']); muted_event['id']='stage4-muted-hit'; rev+=1
  before=p.evaluate("window.__AUDIO_PLAYS.length"); a=apply_event(p,hit,1,rev,muted_event); assert a['ok']; muted_after=p.evaluate("window.__AUDIO_PLAYS.length"); assert muted_after==before,(before,muted_after)
  # Turn Sound ON immediately (<180 ms) and deliver a new canonical hit of the same family.
  btn=p.locator('#soundToggleButton'); btn.click(); assert btn.get_attribute('aria-pressed')=='true'
  audible_event=dict(hit['event']); audible_event['id']='stage4-audible-hit'; rev+=1
  a2=apply_event(p,hit,1,rev,audible_event); audible_after=p.evaluate("window.__AUDIO_PLAYS.length"); assert a2['ok'] and audible_after==before+1,(before,audible_after)
  result['soundOff']=True; result['offOnSameFamily']=True; result['duplicateEvent']=False
  c.close();b.close()
 OUT.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));return 0
if __name__=='__main__':
 try: sys.exit(main())
 except Exception:
  import traceback;traceback.print_exc();sys.exit(1)
