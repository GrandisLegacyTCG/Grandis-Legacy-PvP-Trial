from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.parse,mimetypes,json
root=Path(__file__).resolve().parents[2]
js=root/'engine/shared-app/app.bundle.js'
probe=r'''
window.GL_RC7_PLAYER_CONDITION_PAYMENT_QA=function(){
 var old=appState,match=matchStarted,sup=SUPPRESS_RENDER;
 try{initCards();SUPPRESS_RENDER=true;matchStarted=true;
 var s=buildInitialMatchState();appState=s;s.turn='PLAYER';s.preGame=null;s.round=3;s.phase='Deploy';s.pending=null;s.responseWindow=null;
 s.playerHand=['S0-CLE-028'];s.playerDiscard=['S0-CLE-027','S0-WAR-001'];s.playerDeck=['S0-MAG-001','S0-MAG-002','S0-WAR-002','S0-ARC-001'];
 s.playerHeroes.LEFT.card_id='S0-CLE-H008';s.playerHeroes.LEFT.hp=90;s.playerHeroes.LEFT.maxHp=90;
 drawManaCards(s,'PLAYER',4,'QA_SETUP');
 var action={card_id:'S0-CLE-028',hand_index:0,side:'PLAYER',source_side:'PLAYER',source_lane:'LEFT',source_card_id:'S0-CLE-H008',target_side:'PLAYER',target_lane:'LEFT'};
 var before={hand:s.playerHand.slice(),discard:s.playerDiscard.slice(),deck:s.playerDeck.slice(),pool:manaPoolCardsForSide(s,'PLAYER').length};
 var open=commitPlayedCard(s,action), step1={pending:s.pending&&s.pending.type,resolve_to:s.pending&&s.pending.resolve_to,deck:s.playerDeck.slice(),discard:s.playerDiscard.slice(),mana:manaPoolCardsForSide(s,'PLAYER').length};
 if(s.pending&&s.pending.type==='card_search_choice')s.pending.selected_indices=[0];
 var selected=commitCardSearchChoice(), step2={pending:s.pending&&s.pending.type,deck:s.playerDeck.slice(),discard:s.playerDiscard.slice(),mana:manaPoolCardsForSide(s,'PLAYER').length};
 var paid=s.pending&&s.pending.type==='mana_shard_payment_choice'?commitManaShardPaymentChoice():null;
 var after={pending:s.pending&&s.pending.type,deck:s.playerDeck.slice(),discard:s.playerDiscard.slice(),hand:s.playerHand.slice(),mana:manaPoolCardsForSide(s,'PLAYER').length,logs:s.log.slice(-6)};
 return {open:open,step1:step1,selected:selected,step2:step2,paid:paid,before:before,after:after};
 }catch(e){return{error:String(e.stack||e)};}finally{appState=old;matchStarted=match;SUPPRESS_RENDER=sup;}
};
'''
s=js.read_text();assert s.endswith('})();\n');inject=s[:-len('})();\n')]+probe+'\n})();\n'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page();errors=[]
 def route(r):
  path=urllib.parse.unquote(urllib.parse.urlsplit(r.request.url).path).lstrip('/') or 'index.html';f=(root/path).resolve()
  if path=='engine/shared-app/app.bundle.js':r.fulfill(status=200,body=inject,content_type='text/javascript');return
  if not f.is_relative_to(root) or not f.is_file():r.fulfill(status=404,body='404');return
  r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('**/*',route);page.on('pageerror',lambda e:errors.append(str(e)))
 html=(root/'index.html').read_text().replace('<head>','<head><base href="https://grandis-rc7-player.test/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=30000);page.wait_for_timeout(900)
 ret=page.evaluate('window.GL_RC7_PLAYER_CONDITION_PAYMENT_QA()'); print(json.dumps(ret,indent=2));Path('/mnt/data/_rc7_regression/PLAYER_CONDITION_MANA_QA.json').write_text(json.dumps(ret,indent=2));print('ERRORS',errors);b.close()
