#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v350-stage6'; OUT.mkdir(parents=True,exist_ok=True)

def stripped():
 s=(P/'index.html').read_text(); s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=stripped(); CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASE=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']
NET=(P/'js/pvp-network.js').read_text(); end="  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();\n})();"; assert end in NET
NET=NET.replace(end,"  window.__STAGE6_NET={state:state,importServerBoard:importServerBoard,handleSnapshot:handleSnapshot,syncMatchTimerState:syncMatchTimerState,visibleDeckName:visibleDeckName};\n})();",1)

def ctx_args(name,w,h):
 kw={'viewport':{'width':w,'height':h},'screen':{'width':w,'height':h}}
 if name=='phone': kw.update({'is_mobile':True,'has_touch':True,'user_agent':'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 Chrome/142 Safari/537.36'})
 return kw

def boot(page):
 errors=[]; page.on('pageerror',lambda e: errors.append(str(e))); page.route('**/*',lambda r:r.abort()); page.set_content(HTML); page.add_style_tag(content=CSS)
 page.add_script_tag(content="window.GL_APP_MODE='PVP';window.GL_PVP_LOCAL_NAME='Alice';window.GL_PVP_OPPONENT_NAME='Bob';window.GL_PVP_LOCAL_SIGNAL='excellent';window.GL_PVP_OPPONENT_SIGNAL='good';window.GL_PVP_LOCAL_LATENCY_MS=42;window.GL_PVP_OPPONENT_LATENCY_MS=95;window.Audio=class{constructor(src){this.src=src||'';this.volume=1;this.currentTime=0;}load(){}cloneNode(){return new window.Audio(this.src)}play(){return Promise.resolve()}pause(){}addEventListener(){}removeEventListener(){}};")
 for f in BASE: page.add_script_tag(content=(P/f).read_text())
 page.add_script_tag(content=NET)
 page.evaluate("""()=>{const t=window.__STAGE6_NET;t.state.connected=true;t.state.connectionState='online';t.state.latencyMs=42;t.state.opponentLatencyMs=95;t.state.role='player';window.__S6_FLIGHTS=[];new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes||[]){if(n.nodeType!==1)continue;const nodes=[];if(n.matches&&n.matches('.gl-flying-card'))nodes.push(n);if(n.querySelectorAll)nodes.push(...n.querySelectorAll('.gl-flying-card'));for(const x of nodes){requestAnimationFrame(()=>{const q=x.getBoundingClientRect();window.__S6_FLIGHTS.push({id:x.dataset.animationId||'',left:q.left,top:q.top,right:q.right,bottom:q.bottom,width:q.width,height:q.height,scrollY:window.scrollY,iw:innerWidth,ih:innerHeight});});}}}).observe(document.body,{childList:true,subtree:true});}""")
 return errors

def setup_and_stress(page, name):
 return page.evaluate("""async label=>{const b=GL_LOCAL_AI_BRIDGE,t=__STAGE6_NET,clone=x=>JSON.parse(JSON.stringify(x));const longA='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',longB='123456789012345678901234567890';let board=b.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});let s=board.appState;s.preGame=null;s.phase='Battle';s.turn='PLAYER';s.pvpHumanVsHuman=true;s.gameOver=false;s.playerDeckName=longA;s.aiDeckName=longB;s.playerHeroes.CENTER.card_id='S1-WAR-H001';s.aiHeroes.CENTER.card_id='S1-WAR-H001';// Make the Hand wide enough to exercise horizontal preservation on phone.
if((s.playerHand||[]).length<10){const take=(s.playerDeck||[]).splice(0,Math.min(10-(s.playerHand||[]).length,(s.playerDeck||[]).length));s.playerHand=(s.playerHand||[]).concat(take);}board.pvpPrivateStateMasked=true;window.__S6_BASE_BOARD=clone(board);const startedAt=new Date(Date.now()-511000).toISOString();function msg(rev,brd,events){return{type:'snapshot',local:{clientId:'p1',seat:1,role:'player',name:'Alice',deckName:longA,deckKey:'CUSTOM',seatToken:'tok'},players:[{seat:1,name:'Alice',deckName:longA,connected:true},{seat:2,name:'Bob',deckName:longB,connected:true}],spectators:[],room:{id:'S6',generation:1},match:{status:'started',startedAt,finishedAt:null,serverBoard:clone(brd),serverBoardRevision:rev,lastIntent:null,lastAnimationEvents:events||[]},deckOptions:[]};}window.__S6_MSG=msg;t.handleSnapshot(msg(1,board,[]));await new Promise(r=>setTimeout(r,60));document.body.classList.remove('pvp-booting','pvp-lobby-mode');const hand=document.querySelector('.hand-area--player .handPanel');let requested=0;if(hand&&hand.scrollWidth>hand.clientWidth){requested=Math.min(90,hand.scrollWidth-hand.clientWidth);hand.scrollLeft=requested;hand.dispatchEvent(new Event('scroll',{bubbles:true}));}const samples=[];for(let rev=2;rev<=27;rev++){t.handleSnapshot(msg(rev,board,[]));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await new Promise(r=>setTimeout(r,4));const timers=[...document.querySelectorAll('[data-pvp-match-timer]')].map(x=>x.textContent);const ids=[...document.querySelectorAll('[data-pvp-identity-side]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({side:x.dataset.pvpIdentitySide,deck:(x.querySelector('.pvp-player-deck-name')||{}).textContent||'',signal:(x.querySelector('.pvp-connection-bar')||{}).dataset?.pvpSignalState||''}));const hp=document.querySelector('.hand-area--player .handPanel');samples.push({rev,timers,ids,scroll:hp?hp.scrollLeft:null});}const visibleTimers=[...document.querySelectorAll('[data-pvp-match-timer]')].map(x=>x.textContent);return{label,startedAt,requested,samples,visibleTimers,base:clone(board),longA,longB};}""",name)

def draw_gate(page, setup, mobile):
 # Execute a public authoritative Draw event over the production network/import/presentation path.
 return page.evaluate("""async x=>{const t=__STAGE6_NET,clone=v=>JSON.parse(JSON.stringify(v)),pre=clone(window.__S6_BASE_BOARD),post=clone(pre),s=post.appState;let card=(s.playerDeck||[])[0];if(!card)throw new Error('No Main Deck card for draw gate');s.playerDeck.shift();s.playerHand=(s.playerHand||[]).concat([card]);s.cardsDrawnThisTurn=s.cardsDrawnThisTurn||{PLAYER:0,AI:0};s.cardsDrawnThisTurn.PLAYER=Number(s.cardsDrawnThisTurn.PLAYER||0)+1;s.lastDrawnCardBySide=s.lastDrawnCardBySide||{};s.lastDrawnCardBySide.PLAYER=card;s.lastActualDrawEvent={type:'CARD_DRAWN',id:'stage6-canonical-draw',side:'PLAYER',card_id:card,hand_index:s.playerHand.length-1,reason:'MANDATORY_DRAW_PHASE'};s.presentationEvents=(s.presentationEvents||[]).concat([{type:'CARD_DRAWN',id:'stage6-canonical-draw',side:'PLAYER',card_id:card,hand_index:s.playerHand.length-1,reason:'MANDATORY_DRAW_PHASE'}]);const evt={id:'stage6-authoritative-draw',revision:28,kind:'draw',actor_side:'PLAYER',count:1,card_ids:[card],card_id:card,reason:'MANDATORY_DRAW_PHASE'};window.__S6_FLIGHTS.length=0;const beforeY=window.scrollY;const m=window.__S6_MSG(28,post,[evt]);t.handleSnapshot(m);await new Promise(r=>setTimeout(r,120));const during=window.__S6_FLIGHTS.slice();await new Promise(r=>setTimeout(r,700));const after=window.__S6_FLIGHTS.slice();const finalHand=[...document.querySelectorAll('[data-hand-side="PLAYER"]')].filter(n=>n.getBoundingClientRect().width>0);const timers=[...document.querySelectorAll('[data-pvp-match-timer]')].map(n=>n.textContent);const beforeDup=window.__S6_FLIGHTS.length;const dup=window.__S6_MSG(29,post,[evt]);dup.match.lastAnimationEvents[0].revision=29;t.handleSnapshot(dup);await new Promise(r=>setTimeout(r,650));return{card,beforeY,afterY:window.scrollY,during,after,flightCount:window.__S6_FLIGHTS.length,beforeDup,finalVisibleHand:finalHand.length,timers};}""", {'mobile':mobile})

def validate_stress(data,name):
 assert len(data['samples'])==26,(name,len(data['samples']))
 for sm in data['samples']:
  assert sm['timers'] and all(v!='00:00' for v in sm['timers']),(name,'timer reset',sm)
  assert len(sm['ids'])>=2,(name,'identity missing',sm)
  for row in sm['ids']:
   exp='excellent' if row['side']=='PLAYER' else 'good'; assert row['signal']==exp,(name,'connection reset',row)
   assert len(row['deck'])==25 and row['deck'].endswith('...'),(name,'deck display',row)
 if name=='phone' and data['requested']>0:
  assert all(abs((sm['scroll'] or 0)-data['requested'])<=2 for sm in data['samples']),(name,'hand jump',data['requested'],[x['scroll'] for x in data['samples']])

def validate_draw(d,name,mobile):
 assert d['after'],(name,'no flying draw card')
 assert d['flightCount']==d['beforeDup'],(name,'duplicate draw replay',d)
 assert d['timers'] and all(x!='00:00' for x in d['timers']),(name,'timer draw regression',d)
 # At least one recorded flight must have actual geometry.
 assert any(f['width']>0 and f['height']>0 for f in d['after']),(name,'zero geometry',d['after'])
 if mobile:
  assert any(f['top']<f['ih'] and f['bottom']>0 for f in d['after']),(name,'mobile flight outside viewport',d['after'])
 else:
  assert abs(d['afterY']-d['beforeY'])<=1,(name,'desktop page moved during draw',d)

def main():
 out={'ok':True,'viewports':{}}
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for name,w,h in [('desktop',1366,768),('phone',390,844)]:
   ctx=browser.new_context(**ctx_args(name,w,h));page=ctx.new_page();errs=boot(page);setup=setup_and_stress(page,name);validate_stress(setup,name);draw=draw_gate(page,setup,name=='phone');validate_draw(draw,name,name=='phone');assert not errs,(name,errs);out['viewports'][name]={'stress':{'requestedHandScroll':setup['requested'],'samples':len(setup['samples']),'timer':setup['visibleTimers']},'draw':draw};ctx.close()
  # A safe responsive resize regression on the same production presentation bytes.
  ctx=browser.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();errs=boot(page);setup=setup_and_stress(page,'resize-source');validate_stress(setup,'resize-source');page.set_viewport_size({'width':768,'height':1024});page.evaluate("__STAGE6_NET.importServerBoard(true)");page.wait_for_timeout(80);res=page.evaluate("""()=>({timers:[...document.querySelectorAll('[data-pvp-match-timer]')].map(x=>x.textContent),rows:[...document.querySelectorAll('[data-pvp-identity-side]')].filter(x=>x.getBoundingClientRect().width>0).map(x=>({side:x.dataset.pvpIdentitySide,signal:x.querySelector('.pvp-connection-bar')?.dataset.pvpSignalState||'',deck:x.querySelector('.pvp-player-deck-name')?.textContent||''}))})""");assert res['timers'] and all(x!='00:00' for x in res['timers']),res;assert all(len(x['deck'])==25 for x in res['rows']),res;assert not errs,errs;out['resize768x1024']=res;ctx.close();browser.close()
 (OUT/'render-draw-browser.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2));return 0
if __name__=='__main__':
 try:sys.exit(main())
 except Exception:
  import traceback;traceback.print_exc();sys.exit(1)
