'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..');
const TMP=path.join(ROOT,'.tmp-v370-battle-server.mjs');
function generic(side,n,prefix){return Array.from({length:n},(_,i)=>({uid:`${prefix}:${i}`,kind:'GENERIC',class_name:'',owner_side:side,bottom_locked:false}));}
function other(side){return side==='PLAYER'?'AI':'PLAYER';}
function seatFor(side){return side==='PLAYER'?1:2;}
function transformServer(){
  let s=fs.readFileSync(path.join(ROOT,'server.js'),'utf8');
  s=s.replace("import { WebSocketServer, WebSocket } from 'ws';", "class WebSocketServer { constructor(){ this.clients=new Set(); } on(){} handleUpgrade(){} }\nconst WebSocket={OPEN:1};");
  const idx=s.lastIndexOf('server.listen(PORT, HOST, () => {');
  assert(idx>=0,'server.listen marker missing');
  s=s.slice(0,idx)+"\nexport { createRuntimeEngine };\n";
  fs.writeFileSync(TMP,s);
}
(async()=>{
  transformServer();
  try{
    const m=await import('file://'+TMP+'?battle='+Date.now());
    for(const attacker of ['PLAYER','AI']){
      const defender=other(attacker),e=m.createRuntimeEngine();
      e.start({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_01_elemental_lord_conqueror_renegade',firstPlayerSide:attacker});
      const st=e.board.appState;
      Object.assign(st,{preGame:null,turn:attacker,phase:'Battle',round:2,pending:null,responseWindow:null,gameOver:false,winner:null,pvpHumanVsHuman:true,pvpBattleFeedbackEvents:[],playerDiscard:[],aiDiscard:[]});
      st[attacker==='PLAYER'?'playerHand':'aiHand']=['S1-WAR-001'];
      st[defender==='PLAYER'?'playerHand':'aiHand']=[];
      for(const side of ['PLAYER','AI']){
        const heroes=side==='PLAYER'?st.playerHeroes:st.aiHeroes;
        heroes.CENTER.card_id='S1-WAR-H001';heroes.CENTER.exhausted=false;heroes.CENTER.hp=100;heroes.CENTER.maxHp=120;
      }
      st.playerManaPoolCards=generic('PLAYER',10,'P');st.aiManaPoolCards=generic('AI',10,'A');
      st.playerManaDeck=[];st.aiManaDeck=[];st.mana=10;st.aiMana=10;
      e.bridgeSeat=null;e.bridgeRevision=-1;e.viewCache.clear();
      const a=seatFor(attacker),d=seatFor(defender);
      e.applyIntent(a,'beginPlayFromHand',[0]);
      e.applyIntent(a,'chooseHeroFromBoard',['PLAYER','CENTER']);
      e.applyIntent(a,'chooseHeroFromBoard',['AI','CENTER']);
      const commit=e.applyIntent(a,'commitManaShardPaymentChoice',[]);
      assert(commit.animationEvents.some(x=>x.kind==='card_play'),attacker+' attack commit did not emit card_play');
      assert(e.board.appState.responseWindow,attacker+' attack did not open response window');
      const finalSnap=e.applyIntent(d,'responsePassNoStuck',[]);
      const events=finalSnap.animationEvents.filter(x=>x.kind==='battle_feedback');
      assert.equal(events.length,1,attacker+' expected exactly one authoritative battle_feedback');
      const fx=events[0];
      assert.equal(fx.side,defender);assert.equal(fx.lane,'CENTER');assert.equal(fx.outcome,'hit');assert.equal(fx.play_sound,true);assert.equal(fx.attack_kind,'P');
      const ledger=e.board.appState.pvpBattleFeedbackEvents||[];
      assert.equal(ledger.length,1,attacker+' canonical battle feedback ledger missing');
      assert.equal(ledger[0].id,fx.id,attacker+' public feedback did not originate from canonical ledger');
    }
    console.log('authoritative battle feedback transport: PASS');
  }finally{try{fs.unlinkSync(TMP)}catch{}}
})().catch(err=>{try{fs.unlinkSync(TMP)}catch{};console.error(err);process.exit(1)});
