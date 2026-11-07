from pathlib import Path
from playwright.sync_api import sync_playwright
import urllib.parse,mimetypes,json
root=Path(__file__).resolve().parents[2]
js=root/'engine/shared-app/app.bundle.js'
probe=r'''
window.GL_RC7_AUDIT_PROBE=function(){
 var oapp=appState, omatch=matchStarted, osuppress=SUPPRESS_RENDER, out={};
 try{
  initCards(); SUPPRESS_RENDER=true; matchStarted=true;
  out.bards=CARDS.filter(function(c){return c.family==='Hero'&&/Bard|Maestro/.test(JSON.stringify(c.identity||{})+' '+c.name+' '+JSON.stringify(c.printed||{}));}).map(function(c){return{id:c.card_id,name:c.name,identity:c.identity&&c.identity.display_class};});
  var cases=[['S0-ARC-028',['S0-ARC-026','S0-CLE-026']],['S0-ARC-029',['S0-CLE-026']],['S0-ARC-030',['S0-ARC-026','S0-ARC-026']],['S0-ARC-031',['S0-ARC-026','S0-CLE-027']],['S0-CLE-028',['S0-CLE-027']],['S0-CLE-030',['S0-CLE-026','S0-CLE-027']],['S0-CLE-031',['S0-ARC-026','S0-CLE-026','S0-CLE-027']]];
  out.cards=[];
  cases.forEach(function(t){var s=buildInitialMatchState();appState=s;s.preGame=null;s.round=2;s.turn='PLAYER';s.phase='Battle';s.pending=null;s.responseWindow=null;
   s.playerDiscard=t[1].concat(['S0-WAR-001']);s.playerDeck=['S0-MAG-001','S0-WAR-002','S0-CLE-002','S0-ARC-001'];
   var c=card(t[0]),spec=discardConditionSpec(c),choices=t[1].map(function(id,i){return{card_id:id,discard_index:i};}),action={s0_discard_condition_picks:choices};
   var before={deck:s.playerDeck.slice(),discard:s.playerDiscard.slice()},can=discardConditionCanPay(s,'PLAYER',c),valid=validateSelectedDiscardCondition(s,'PLAYER',c,action),n=consumeS0DiscardCondition(s,'PLAYER',c,action),once=consumeS0DiscardCondition(s,'PLAYER',c,action),tot=Object.keys(S0_NOTE_CARD_IDS).reduce(function(acc,k){var id=S0_NOTE_CARD_IDS[k];acc[k]={returned:s.playerDeck.filter(function(v){return v===id;}).length,remains:s.playerDiscard.filter(function(v){return v===id;}).length};return acc;},{});
   out.cards.push({id:t[0],name:cardName(c),spec:spec,before:before,can:can,valid:valid,returned:n,second_commit:once,after:{deck:s.playerDeck.slice(),discard:s.playerDiscard.slice()},tot:tot,log:s.log&&s.log.slice(-1)[0]});
  });
  var s=buildInitialMatchState();appState=s;s.playerDiscard=['S0-ARC-026'];s.playerDeck=['S0-WAR-001'];var c=card('S0-ARC-030'),a={s0_discard_condition_picks:[{card_id:'S0-ARC-026',discard_index:0}]};
  out.reject={before:{deck:s.playerDeck.slice(),discard:s.playerDiscard.slice()},can:discardConditionCanPay(s,'PLAYER',c),valid:validateSelectedDiscardCondition(s,'PLAYER',c,a),badValidate:validateSelectedDiscardCondition(s,'PLAYER',c,{s0_discard_condition_picks:[{card_id:'S0-ARC-026',discard_index:44}]})};
  out.legacy={};
  for (var side of ['PLAYER','AI']){var s2=buildInitialMatchState();appState=s2;s2.preGame=null;s2.pending=null;s2.responseWindow=null;s2.phase='Deploy';s2.turn=side;
   var slots=sideHeroes(s2,side),d=s2[side==='AI'?'aiLegacy':'playerLegacy'];out.legacy[side]={slots:LANE_ORDER.map(function(l){var h=slots[l];return{lane:l,hero:heroIdFrom(h),name:cardName(card(heroIdFrom(h))),family:baseFamilyForHero(h),candidates:eligibleLegacyCardIdsForDefeatedHero(s2,side,l,h)}}),deckCount:d.length};
   slots.LEFT.hp=0;var applied=applyDefeatCheck(s2,side,'LEFT');out.legacy[side].after={applied:applied,pending:s2.pending&&s2.pending.type,card_id:slots.LEFT.card_id,isLegacy:isLegacyModeHero(slots.LEFT),gameOver:s2.gameOver,log:(s2.log||[]).slice(-3)};
  }
  return out;
 }catch(e){return{error:String(e.stack||e),partial:out};}
 finally{appState=oapp;matchStarted=omatch;SUPPRESS_RENDER=osuppress;}
};
'''
orig=js.read_text();assert orig.endswith('})();\n');modified=orig[:-len('})();\n')]+probe+'\n})();\n'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1400,'height':900});err=[];missing=[]
 def route(r):
  path=urllib.parse.unquote(urllib.parse.urlsplit(r.request.url).path).lstrip('/') or 'index.html';f=(root/path).resolve()
  if path=='engine/shared-app/app.bundle.js':r.fulfill(status=200,body=modified,content_type='text/javascript');return
  if not f.is_relative_to(root) or not f.is_file():missing.append(path);r.fulfill(status=404,body='404');return
  r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
 page.route('**/*',route)
 page.on('pageerror',lambda e:err.append(str(e)))
 html=(root/'index.html').read_text().replace('<head>','<head><base href="https://grandis-rc7-audit.test/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=30000);page.wait_for_timeout(900)
 print('BOOT',err[:2],'FUN',page.evaluate('typeof window.GL_RC7_AUDIT_PROBE'))
 result=page.evaluate('window.GL_RC7_AUDIT_PROBE()');Path('/mnt/data/_rc7_regression/BARD_DISCARD_AND_LEGACY_RAW.json').write_text(json.dumps(result,indent=2,ensure_ascii=False));print(json.dumps(result,indent=2,ensure_ascii=False)[:12000]);print('ERRORS',err[:8], 'MISSING',missing[:8]);b.close()
