from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.parse,mimetypes,json
root=Path(__file__).resolve().parents[2]
probe=r'''
window.GL_RC7_LEGACY_MATRIX_QA=function(){
 var oldApp=appState,match=matchStarted,sup=SUPPRESS_RENDER,oldDecks={PLAYER:decks.PLAYER,AI:decks.AI},out=[];
 try{initCards();SUPPRESS_RENDER=true;matchStarted=true;
  var starters=Object.keys(STARTER_DECK_OPTIONS||{});
  starters.forEach(function(key){
   var preset=STARTER_DECK_OPTIONS[key].deck;
   ['PLAYER','AI'].forEach(function(side){
    decks[side]=normalizeDeck(preset);
    var s=buildInitialMatchState();appState=s;s.preGame=null;s.pending=null;s.responseWindow=null;s.round=2;s.phase='Deploy';s.turn=side;
    LANE_ORDER.forEach(function(lane){var h=sideHeroes(s,side)[lane];var candidates=eligibleLegacyCardIdsForDefeatedHero(s,side,lane,h);
     out.push({preset:key,side:side,lane:lane,hero:heroIdFrom(h),heroClass:baseFamilyForHero(h),eligible:candidates.slice(),hasCandidate:candidates.length>0});
    });
   });
  });
  var s=buildInitialMatchState();appState=s;s.preGame=null;s.pending=null;s.responseWindow=null;s.turn='PLAYER';s.phase='Deploy';s.round=3;
  s.playerHeroes.LEFT.hp=0;var triggered=applyDefeatCheck(s,'PLAYER','LEFT');var original=s.playerHeroes.LEFT.card_id,pending=s.pending&&s.pending.type,choices=s.pending&&s.pending.candidates||[];
  if(s.pending&&s.pending.type==='legacy_defeat_choice')s.pending.selected_index=0;
  var confirmed=commitLegacyDefeatChoice();out.push({uiTest:true,triggered:triggered,pending:pending,choices:choices,confirmed:confirmed,was:original,now:s.playerHeroes.LEFT.card_id,legacy:isLegacyModeHero(s.playerHeroes.LEFT),remainingLegacy:s.playerLegacy.length});
  return out;
 }catch(e){return{error:String(e.stack||e),partial:out};}finally{decks.PLAYER=oldDecks.PLAYER;decks.AI=oldDecks.AI;appState=oldApp;matchStarted=match;SUPPRESS_RENDER=sup;}
};
'''
s=(root/'engine/shared-app/app.bundle.js').read_text();assert s.endswith('})();\n');js=s[:-len('})();\n')]+probe+'\n})();\n'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page();errors=[]
 def route(r):
  path=urllib.parse.unquote(urllib.parse.urlsplit(r.request.url).path).lstrip('/') or 'index.html';f=(root/path).resolve()
  if path=='engine/shared-app/app.bundle.js':r.fulfill(status=200,body=js,content_type='text/javascript');return
  if not f.is_relative_to(root) or not f.is_file():r.fulfill(status=404,body='404');return
  r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('**/*',route);page.on('pageerror',lambda e:errors.append(str(e)))
 html=(root/'index.html').read_text().replace('<head>','<head><base href="https://grandis-rc7-matrix.test/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=30000);page.wait_for_timeout(1100)
 ret=page.evaluate('window.GL_RC7_LEGACY_MATRIX_QA()');Path('/mnt/data/_rc7_regression/LEGACY_ALL_STARTER_QA.json').write_text(json.dumps(ret,indent=2));print('rows',len(ret) if isinstance(ret,list) else 'error', 'fails',[x for x in ret if not x.get('hasCandidate',True)] if isinstance(ret,list) else ret);print('last',json.dumps(ret[-1],indent=2) if isinstance(ret,list) else '');
 for fn in ['GL_S0_RC6_LINEAGE_EFFECT_REGRESSION_QA_SELF_TEST','GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST','GL_V400_ATTACHMENT_AUTHORITY_HOTFIX_QA_SELF_TEST']:
  try:
   x=page.evaluate(f'() => {{try{{return window.{fn}()}}catch(e){{return {{error:String(e)}}}}}}')
   print('selftest',fn,'=',str(x)[:350])
  except Exception as e: print('selftest error',fn,str(e)[:100])
 print('PAGEERROR',errors[:8]);b.close()
