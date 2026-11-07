from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.parse,mimetypes,json
root=Path(__file__).resolve().parents[2]
js=root/'engine/shared-app/app.bundle.js'
probe=r'''
window.GL_RC7_CONDITION_E2E_PROBE=function(){
 var old=appState, match=matchStarted, sup=SUPPRESS_RENDER, out=[];
 try{
  initCards(); SUPPRESS_RENDER=true;matchStarted=true;
  var cases=[['S0-ARC-028',['S0-ARC-026','S0-CLE-026'],'Battle'],['S0-ARC-030',['S0-ARC-026','S0-ARC-026'],'Battle'],['S0-ARC-031',['S0-ARC-026','S0-CLE-027'],'Battle'],['S0-CLE-028',['S0-CLE-027'],'Deploy'],['S0-CLE-030',['S0-CLE-026','S0-CLE-027'],'Reform'],['S0-CLE-031',['S0-ARC-026','S0-CLE-026','S0-CLE-027'],'Battle']];
  cases.forEach(function(row){var id=row[0],s=buildInitialMatchState();appState=s;s.preGame=null;s.phase=row[2];s.turn='AI';s.round=4;s.pending=null;s.responseWindow=null;s.aiHeroes.LEFT.card_id='S0-CLE-H008';s.aiHeroes.LEFT.hp=70;s.aiHeroes.LEFT.maxHp=90;s.aiHeroes.LEFT.exhausted=false;
   s.aiHeroes.CENTER.card_id='S0-CLE-H009';s.aiHeroes.CENTER.hp=80;s.aiHeroes.CENTER.maxHp=90;s.aiHeroes.CENTER.exhausted=false;
   s.aiDiscard=row[1].concat(['S0-WAR-001']);s.aiHand=[id];s.aiDeck=['S0-MAG-001','S0-MAG-002','S0-MAG-003','S0-MAG-004','S0-MAG-005','S0-WAR-001'];
   // Keep Mana physical conservation but guarantee enough cards for the cost.
   drawManaCards(s,'AI',9,'QA_SETUP');
   var sl=id==='S0-CLE-031'?'CENTER':'LEFT', h=sideHeroes(s,'AI')[sl];
   var action={card_id:id,hand_index:0,side:'AI',source_side:'AI',source_lane:sl,source_card_id:heroIdFrom(h),target_side:id==='S0-CLE-028'?'AI':'PLAYER',target_lane:'LEFT'};
   var pre={discard:s.aiDiscard.slice(),deck:s.aiDeck.slice(),hand:s.aiHand.slice(),hp:s.playerHeroes.LEFT.hp,mana:s.aiMana};
   var legal=validateAction(s,'AI',Object.assign({type:'PLAY_CARD'},action),{});
   var attempted=commitPlayedCard(s,action);
   var picked=action.s0_discard_condition_picks||[];
   var post={discard:s.aiDiscard.slice(),deck:s.aiDeck.slice(),hand:s.aiHand.slice(),mana:s.aiMana,pending:s.pending&&s.pending.type,rw:!!s.responseWindow};
   out.push({id:id,name:cardName(card(id)),phase:row[2],sourceClass:heroClass(h),legal:legal,attempted:attempted,picked:picked,returned:action.s0_condition_return_count,committed:action._s0_condition_committed,pre:pre,post:post,log:(s.log||[]).slice(-7)});
  });
  return out;
 }catch(e){return{error:String(e.stack||e),partial:out};}
 finally{appState=old;matchStarted=match;SUPPRESS_RENDER=sup;}
};
'''
s=js.read_text();assert s.endswith('})();\n');patched=s[:-len('})();\n')]+probe+'\n})();\n'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page();errors=[]
 def route(r):
  path=urllib.parse.unquote(urllib.parse.urlsplit(r.request.url).path).lstrip('/') or 'index.html';f=(root/path).resolve()
  if path=='engine/shared-app/app.bundle.js':r.fulfill(status=200,body=patched,content_type='text/javascript');return
  if not f.is_relative_to(root) or not f.is_file():r.fulfill(status=404,body='404');return
  r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('**/*',route);page.on('pageerror',lambda e:errors.append(str(e)))
 html=(root/'index.html').read_text().replace('<head>','<head><base href="https://grandis-rc7-e2e.test/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=30000);page.wait_for_timeout(1000)
 d=page.evaluate('window.GL_RC7_CONDITION_E2E_PROBE()');Path('/mnt/data/_rc7_regression/CONDITION_E2E_RAW.json').write_text(json.dumps(d,indent=2,ensure_ascii=False));print(json.dumps(d,indent=2,ensure_ascii=False)[:16000]); print('ERRORS',errors);b.close()
