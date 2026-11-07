'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const cx={console,URL,Date,Math,Array,JSON,Map,Set,Promise,Uint8Array,TextDecoder,TextEncoder,performance:{now:()=>0},setTimeout:()=>0,clearTimeout:()=>{},setInterval:()=>0,clearInterval:()=>{},requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},crypto:require('crypto').webcrypto};
cx.window=cx;cx.globalThis=cx;cx.location={href:'http://example.test/index.html',origin:'http://example.test'};cx.navigator={userAgent:'Stage7 Engine VM'};cx.document={readyState:'loading',addEventListener:()=>{},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:null,documentElement:null};vm.createContext(cx);
for(const file of ['engine/js/static-data.js','engine/js/runtime-authority.js','engine/shared-app/active-starters.js','engine/shared-app/app.bundle.js']){
 let src=fs.readFileSync(path.join(root,file),'utf8');if(file.endsWith('app.bundle.js')){src=src.replace(/function aiTurnDirectorAvailable\(\)\{[^}]*\}/g,'function aiTurnDirectorAvailable(){return false;}');src=src.replace('function showResult(){','function showResult(){if(SUPPRESS_RENDER)return;');src=src.replace('function showInfo(title, body){','function showInfo(title, body){if(SUPPRESS_RENDER)return;');src=src.replace('function showInfoHtml(title, html){','function showInfoHtml(title, html){if(SUPPRESS_RENDER)return;');src=src.replace(/\n\}\)\(\);\s*$/, '\n  window.__S7={get state(){return appState}, getLegalActions:getLegalActions, advancePhase:advancePhase, runAITurnImmediate:runAITurnImmediate, finishAITurnFromBattleImmediate:finishAITurnFromBattleImmediate, chooseAIAction:chooseAIAction, resolveResponseWindow:resolveResponseWindow, resolveDrawPhase:resolveDrawPhase, finishDrawPhasePresentation:finishDrawPhasePresentation, resolveS0BardDrawExchange:resolveS0BardDrawExchange, resolveStonebloodChoice:resolveStonebloodChoice, commitLegacyDefeatChoice:commitLegacyDefeatChoice, s0BardDrawOption:s0BardDrawOption, continueAutomaticPlayerEndTurn:continueAutomaticPlayerEndTurn, cleanupHandLimit:cleanupHandLimit, resolveEndPhaseCleanupForSide:resolveEndPhaseCleanupForSide, finishPlayerEndToAI:finishPlayerEndToAI, getCards:()=>CARD_BY_ID, setState:v=>{appState=v}};\n})();');
 }
 vm.runInContext(src,cx,{timeout:60000,filename:file});
}
const bridge=cx.GL_LOCAL_AI_BRIDGE,engine=cx.GL_GAME_ENGINE,h=cx.__S7;bridge.setRenderSuppressed(true);
const selectedDecks=['s0_starter_01_red_white','s0_starter_02_blue_red','s0_starter_03_yellow_blue','s0_starter_04_green_yellow','s0_starter_05_white_green'];
const result={mode:'ACTUAL_APP_ENGINE_NODE_VM_NO_BROWSER',date:'2026-11-04',human_policy:'PASS_ALL_RESPONSES_AND_ACTIONS',browser_verified:false,matches:[],rounds:[],errors:[]};
for(let m=0;m<selectedDecks.length;m++){
 const p=selectedDecks[m], a=selectedDecks[(m+2)%selectedDecks.length];
 const sp=engine.selectDeck('PLAYER',p),sa=engine.selectDeck('AI',a);if(!sp.ok||!sa.ok)throw Error('starter not selected '+JSON.stringify([sp,sa]));
 let start=engine.startLocalMatch('PLAYER');if(!start.ok)throw Error('start failed '+start.error);
 let s=h.state,history=[];assert(s.openingHandsDrawn&&s.openingManaDrawn);let previousRound=0;
 for(let iteration=0;iteration<160&&!s.gameOver;iteration++){
  try{
   if(s.turn==='PLAYER'){
    if(s.pending&&s.pending.type==='racial_stoneblood') h.resolveStonebloodChoice(true);
    if(s.pending&&s.pending.type==='legacy_defeat_choice') {s.pending.selected_index=0;h.commitLegacyDefeatChoice();}
    if(s.pending&&s.pending.type==='s0_bard_draw_choice') {h.resolveS0BardDrawExchange(s,'PLAYER',{source_lane:s.pending.source_lane},[]);}
    if(s.pending&&s.pending.type==='hand_limit_discard') {let required=s.pending.required;while(required-->0) s.playerDiscard.push(s.playerHand.pop());s.pending=null;}
    if(s.pending&&s.pending.type==='draw_replacement_choice'){// choose ordinary draw if available; capture gap otherwise
     result.errors.push({match:m,round:s.round,phase:s.phase,pending:s.pending.type});break;
    }
    if(s.pending||s.responseWindow) {result.errors.push({match:m,round:s.round,phase:s.phase,pending:s.pending&&s.pending.type,response:!!s.responseWindow});break;}
    if(s.phase==='Draw'&&s.drawPhaseResolvedFor!=='PLAYER')h.resolveDrawPhase(s,'PLAYER',{deferAnimation:true});
    if(s.phase==='Draw'&&s.drawPhaseResolvedFor==='PLAYER')s.phase='Deploy';
    if(s.phase==='Reform'&&s.playerHand.length>8){while(s.playerHand.length>8)s.playerDiscard.push(s.playerHand.pop());}
    if(s.phase==='Deploy'||s.phase==='Battle'||s.phase==='Reform'||s.phase==='End') h.advancePhase();
   }else{
    // Headless, passive human explicitly passes each legal Response; the normal
    // UI would display these choices. In the browser AI director resumes itself.
    let passes=0;while(s.responseWindow && passes++ < 12)h.resolveResponseWindow(null);
    if(s.pending&&s.pending.type==='racial_stoneblood')h.resolveStonebloodChoice(true);
    if(s.pending&&s.pending.type==='legacy_defeat_choice'){s.pending.selected_index=0;h.commitLegacyDefeatChoice();}
    if(s.responseWindow || s.pending) { result.errors.push({match:m,iteration,issue:'AI unresolved choice',phase:s.phase,round:s.round,pending:s.pending&&s.pending.type,response:!!s.responseWindow});break;}
    if(s.phase==='Battle') h.finishAITurnFromBattleImmediate(s);
    else {result.errors.push({match:m,iteration,issue:'AI turn stalled',phase:s.phase,round:s.round});break;}
   }
   if(s.pending&&s.pending.type==='hand_limit_discard'&&s.turn==='PLAYER'&&s.phase==='End'){
     let req=s.pending.required;while(req-->0)s.playerDiscard.push(s.playerHand.pop());s.pending=null;h.continueAutomaticPlayerEndTurn(s);
   }
   for(const side of ['PLAYER','AI']){const pool=side==='PLAYER'?'playerManaPoolCards':'aiManaPoolCards',deck=side==='PLAYER'?'playerManaDeck':'aiManaDeck';if(s[pool].length+s[deck].length!==12){result.errors.push({match:m,iteration,issue:'physical Mana invariant failed',side,pool:s[pool].length,deck:s[deck].length});}}
   if(s.round!==previousRound){history.push({round:s.round,turn:s.turn,phase:s.phase,playerHp:Object.values(s.playerHeroes).map(x=>x.hp),aiHp:Object.values(s.aiHeroes).map(x=>x.hp),aiActions:(s.opponentPlayedEvents||[]).length});previousRound=s.round;}
  }catch(err){result.errors.push({match:m,iteration,error:String(err.stack||err).slice(0,1700),phase:s.phase,round:s.round,log:s.log.slice(0,10)});break;}
 }
 let fin={starterPlayer:p,starterAI:a,round:s.round,cardRollbackCount:(s.log||[]).filter(x=>/Card play rollback restored/i.test(x)).length,castingDeclarationCount:(s.log||[]).filter(x=>/CAST declare:/i.test(x)).length,castingResolutionCount:(s.log||[]).filter(x=>/CASTING Attack|releases as Casting/i.test(x)).length,aiAttackLogCount:(s.log||[]).filter(x=>/Primary Attack Damage resolves/i.test(x)).length,gameOver:!!s.gameOver,winner:s.winner||null,playerDeck:s.playerDeck.length,aiDeck:s.aiDeck.length,playerHeroHp:Object.values(s.playerHeroes).map(x=>x.hp),aiHeroHp:Object.values(s.aiHeroes).map(x=>x.hp),pending:s.pending&&s.pending.type||null,response:!!s.responseWindow,log:(s.log||[]).slice(0,15),history:history.slice(-6)};
 result.matches.push(fin);
 console.log('MATCH',m,p,a,'ROUND',fin.round,'GAMEOVER',fin.gameOver,'WIN',fin.winner,'AI ACTIONS',s.opponentPlayedEvents.length,'ERR',result.errors.filter(x=>x.match===m).slice(0,1));
}
fs.writeFileSync(path.join(root,'STAGE7_ENGINE_MATCH_RESULTS.json'),JSON.stringify(result,null,2));
console.log('SUMMARY matches',result.matches.length,'finished',result.matches.filter(x=>x.gameOver).length,'errors',result.errors.length);
