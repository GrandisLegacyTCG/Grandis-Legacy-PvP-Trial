import asyncio,json,re
from pathlib import Path
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[2]
html=(root/'index.html').read_text()
sources=re.findall(r'<script src="([^"]+)"\s*></script>',html)
html=re.sub(r'<script src="[^"]+"\s*></script>','',html)
html=re.sub(r'<link rel="stylesheet" href="[^"]+">','',html)
qa=r'''
  window.GL_RC11_QA_SELF_TEST = function(){
    initCards();var before=appState,beforeMatch=matchStarted,beforeSuppress=SUPPRESS_RENDER,beforeShuffle=STARTUP_SHUFFLE_ENABLED;
    SUPPRESS_RENDER=true;STARTUP_SHUFFLE_ENABLED=false;matchStarted=true;
    var results=[];
    function check(label,fn){try{results.push({name:label,ok:true,data:fn()||{}});}catch(e){results.push({name:label,ok:false,error:String(e.stack||e)});}}
    function assert(c,m){if(!c)throw new Error(m);}
    function fresh(side,phase){var st=buildInitialMatchState();appState=st;st.turn=side||'PLAYER';st.phase=phase||'Reform';st.round=5;st.pending=null;st.responseWindow=null;st.gameOver=false;st.preGame=null;st.openingFlowCompleted=true;
      st.playerHeroes.CENTER.card_id='S0-CLE-H002';st.aiHeroes.CENTER.card_id='S0-CLE-H002';st.playerHeroes.CENTER.exhausted=false;st.aiHeroes.CENTER.exhausted=false;
      ['PLAYER','AI'].forEach(function(p){LANE_ORDER.forEach(function(l){var h=sideHeroes(st,p)[l];h.hp=h.maxHp;h.statuses=[];});});
      st.playerManaPoolCards=[];st.aiManaPoolCards=[];for(var i=0;i<10;i++){st.playerManaPoolCards.push(makeManaShard('GENERIC','','PLAYER','rc11p'+i));st.aiManaPoolCards.push(makeManaShard('GENERIC','','AI','rc11a'+i));}
      syncManaCountForSide(st,'PLAYER');syncManaCountForSide(st,'AI');return st;
    }
    try{
      check('S0 printed Double Casting rows vs S1 legacy',function(){var c=card('S0-MAG-018');var a=branchEffectText(c,{card_id:'S0-MAG-H002'}),b=branchEffectText(c,{card_id:'S0-MAG-H003'});assert(/MANA COST \+2/.test(a),'S0 Rank 2 print incorrect');assert(/This turn/i.test(a)&&/This turn/i.test(b),'S0 rows require THIS TURN');return{rank2:a,rank3:b};});
      check('All-HP-full healing requires damaged recipient for both sides',function(){var ids=['S0-ITM-001','S0-ITM-002','S0-CLE-011','S0-CLE-016','S0-CLE-017','S0-CLE-023','S0-CLE-027','S0-CLE-030'];var result={};for(var side of ['PLAYER','AI']){var st=fresh(side);st.phase='Reform';st[side==='PLAYER'?'playerHand':'aiHand']=ids.slice();var out={};for(var id of ids){var c=card(id),play=legalPlayStateFor(st,side,id);out[id]={valid:play.can,reasons:play.reasons,heal:isHealCard(c),all:isHealAllCard(c)};assert(!play.can,'Full-HP '+side+' can play '+id+': '+JSON.stringify(out[id]));assert(!getLegalActions(side,st).some(function(a){return a.type==='PLAY_CARD'&&a.card_id===id;}),'AI/Player generated full HP heal '+id);}
        result[side]=out;}
       return result;});
      check('Damaged target legal, full HP and Bleed excluded',function(){var st=fresh('PLAYER');st.playerHeroes.RIGHT.hp=st.playerHeroes.RIGHT.maxHp-10;st.playerHeroes.LEFT.statuses=[];var c=card('S0-CLE-011');assert(legalPlayStateFor(st,'PLAYER',c.card_id).can,'Damaged target should enable Flash Heal');var lanes=legalTargetLanesFor(st,'PLAYER',c.card_id,'CENTER');assert(lanes.length===1&&lanes[0]==='RIGHT','Flash Heal invalid target lanes '+lanes);st.playerHeroes.RIGHT.statuses=[{name:'Bleed',duration:1}];assert(!legalPlayStateFor(st,'PLAYER',c.card_id).can,'Bleed should block Flash Heal');return{lanes:lanes};});
      check('Area Heal needs damaged ally, no mandatory per-hero picker',function(){var st=fresh('PLAYER');st.playerHeroes.LEFT.hp=st.playerHeroes.LEFT.maxHp-10;var c=card('S0-CLE-016');assert(legalPlayStateFor(st,'PLAYER',c.card_id).can,'Damaged ally should enable Sanctuary');assert(!needsCommitTargetForActor(c,'PLAYER',st,'CENTER'),'Area Heal should not ask for single-target picker');return{kind:isHealAllCard(c),phase:cardPhase(c)};});
      check('Hybrid Attack+Heal remains legal at full allied HP',function(){var st=fresh('PLAYER','Battle');st.playerHeroes.CENTER.card_id='S0-CLE-H002';st.playerHeroes.CENTER.exhausted=false;var c=card('S0-CLE-009');var legal=legalPlayStateFor(st,'PLAYER',c.card_id);assert(legal.can,'Holy Blast Attack+Heal should be playable at full HP: '+JSON.stringify(legal));return{isAttack:isAttackCard(c),isHeal:isHealCard(c)};});
      check('Double Casting cost, exhaust, expiry and turn timing',function(){var st=fresh('PLAYER','Deploy');var c=card('S0-MAG-018');var a=st.playerHeroes.CENTER; a.card_id='S0-MAG-H002';a.hp=100;a.maxHp=100;a.exhausted=false;
         var cost2=cardPlayCostForSource(c,a,st,'PLAYER');var pol2=attachmentPolicyForCard(c,a);assert(cost2===3,'S0 rank2 Double Casting cost should be 3, got '+cost2);assert(!sourceShouldExhaust(c,a),'S0 rank2 BUFF Exhausts');assert(pol2.remaining_count===1,'S0 rank2 duration should be this turn');
         a.card_id='S0-MAG-H003';var cost3=cardPlayCostForSource(c,a,st,'PLAYER'),pol3=attachmentPolicyForCard(c,a);assert(cost3===1,'S0 rank3 cost should be 1, got '+cost3);assert(!sourceShouldExhaust(c,a),'S0 rank3 BUFF Exhausts');assert(pol3.remaining_count===1,'S0 rank3 duration should be this turn');return{cost2,cost3,remaining2:pol2.remaining_count,remaining3:pol3.remaining_count};});
      check('Real rank2 PLAY creates active same-turn buff at cost 3',function(){var st=fresh('PLAYER','Deploy');st.playerHeroes.CENTER.card_id='S0-MAG-H002';st.playerHeroes.CENTER.exhausted=false;st.playerHeroes.CENTER.attachments=[null,null];st.playerHand=['S0-MAG-018'];var beforePool=st.playerManaPoolCards.length;var valid=legalPlayStateFor(st,'PLAYER','S0-MAG-018');assert(valid.can&&valid.cost===3,'Double Casting initial legality fails: '+JSON.stringify(valid));beginPlayFromHand(0);assert(st.pending&&st.pending.type==='source_selection','Source selection missing: '+JSON.stringify(st.pending));chooseHeroFromBoard('PLAYER','CENTER');
          if(st.pending&&st.pending.type==='mana_shard_payment_choice')commitManaShardPaymentChoice();
          assert(!st.playerHeroes.CENTER.exhausted,'Rank2 changed Hero to Exhausted');assert(beforePool-st.playerManaPoolCards.length===3,'Rank2 did not pay 3 physical Mana');
          var att=(st.activeAttachments||[]).find(function(x){return x.card_id==='S0-MAG-018';});assert(att,'Rank2 did not attach');assert(att.active_from_round===st.round,'Rank2 not active this round');assert(hasDoubleCasting(st.playerHeroes.CENTER),'Rank2 status not active');st.phase='End';expireEndPhaseAttachmentsForSide(st,'PLAYER');assert(!hasDoubleCasting(st.playerHeroes.CENTER),'Rank2 buff did not expire this turn');return{cost:3,attachmentThisTurn:true,expired:true};});
      check('Rank2 same-turn Magical Attack triggers two independent Responses',function(){var st=fresh('PLAYER','Deploy');st.pvpHumanVsHuman=true;st.playerHeroes.CENTER.card_id='S0-MAG-H002';st.playerHeroes.CENTER.exhausted=false;st.playerHeroes.CENTER.attachments=[null,null];st.playerHand=['S0-MAG-018'];st.aiHeroes.CENTER.hp=200;st.aiHeroes.CENTER.maxHp=200;beginPlayFromHand(0);chooseHeroFromBoard('PLAYER','CENTER');if(st.pending&&st.pending.type==='mana_shard_payment_choice')commitManaShardPaymentChoice();assert(hasDoubleCasting(st.playerHeroes.CENTER),'Double Casting not active on owner turn');st.phase='Battle';st.playerHand=['S0-MAG-003'];beginPlayFromHand(0);if(st.pending&&st.pending.type==='source_selection')chooseHeroFromBoard('PLAYER','CENTER');if(st.pending&&st.pending.type==='target_selection')chooseHeroFromBoard('AI','CENTER');if(st.pending&&st.pending.type==='mana_shard_payment_choice')commitManaShardPaymentChoice();assert(st.responseWindow,'First Magical Attack did not create Response Window: '+JSON.stringify(st.pending));resolveResponseWindow(null);assert(st.pending&&st.pending.type==='double_casting_target_selection','Second target not requested: '+JSON.stringify(st.pending));chooseHeroFromBoard('AI','CENTER');assert(st.responseWindow,'Second activation did not create Response Window');resolveResponseWindow(null);assert(st.aiHeroes.CENTER.hp===130,'Double Casting expected 30 first hit + 40 second hit (Burn adds +10), got '+st.aiHeroes.CENTER.hp);assert(!hasDoubleCasting(st.playerHeroes.CENTER),'Double Casting not consumed after two attacks');return{firstAndSecondDamage:70,secondHitBurnBonus:10,activeSameTurn:true};});
      check('AI planning of rank2 Double Casting is same-turn',function(){var st=fresh('AI','Deploy');st.aiHeroes.CENTER.card_id='S0-MAG-H002';st.aiHeroes.CENTER.exhausted=false;st.aiHand=['S0-MAG-018','S0-MAG-003'];var acts=getLegalActions('AI',st).filter(function(a){return a.card_id==='S0-MAG-018';});assert(acts.length>0,'AI no Double Casting action');var p=aiPlanForSetupAction(st,acts[0]);assert(p&&p.not_before_round===st.round,'AI wrongly delayed rank2: '+JSON.stringify(p));return{plan:p};});
      return {ok:results.every(function(x){return x.ok;}),passed:results.filter(function(x){return x.ok;}).length,total:results.length,results:results};
    }finally{appState=before;matchStarted=beforeMatch;SUPPRESS_RENDER=beforeSuppress;STARTUP_SHUFFLE_ENABLED=beforeShuffle;}
  };
'''
async def run():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage']);page=await browser.new_page(viewport={'width':1600,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(html,wait_until='domcontentloaded');
  for f in sources:
   content=(root/f).read_text()
   if f=='engine/shared-app/app.bundle.js':
    assert content.rstrip().endswith('})();');content=content.rstrip()[:-5]+qa+'\n})();\n'
   await page.add_script_tag(content=content)
  await page.wait_for_timeout(350)
  ret=await page.evaluate('window.GL_RC11_QA_SELF_TEST()')
  for row in ret['results']:print(('PASS' if row['ok'] else 'FAIL'),row['name'],row.get('error','')[:1200])
  print('TOTAL',ret['passed'],'/',ret['total'],'pageerrors',errors[:5]);
  (root/'docs/qa/RC11_VALIDATOR_QA.json').write_text(json.dumps({'result':ret,'pageErrors':errors},indent=2,ensure_ascii=False))
  regressions={}
  for fn in ['GL_S0_TARGET_SELECTION_QA_SELF_TEST','GL_S0_ULTIMATE_TRIBUTE_QA_SELF_TEST','GL_S0_RC6_LINEAGE_EFFECT_REGRESSION_QA_SELF_TEST','GL_V6919_MANA_COMMIT_RESPONSE_CANCEL_QA_SELF_TEST','GL_V510_DOUBLE_CASTING_QA_SELF_TEST','GL_V642_FINAL_STABILITY_HERO_COMPONENT_QA_SELF_TEST']:
   try:
    out=await page.evaluate('(fn)=>typeof window[fn]==="function"?window[fn]():{ok:false,missing:true}',fn)
    regressions[fn]=out
    print('REGRESSION',fn,json.dumps(out,ensure_ascii=False)[:600]);
   except Exception as e:
    regressions[fn]={'ok':False,'error':str(e)}
    print('REGRESSION ERROR',fn,str(e)[:300])
  (root/'docs/qa/RC11_EXISTING_TEST_RESULTS.json').write_text(json.dumps(regressions,indent=2,ensure_ascii=False))
  await browser.close()
asyncio.run(run())
