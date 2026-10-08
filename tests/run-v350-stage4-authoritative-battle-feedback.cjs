'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'tests/artifacts/v350-stage4/server-flow.json');
const TMP=path.join(ROOT,'.stage4-server-runtime-test.mjs');
function clone(x){return JSON.parse(JSON.stringify(x));}
function transformServer(){
  let s=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
  s=s.replace("import { WebSocketServer, WebSocket } from 'ws';", "class WebSocketServer { constructor(){ this.clients=new Set(); } on(){} handleUpgrade(){} }\nconst WebSocket={OPEN:1};");
  s=s.replace('const RUNTIME_SYNC_STATUS = verifyRuntimeSyncOrThrow(BASE);','const RUNTIME_SYNC_STATUS = {ok:true,testBypass:true};');
  const idx=s.lastIndexOf('server.listen(PORT, HOST, () => {');
  assert(idx>=0,'server.listen marker missing');
  s=s.slice(0,idx)+"\nexport { createRuntimeEngine, maskAppStateForSeat, animationEventsForRecipient, broadcast, snapshotFor, clearOneShotAnimationEvents };\n";
  fs.writeFileSync(TMP,s);
}
function generic(side,n,prefix){return Array.from({length:n},(_,i)=>({uid:`${prefix}:${i}`,kind:'GENERIC',class_name:'',owner_side:side,bottom_locked:false}));}
function seatFor(side){return side==='AI'?2:1;}
function other(side){return side==='AI'?'PLAYER':'AI';}
function responseSpec(outcome){
  if(outcome==='block')return{card:'S1-ITM-016',hero:'S1-WAR-H001'};
  if(outcome==='dodge')return{card:'S1-THF-003',hero:'S1-THF-H001'};
  if(outcome==='negate')return{card:'S1-EVT-009',hero:'S1-WAR-H001'};
  return{card:null,hero:'S1-WAR-H001'};
}
(async()=>{
  transformServer();
  try{
    const m=await import('file://'+TMP+'?stage4='+Date.now());
    const scenarios=[];
    for(const attacker of ['PLAYER','AI']){
      for(const outcome of ['hit','block','dodge','negate']){
        const defender=other(attacker),resp=responseSpec(outcome),e=m.createRuntimeEngine();
        e.start({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',firstPlayerSide:'PLAYER'});
        const s=e.board.appState;
        Object.assign(s,{preGame:null,turn:attacker,phase:'Battle',round:2,pending:null,responseWindow:null,gameOver:false,winner:null,pvpHumanVsHuman:true,pvpBattleFeedbackEvents:[],playerDiscard:[],aiDiscard:[]});
        const atkHand=attacker==='PLAYER'?'playerHand':'aiHand',defHand=defender==='PLAYER'?'playerHand':'aiHand';
        s[atkHand]=['S1-WAR-001']; s[defHand]=resp.card?[resp.card]:[];
        const atkHeroes=attacker==='PLAYER'?s.playerHeroes:s.aiHeroes,defHeroes=defender==='PLAYER'?s.playerHeroes:s.aiHeroes;
        atkHeroes.CENTER.card_id='S1-WAR-H001'; atkHeroes.CENTER.exhausted=false; atkHeroes.CENTER.hp=100; atkHeroes.CENTER.maxHp=100;
        defHeroes.CENTER.card_id=resp.hero; defHeroes.CENTER.exhausted=false; defHeroes.CENTER.hp=100; defHeroes.CENTER.maxHp=120;
        s.playerManaPoolCards=generic('PLAYER',10,'P');s.aiManaPoolCards=generic('AI',10,'A');s.playerManaDeck=[];s.aiManaDeck=[];s.mana=10;s.aiMana=10;
        e.bridgeSeat=null;e.bridgeRevision=-1;e.viewCache.clear();
        const atkSeat=seatFor(attacker),defSeat=seatFor(defender);
        e.applyIntent(atkSeat,'beginPlayFromHand',[0]);
        e.applyIntent(atkSeat,'chooseHeroFromBoard',['PLAYER','CENTER']);
        const committed=e.applyIntent(atkSeat,'chooseHeroFromBoard',['AI','CENTER']);
        assert(committed.animationEvents.some(x=>x.kind==='card_play'),'attack commit did not emit card_play');
        assert(e.board.appState.responseWindow,'attack did not open Response Window');
        let finalSnap;
        if(!resp.card){
          finalSnap=e.applyIntent(defSeat,'responsePassNoStuck',[]);
        }else{
          const idx=(e.board.appState.responseWindow.options||[]).findIndex(o=>o.card_id===resp.card);
          assert(idx>=0,`${attacker} ${outcome}: response ${resp.card} unavailable`);
          e.applyIntent(defSeat,'responseSelectNoStuck',[idx]);
          finalSnap=e.applyIntent(defSeat,'confirmSelectedResponse',[]);
        }
        const feedback=finalSnap.animationEvents.filter(x=>x.kind==='battle_feedback');
        assert.equal(feedback.length,1,`${attacker} ${outcome}: expected exactly one public battle_feedback`);
        const fx=feedback[0];
        assert.equal(fx.outcome,outcome,`${attacker} ${outcome}: public outcome mismatch`);
        assert.equal(fx.side,defender,`${attacker} ${outcome}: public target side mismatch`);
        assert.equal(fx.lane,'CENTER'); assert.equal(fx.play_sound,true);
        const ledger=e.board.appState.pvpBattleFeedbackEvents||[];
        assert.equal(ledger.length,1,`${attacker} ${outcome}: canonical ledger count mismatch`);
        assert.equal(ledger[0].id,fx.id,`${attacker} ${outcome}: public event did not originate from fresh canonical feedback`);
        const masked=m.maskAppStateForSeat(clone(e.board.appState),defSeat,false);
        assert.deepStrictEqual(masked.pvpBattleFeedbackEvents,[],`${attacker} ${outcome}: internal feedback ledger leaked into viewer snapshot`);
        scenarios.push({attacker,outcome,defender,revision:finalSnap.revision,event:clone(fx)});
      }
    }
    // One-shot transport: every currently connected recipient gets the event, then it is cleared
    // so reconnect/resync/unrelated broadcasts cannot replay it.
    const received1=[],received2=[],sample=scenarios[0].event;
    const mk=(id,seat,name,received)=>({clientId:id,role:'player',seat,name,ready:true,connected:true,ws:{readyState:1,send(v){received.push(JSON.parse(v));}}});
    const c1=mk('c1',1,'Alice',received1),c2=mk('c2',2,'Bob',received2);
    const room={id:'STAGE4',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),generation:1,lastCleanupAt:null,players:new Map([['c1',c1],['c2',c2]]),spectators:new Map(),logs:[],engine:null,match:{status:'started',startedAt:new Date().toISOString(),finishedAt:null,serverBoard:null,serverBoardRevision:99,lastIntent:{fromSeat:1,intent:'qa'},lastAnimationEvents:[clone(sample)],lastAnimationEvent:clone(sample)}};
    m.broadcast(room,c1);
    assert.equal(received1.length,1);assert.equal(received2.length,1);
    assert.equal(received1[0].match.lastAnimationEvents.length,1);assert.equal(received2[0].match.lastAnimationEvents.length,1);
    assert.equal(room.match.lastAnimationEvents.length,0,'one-shot events not cleared after broadcast');
    const reconnect=m.snapshotFor(room,c1);
    assert.equal((reconnect.match.lastAnimationEvents||[]).length,0,'reconnect snapshot replayed settled animation event');
    const result={ok:true,scenarios,internalLedgerMasked:true,oneShotBroadcast:true,reconnectReplay:false};
    fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
    console.log(JSON.stringify(result,null,2));
  }finally{try{fs.unlinkSync(TMP);}catch{}}
})().catch(err=>{try{fs.unlinkSync(TMP);}catch{};console.error(err);process.exit(1)});
