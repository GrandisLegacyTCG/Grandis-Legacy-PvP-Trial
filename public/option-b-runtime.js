(()=>{
'use strict';
const E=()=>window.GL_OPTION_B_ENGINE;
const B=()=>window.GL_LOCAL_AI_BRIDGE;
const BF=document.querySelector('.battlefield');
const sidebar=document.querySelector('.sidebar');
const primary=document.getElementById('phasePrimaryAction');
const nextBtn=document.querySelector('.phase-action.next');
const playerHandTrack=document.querySelector('.hand.bottom .hand-track');
const oppHandTrack=document.querySelector('.hand.top .hand-track');
const playerManaHost=document.getElementById('manaCards');
const playerManaCount=document.getElementById('manaCount');
const aiManaHost=document.getElementById('opponentManaCards');
const aiManaCount=document.getElementById('opponentManaCount');
const sharedBox=document.getElementById('sharedPreviewBox');
const preview=document.getElementById('hoverPreviewCard');
const playedGrid=document.querySelector('.played');
const historyGrid=document.querySelector('.history-grid');
const activeStage=document.querySelector('.active-card-stage');
const turnBox=document.querySelector('.sidebar > .sidebox:first-child');
const battleLogPanel=document.getElementById('battleLogPanel');
const appRoot=document.querySelector('.app');
const soundBtn=document.querySelector('.bottom-actions button:not(.danger)');
const payBtn=document.createElement('button');payBtn.className='ob-pay-button';payBtn.type='button';payBtn.textContent='PAY';BF.appendChild(payBtn);
const swapLayer=document.createElement('div');swapLayer.className='ob-swap-layer';BF.appendChild(swapLayer);
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='obVsaiAttackDirectionLayer';svg.classList.add('gl-pending-attack-direction-layer','ob-vsai-attack-direction-layer');svg.setAttribute('aria-hidden','true');
{
  const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
  const marker=document.createElementNS('http://www.w3.org/2000/svg','marker');marker.id='obVsaiAttackArrow';marker.setAttribute('markerWidth','13');marker.setAttribute('markerHeight','13');marker.setAttribute('viewBox','0 0 12 12');marker.setAttribute('refX','10.5');marker.setAttribute('refY','6');marker.setAttribute('orient','auto');marker.setAttribute('markerUnits','userSpaceOnUse');
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.setAttribute('d','M 1 1 L 11 6 L 1 11 Z');arrow.setAttribute('class','ob-target-arrow');
  marker.appendChild(arrow);defs.appendChild(marker);svg.appendChild(defs);
}
document.body.appendChild(svg);
const feedback=document.createElement('div');feedback.className='ob-feedback';BF.appendChild(feedback);
const choiceOverlay=document.createElement('div');choiceOverlay.className='overlay choice-overlay ob-vsai-choice-overlay';choiceOverlay.innerHTML='<section class="choice-panel"><header class="choice-head"><h2 class="ob-choice-title">Choice</h2></header><div class="choice-body ob-choice-body"></div><footer class="choice-foot"><button type="button" class="ob-choice-confirm">CONFIRM</button></footer></section>';document.body.appendChild(choiceOverlay);
const playedDetailOverlay=document.createElement('div');playedDetailOverlay.className='ob-played-detail-overlay';playedDetailOverlay.innerHTML='<section class="ob-played-detail-panel" role="dialog" aria-modal="true" aria-labelledby="obPlayedDetailTitle"><header class="ob-played-detail-head"><h2 id="obPlayedDetailTitle">Card Played</h2><button type="button" class="ob-played-detail-close" aria-label="Close Card Played detail">CLOSE</button></header><div class="ob-played-detail-body"></div></section>';document.body.appendChild(playedDetailOverlay);
const cardReviewOverlay=document.createElement('div');cardReviewOverlay.className='ob-card-review-overlay';cardReviewOverlay.innerHTML='<section class="ob-card-review-panel" role="dialog" aria-modal="true" aria-labelledby="obCardReviewTitle"><header class="ob-card-review-head"><h2 id="obCardReviewTitle">Card Review</h2><button type="button" class="ob-card-review-close" aria-label="Close card review">CLOSE</button></header><div class="ob-card-review-body"></div></section>';document.body.appendChild(cardReviewOverlay);
const animationLayer=document.createElement('div');animationLayer.className='ob-animation-layer';animationLayer.setAttribute('aria-hidden','true');document.body.appendChild(animationLayer);
const modalHoverPreview=document.createElement('div');modalHoverPreview.className='ob-modal-hover-preview';modalHoverPreview.setAttribute('aria-hidden','true');const modalHoverImg=document.createElement('img');modalHoverPreview.appendChild(modalHoverImg);document.body.appendChild(modalHoverPreview);
const sidebarHoverPreview=document.createElement('div');sidebarHoverPreview.className='ob-sidebar-hover-preview';sidebarHoverPreview.setAttribute('aria-hidden','true');const sidebarHoverImg=document.createElement('img');sidebarHoverPreview.appendChild(sidebarHoverImg);sidebar.appendChild(sidebarHoverPreview);
const turnBanner=document.createElement('div');turnBanner.className='ob-turn-banner';turnBanner.setAttribute('aria-live','polite');document.body.appendChild(turnBanner);
const lobbyOverlay=document.createElement('div');lobbyOverlay.className='ob-lobby-overlay';lobbyOverlay.innerHTML='<section class="ob-lobby-panel" role="dialog" aria-modal="true" aria-labelledby="obLobbyTitle"><header class="ob-lobby-head"><img class="ob-lobby-logo" src="engine/assets/lobby/grandis-legacy-logo.webp" alt="Grandis Legacy"><h1 id="obLobbyTitle">VS AI LOBBY</h1></header><div class="ob-lobby-error" id="obLobbyError"></div><div class="ob-lobby-decks" id="obLobbyDecks"></div><footer class="ob-lobby-foot"><button type="button" class="ob-lobby-start" id="obLobbyStart">Start Match</button></footer></section>';document.body.appendChild(lobbyOverlay);
const coinOverlay=document.createElement('div');coinOverlay.className='ob-coin-overlay';coinOverlay.innerHTML='<section class="ob-coin-card" role="dialog" aria-modal="true" aria-labelledby="obCoinTitle"><h2 id="obCoinTitle">Opening Coin Flip</h2><div class="ob-coin-body"></div></section>';document.body.appendChild(coinOverlay);
const progressionOverlay=document.createElement('div');progressionOverlay.className='ob-progression-overlay';progressionOverlay.innerHTML='<section class="ob-progression-card" role="dialog" aria-modal="true" aria-labelledby="obProgressionTitle"><header><div><span>HERO PROGRESSION</span><h2 id="obProgressionTitle">Hero Progression</h2></div><button type="button" class="ob-progression-close">Close</button></header><div class="ob-progression-row"></div><p>Select a Rank card to open Card Review.</p></section>';document.body.appendChild(progressionOverlay);
const resultOverlay=document.createElement('div');resultOverlay.className='ob-result-overlay';resultOverlay.innerHTML='<section class="ob-result-card" role="dialog" aria-modal="true" aria-labelledby="obResultTitle"><header><span>GAME RESULT</span><h2 id="obResultTitle">Match Complete</h2></header><div class="ob-result-body"></div></section>';document.body.appendChild(resultOverlay);
let lastSignature='',manaRenderKey='',lastChainKey='',lastFeedbackKey='',resolvedHistory=[],historyKnown=new Set(),playerHandShift=0,opponentHandShift=0;
let activeModalType='',heldCombatCards=[],handRenderKey='',opponentHandRenderKey='',modalRenderKey='',swapRenderKey='';
let uiResponseSourceChoice=null,responseRollbackSnapshot=null;
let activeCardHold=null,activeCardPhaseStamp='';
let inspectState=null,lobbyIsOpen=true,lobbyErrorText='';
let openingFirstSide='PLAYER',openingChoice='HEADS',openingOutcome='HEADS',openingPresentationActive=false;
let obOpeningHiddenShardUids=new Set(),resultShown=false,resultCleanupTimer=null;
let transientConnectorKey='',transientConnectorUntil=0;
let presentationPrimed=false,previousVisualState=null,lastTurnBannerKey='';
let obPresentationActive=0,obPresentationBusyUntil=0;
let obAttachmentLastPress={key:'',at:0};
const seenPresentationEvents=new Set();
// External draw presentation state. This mirrors the current VS AI model:
// reserved Draw Phase cards occupy an invisible destination slot until arrival,
// while already-committed multi-draw cards remain hidden in their own slots
// until each animation finishes. Stage 1.4 Hand fan/hover behavior is untouched.
const obPendingDrawReservations={PLAYER:[],AI:[]};
const obHiddenCommittedDrawSlots={PLAYER:new Map(),AI:new Map()};
let obExternalDrawSequence=Promise.resolve();
const laneOrder=['LEFT','CENTER','RIGHT'];
function st(){const snap=E()?.getSnapshot?.();return snap?.appState||snap?.state||snap||null;}
function cv(id){return id?E().cardView(id):null;}
function art(id){return id?'card-art/'+encodeURIComponent(id)+'.webp':'';}
function shardArt(sh){if(!sh||sh.kind!=='CLASS')return 'assets/shards/Generic.webp';const n=String(sh.class_name||'').trim();return 'assets/shards/'+(n||'Generic')+'.webp';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cloneLite(v){try{return JSON.parse(JSON.stringify(v))}catch{return null}}
function intent(name,args=[]){const net=window.GL_PVP_NETWORK;if(window.GL_PVP_CLIENT_MODE&&net&&typeof net.sendIntent==='function'){const r=net.sendIntent(name,args);setTimeout(renderNow,0);return r}const r=E().intent(name,args);setTimeout(renderNow,0);return r;}
function flash(msg){feedback.textContent=msg;feedback.classList.add('show');clearTimeout(flash.t);flash.t=setTimeout(()=>feedback.classList.remove('show'),700);}
function sideHeroes(s,side){return side==='AI'?s.aiHeroes:s.playerHeroes;}
function sideHand(s,side){return side==='AI'?s.aiHand:s.playerHand;}
function sideDiscard(s,side){return side==='AI'?s.aiDiscard:s.playerDiscard;}
function uiLaneElement(side,lane){
  const lanes=[...document.querySelectorAll((side==='AI'?'.opponent-field':'.player-field')+' .hero-grid .hero-lane')];
  // Gameplay lane binding follows the proven VS AI runtime exactly on both sides:
  // visual slot 0/1/2 = logical LEFT/CENTER/RIGHT. Option B's old mirrored lane labels
  // are intentionally hidden, so the runtime remains the sole targeting authority.
  const map={LEFT:0,CENTER:1,RIGHT:2};
  return lanes[map[lane]]||null;
}
function heroCardEl(side,lane){return uiLaneElement(side,lane)?.querySelector('.hero-card')||null;}
function heroImageId(h){return h?.legacy_mode?(h.active_legacy_card_id||h.card_id):h?.card_id;}
let obRawCardIndex=null;
function rawCardDef(id){
  if(!id)return null;
  if(!obRawCardIndex){obRawCardIndex=new Map();const defs=window.GL_CARD_DEFINITIONS||{},cards=Array.isArray(defs.cards)?defs.cards:[];cards.forEach(c=>{if(c?.card_id)obRawCardIndex.set(String(c.card_id),c)})}
  return obRawCardIndex.get(String(id))||null;
}
function heroClassAbilityName(h){const c=rawCardDef(h?.card_id||heroImageId(h));return String(c?.class_ability?.name||'').trim();}
function heroRacialAbilityName(h){const c=rawCardDef(h?.card_id||heroImageId(h));return String(c?.racial_ability?.name||'').trim();}
function heroHasDrawReplacementCounter(h){const c=rawCardDef(h?.card_id||heroImageId(h)),a=c?.class_ability?.action||{},e=a.effect||{};return !h?.legacy_mode&&e.draw_replacement_shuffle_redraw===true;}
// Stage 1.5.10: availability glow is deliberately limited to the five approved contextual Heroes.
// It is never inferred merely because a Hero owns an active Class Ability or Racial Trait.
const OB_CONTEXT_GLOW_IDS={
  ALDEN:new Set(['S1-ARC-H004','S1-ARC-H005','S1-ARC-H006']),
  LUCIEN:new Set(['S1-THF-H004','S1-THF-H005','S1-THF-H006']),
  AUREX:new Set(['S1-WAR-H004','S1-WAR-H005','S1-WAR-H006']),
  FINNIAN:new Set(['S1-THF-H001','S1-THF-H002','S1-THF-H003']),
  THRAIN:new Set(['S1-CLE-H004','S1-CLE-H005','S1-CLE-H006'])
};
function heroContextGlowKey(h){const id=String(h?.card_id||heroImageId(h)||'');for(const [key,set] of Object.entries(OB_CONTEXT_GLOW_IDS))if(set.has(id))return key;return '';}
function castingForAttachment(s,h,id,side,lane,slot){return (s?.pendingCastings||[]).find(x=>x&&x.card_id===id&&x.side===side&&Number(x.attachmentSlot)===Number(slot)&&((x.original_source_lane||x.source_lane)===lane||x.source_hero_card_id===h?.card_id||x.source_instance_id===h?.instance_id))||null;}
function castingTargetsPosition(s,side,lane){return (s?.pendingCastings||[]).some(x=>x&&x.target_side===side&&String(x.locked_target_lane||x.target_lane||'')===String(lane));}
function currentLaneForSourceCard(s,side,sourceCardId,fallbackLane){
  if(!sourceCardId||!side)return fallbackLane||null;
  const heroes=sideHeroes(s,side)||{};
  for(const lane of laneOrder){
    const h=heroes[lane];
    if(!h)continue;
    if(h.card_id===sourceCardId||h.active_legacy_card_id===sourceCardId||heroImageId(h)===sourceCardId)return lane;
  }
  return fallbackLane||null;
}
function resolveActionSourceLane(s,a){
  if(!a)return a;
  const lane=currentLaneForSourceCard(s,a.side,a.source_card_id,a.lane);
  return lane===a.lane?a:{...a,lane};
}
function statusIcon(name){return 'engine/assets/status-icons/Icon-'+String(name||'').replace(/[^A-Za-z]/g,'')+'.png';}
function getStatusName(x){try{return E().getStatusLabel(x)||x?.name||x?.status||''}catch{return x?.name||x?.status||''}}
function isPrecommitCancelable(s){const p=s?.pending;if(!p||s?.responseWindow)return false;return ['warp_scroll_selection','source_selection','target_selection','scouting_target_selection','exact_two_target_selection','double_casting_target_selection','mana_spend_choice','mana_shard_payment_choice','optional_magical_surge','status_removal_choice','tribute_target','racial_target_selection','hero_ability_target_selection','legacy_cost_selection','legacy_hero_target_selection','manual_reposition'].includes(p.type);}
function pendingOwner(p){return p&&(p.decision_side||p.response_owner||p.side||p.source_side||(p.type==='hand_limit_discard'?'PLAYER':null));}
function isDirectHandCardSearch(p){return !!(p&&p.type==='card_search_choice'&&p.zone==='hand'&&['source_exp','discard_then_draw_three'].includes(p.resolve_to));}
function selectedChoiceIndex(p){if(p?.selected_index==null)return null;const n=Number(p.selected_index);return Number.isInteger(n)&&n>=0?n:null;}
function discardSelectionState(p,handIndex){
  if(!p)return{selected:false,index:-1};
  if(p.type==='hand_limit_discard')return{selected:(p.selected||[]).map(Number).includes(Number(handIndex)),index:Number(handIndex)};
  if(p.type==='response_payment_choice'){
    const ci=(p.candidates||[]).findIndex(x=>Number(x.hand_index)===Number(handIndex));
    return{selected:ci>=0&&(p.selected_indices||[]).map(Number).includes(ci),index:ci};
  }
  if(p.type==='legacy_cost_selection'){
    const ci=(p.cost_candidates||[]).findIndex(x=>Number(x.hand_index??x.index)===Number(handIndex));
    return{selected:ci>=0&&(p.selected_cost_indices||[]).map(Number).includes(ci),index:ci};
  }
  return{selected:false,index:-1};
}
function directTributeHeroReady(p,side,lane){return !!(isDirectHandCardSearch(p)&&p.resolve_to==='source_exp'&&selectedChoiceIndex(p)!=null&&side===(p.source_side||p.host_side||p.side||'PLAYER')&&lane===(p.source_lane||p.host_lane));}
function phaseName(p){return String(p||'').replace(/\s*Phase$/i,'');}
function fitPlayedCards(){const grid=playedGrid;if(!grid)return;const cs=getComputedStyle(grid),gap=parseFloat(cs.columnGap)||0,cell=Math.max(0,(grid.clientWidth-gap*2)/3),w=Math.floor(Math.min(72,cell)),h=Math.floor(w*7/5);grid.querySelectorAll(':scope > .played-card').forEach(x=>{x.style.width=w+'px';x.style.height=h+'px'});}
function isPvpMobileDevice(){return document.documentElement.classList.contains('pvp-mobile-device')}
function showBattlefieldCardPreview(img){if(!img||!preview||!sharedBox)return;preview.src=img.src;sharedBox.classList.add('previewing')}
function hideBattlefieldCardPreview(){if(!preview||!sharedBox)return;sharedBox.classList.remove('previewing');preview.removeAttribute('src')}
function bindPreview(img){
  if(!img||img.dataset.obPreviewBound==='1')return;
  img.dataset.obPreviewBound='1';
  img.addEventListener('mouseenter',()=>{if(isPvpMobileDevice())return;showBattlefieldCardPreview(img)});
  img.addEventListener('mouseleave',()=>{if(isPvpMobileDevice())return;hideBattlefieldCardPreview()});
}
function mobilePreviewImageFromTarget(target){
  if(!isPvpMobileDevice()||!target?.closest)return null;
  const host=target.closest('.hand-card,.hero-card,.attachment-card,.ob-combat-card,.zone-card,.zoneCard,.played-card,.active-card-visual');
  if(!host||!host.closest('.app'))return null;
  const img=target.matches?.('img')?target:host.querySelector('img');
  if(!img)return null;
  const src=String(img.getAttribute('src')||img.src||'');
  if(!src)return null;
  return img;
}
document.addEventListener('click',e=>{
  if(!isPvpMobileDevice())return;
  const img=mobilePreviewImageFromTarget(e.target);
  if(img){showBattlefieldCardPreview(img);return}
  if(!e.target.closest?.('#sharedPreviewBox'))hideBattlefieldCardPreview();
});
function hideSidebarHoverPreview(){sidebarHoverPreview.classList.remove('open');sidebarHoverPreview.setAttribute('aria-hidden','true');sidebarHoverImg.removeAttribute('src')}
function placeSidebarHoverPreview(anchor){
  if(!anchor||!sidebarHoverPreview||!sidebar)return;
  const sr=sidebar.getBoundingClientRect(),ar=anchor.getBoundingClientRect();
  const cssH=parseFloat(getComputedStyle(sidebarHoverPreview).height)||315;
  const scaleY=sr.height>0&&sidebar.offsetHeight>0?sr.height/sidebar.offsetHeight:1;
  const anchorTop=(ar.top-sr.top)/Math.max(scaleY,.001),anchorH=ar.height/Math.max(scaleY,.001);
  const sidebarH=sidebar.offsetHeight||sr.height/Math.max(scaleY,.001);
  let top=anchorTop+anchorH/2-cssH/2;top=Math.max(4,Math.min(top,Math.max(4,sidebarH-cssH-4)));
  sidebarHoverPreview.style.top=Math.round(top)+'px';
}
function bindSidebarPreview(img){
  if(!img||img.dataset.obSidebarPreviewBound==='1')return;img.dataset.obSidebarPreviewBound='1';
  img.addEventListener('mouseenter',()=>{sidebarHoverImg.src=img.src;placeSidebarHoverPreview(img);sidebarHoverPreview.classList.add('open');sidebarHoverPreview.setAttribute('aria-hidden','false')});
  img.addEventListener('mousemove',()=>placeSidebarHoverPreview(img));
  img.addEventListener('mouseleave',hideSidebarHoverPreview);
}
function hideModalHoverPreview(){modalHoverPreview.classList.remove('open');modalHoverPreview.setAttribute('aria-hidden','true');modalHoverImg.removeAttribute('src')}
function placeModalHoverPreview(anchor){
  const panel=choiceOverlay.querySelector('.choice-panel');
  const r=(panel||anchor)?.getBoundingClientRect?.();if(!r)return;
  const cs=getComputedStyle(modalHoverPreview),w=parseFloat(cs.width)||225,h=parseFloat(cs.height)||315,g=12,vw=window.innerWidth||1200,vh=window.innerHeight||800;
  // Popup preview uses the exact same card size as the battlefield hover preview.
  // X is centered in the free space between the popup and the right viewport edge.
  // If that side cannot fit the full preview, use the left free space instead rather
  // than changing the established lobby/battlefield/component sizing.
  const rightAvailable=Math.max(0,vw-r.right),leftAvailable=Math.max(0,r.left);
  const useRight=rightAvailable>=w+2*g || rightAvailable>=leftAvailable;
  const centerX=useRight?(r.right+rightAvailable/2):(leftAvailable/2);
  let left=centerX-w/2;
  if(useRight) left=Math.max(r.right+g,left);
  else left=Math.min(r.left-g-w,left);
  left=Math.max(g,Math.min(left,vw-w-g));
  let top=r.top+(r.height-h)/2;
  top=Math.max(g,Math.min(top,vh-h-g));
  modalHoverPreview.style.left=Math.round(left)+'px';modalHoverPreview.style.top=Math.round(top)+'px';
}
function bindModalPreview(img){
  if(!img||img.dataset.obModalPreviewBound==='1')return;img.dataset.obModalPreviewBound='1';
  img.addEventListener('mouseenter',()=>{modalHoverImg.src=img.src;placeModalHoverPreview(img);modalHoverPreview.classList.add('open');modalHoverPreview.setAttribute('aria-hidden','false')});
  img.addEventListener('mousemove',()=>placeModalHoverPreview(img));
  img.addEventListener('mouseleave',hideModalHoverPreview);
}
function closeCardReview(){cardReviewOverlay.classList.remove('open');const body=cardReviewOverlay.querySelector('.ob-card-review-body');if(body)body.innerHTML='';}
function openCardReview(cardId){
  // Mobile PvP intentionally has no second-level Card Review popup. A tap uses the normal battlefield hover preview instead.
  if(isPvpMobileDevice())return;
  if(!cardId)return;const v=cv(cardId),body=cardReviewOverlay.querySelector('.ob-card-review-body');
  cardReviewOverlay.querySelector('#obCardReviewTitle').textContent=v?.name||'Card Review';
  let html='';try{html=window.GL_CARD_PREVIEW_QA?.html?.(cardId)||''}catch{}
  body.innerHTML=html||('<img class="ob-card-review-image" src="'+esc(art(cardId))+'" alt="'+esc(v?.name||'Card Review')+'">');
  cardReviewOverlay.classList.add('open');
}
cardReviewOverlay.querySelector('.ob-card-review-close').onclick=closeCardReview;
cardReviewOverlay.addEventListener('click',e=>{if(e.target===cardReviewOverlay)closeCardReview()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&cardReviewOverlay.classList.contains('open'))closeCardReview()});
// Prevent native image dragging / browser selection ghosts on game pieces. These blue drag ghosts
// were being mistaken for a gameplay selection overlay during double-click and payment interactions.
document.addEventListener('dragstart',e=>{if(e.target?.closest?.('.app img,.ob-vsai-choice-overlay img,.ob-played-detail-overlay img,.ob-card-review-overlay img'))e.preventDefault()},true);
document.addEventListener('selectstart',e=>{if(e.target?.closest?.('.hero-card,.hand-card,.mana-card,.played-card,.attachment-card,.ob-combat-card,.ob-inspect-card'))e.preventDefault()},true);
function closePlayedDetail(){playedDetailOverlay.classList.remove('open');playedDetailOverlay.querySelector('.ob-played-detail-body').innerHTML='';}
function openPlayedDetail(side,eventId){
  const detail=E()?.getCardPlayedDetail?.(side,eventId);if(!detail?.html)return;
  playedDetailOverlay.querySelector('#obPlayedDetailTitle').textContent=detail.title||'Card Played';
  playedDetailOverlay.querySelector('.ob-played-detail-body').innerHTML=detail.html;
  playedDetailOverlay.classList.add('open');
}
playedDetailOverlay.querySelector('.ob-played-detail-close').onclick=closePlayedDetail;
playedDetailOverlay.addEventListener('click',e=>{if(e.target===playedDetailOverlay)closePlayedDetail()});
function currentUiScale(){return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-scale'))||1;}
function syncPlayerNameBox(){const ai=document.querySelector('.hand.top .hand-title'),player=document.querySelector('.player-name');if(!ai||!player)return;const scale=currentUiScale(),r=ai.getBoundingClientRect();if(r.width>0&&r.height>0){player.style.width=(r.width/scale)+'px';player.style.height=(r.height/scale)+'px';}}
function lockPrimaryActionWidth(){
  if(!primary)return;
  const label=primary.textContent,cls=primary.className;
  primary.textContent='REPOSITION';primary.className='phase-action';primary.style.width='';
  const w=Math.ceil(primary.getBoundingClientRect().width/currentUiScale());
  if(w>0)primary.style.width=w+'px';
  primary.textContent=label;primary.className=cls;
}
function negativeStatusName(name){return ['Bleed','Burn','Freeze','Poison','Stun'].some(x=>x.toLowerCase()===String(name||'').toLowerCase())}

function zoneEl(side,type){
  const map={
    'PLAYER|Legacy Deck':'.player-field > .rail-pair:first-child .zone:nth-child(1)',
    'PLAYER|Shard Deck':'.player-field > .rail-pair:first-child .zone:nth-child(2)',
    'PLAYER|Discard Pile':'.player-right-rail .zone:nth-child(1)',
    'PLAYER|Main Deck':'.player-right-rail .zone:nth-child(2)',
    'AI|Main Deck':'.opponent-left-rail .zone:nth-child(2)',
    'AI|Discard Pile':'.opponent-left-rail .zone:nth-child(3)',
    'AI|Shard Deck':'.opponent-right-rail .zone:nth-child(1)',
    'AI|Legacy Deck':'.opponent-right-rail .zone:nth-child(2)'
  };
  return document.querySelector(map[side+'|'+type]||'');
}
function configureStaticZones(){
  [['PLAYER','Legacy Deck'],['PLAYER','Shard Deck'],['PLAYER','Discard Pile'],['PLAYER','Main Deck'],['AI','Main Deck'],['AI','Discard Pile'],['AI','Shard Deck'],['AI','Legacy Deck']].forEach(([side,type])=>{
    const z=zoneEl(side,type);if(!z)return;z.dataset.zoneSide=side;z.dataset.zoneType=type;z.querySelector('img')?.classList.add('zoneCard');
  });
  const pd=zoneEl('PLAYER','Discard Pile'),ad=zoneEl('AI','Discard Pile'),pl=zoneEl('PLAYER','Legacy Deck');
  if(pd&&!pd.dataset.obInspectBound){pd.dataset.obInspectBound='1';pd.addEventListener('click',()=>openInspectCards('Your Discard Pile — '+(st()?.playerDiscard||[]).length+' Cards',(st()?.playerDiscard||[]).slice(),'Discard Piles are public.'))}
  if(ad&&!ad.dataset.obInspectBound){ad.dataset.obInspectBound='1';ad.addEventListener('click',()=>openInspectCards('Opponent Discard Pile — '+(st()?.aiDiscard||[]).length+' Cards',(st()?.aiDiscard||[]).slice(),'Discard Piles are public.'))}
  if(pl&&!pl.dataset.obInspectBound){pl.dataset.obInspectBound='1';pl.addEventListener('click',()=>openInspectCards('Your Legacy Deck — '+(st()?.playerLegacy||[]).length+' Cards',(st()?.playerLegacy||[]).map(x=>typeof x==='string'?x:(x?.card_id||x?.id)).filter(Boolean),'Private zone: only your own Legacy Deck can be inspected.'))}
}
function openInspectCards(title,ids,instruction){
  if(st()?.pending)return;
  inspectState={title,ids:(ids||[]).filter(Boolean),instruction:instruction||''};modalRenderKey='';renderInspectModal();
}
function closeInspectModal(){hideModalHoverPreview();inspectState=null;activeModalType='';modalRenderKey='';choiceOverlay.classList.remove('open')}
function renderInspectModal(){
  if(!inspectState)return;
  choiceOverlay.classList.add('open');activeModalType='inspect';
  const sig='inspect|'+inspectState.title+'|'+inspectState.ids.join('|');if(modalRenderKey===sig)return;modalRenderKey=sig;
  const title=choiceOverlay.querySelector('.ob-choice-title'),body=choiceOverlay.querySelector('.ob-choice-body'),confirm=choiceOverlay.querySelector('.ob-choice-confirm');
  title.textContent=inspectState.title;body.innerHTML='';
  if(inspectState.instruction){const p=document.createElement('p');p.className='choice-instruction';p.textContent=inspectState.instruction;body.appendChild(p)}
  if(inspectState.ids.length){const grid=document.createElement('div');grid.className='choice-grid inspect-card-grid';inspectState.ids.forEach(id=>{const v=cv(id),b=document.createElement('button');b.type='button';b.className='ob-inspect-card';const im=document.createElement('img');im.src=art(id);im.alt=v?.name||id;im.draggable=false;const sp=document.createElement('span');sp.textContent=v?.name||id;b.append(im,sp);grid.appendChild(b);bindModalPreview(im)});body.appendChild(grid)}
  else{const e=document.createElement('div');e.className='ob-inspect-empty';e.textContent='This pile is empty.';body.appendChild(e)}
  confirm.textContent='CLOSE';confirm.disabled=false;confirm.onclick=closeInspectModal;
}
function syncSoundButton(){if(!soundBtn)return;const on=E()?.getSoundEnabled?.()!==false;soundBtn.textContent=on?'Sound ON':'Sound OFF';soundBtn.setAttribute('aria-pressed',on?'true':'false')}
function closeLobbyProgression(){progressionOverlay.classList.remove('open');progressionOverlay.querySelector('.ob-progression-row').innerHTML='';}
progressionOverlay.querySelector('.ob-progression-close').onclick=closeLobbyProgression;
progressionOverlay.addEventListener('click',e=>{if(e.target===progressionOverlay)closeLobbyProgression()});
function openLobbyHeroProgression(side,rankOneId){
  const data=E()?.getOptionBHeroProgression?.(side,rankOneId),ids=data?.ids||[];if(ids.length<3){lobbyErrorText='The selected Hero package is incomplete.';renderLobby();return}
  progressionOverlay.querySelector('#obProgressionTitle').textContent=cv(ids[0])?.name||'Hero Progression';
  const row=progressionOverlay.querySelector('.ob-progression-row');row.innerHTML='';
  ids.slice(0,3).forEach((id,i)=>{if(i){const arrow=document.createElement('span');arrow.className='ob-progression-arrow';arrow.textContent='→';row.appendChild(arrow)}const a=document.createElement('article');a.className='ob-progression-hero'+(i===0?' current':'');const b=document.createElement('button');b.type='button';b.className='ob-progression-card-button';b.setAttribute('aria-label','Preview '+(cv(id)?.name||id)+' Rank '+['I','II','III'][i]);const im=document.createElement('img');im.src=art(id);im.alt=cv(id)?.name||id;im.draggable=false;b.appendChild(im);b.onclick=()=>openCardReview(id);const label=document.createElement('div');label.className='ob-progression-rank';label.textContent='RANK '+['I','II','III'][i];a.append(b,label);row.appendChild(a)});
  progressionOverlay.classList.add('open');
}
function deckFormationHtml(side){
  const view=E()?.getOptionBLobbyFormationView?.(side)||{rank:1,lanes:{}},parts=[];
  laneOrder.forEach((lane,index)=>{const row=view.lanes?.[lane]||{},id=row.previewId||row.rankOneId||'',v=cv(id),r1=row.rankOneId||id;parts.push('<article class="ob-lobby-hero"><button type="button" data-lobby-progression-side="'+esc(side)+'" data-lobby-progression="'+esc(r1)+'" aria-label="View '+esc(lane)+' Hero Progression">'+(id?'<img src="'+art(id)+'" alt="'+esc(v?.name||id)+'">':'<span class="ob-lobby-hero-empty">—</span>')+'</button><small>'+(lane.charAt(0)+lane.slice(1).toLowerCase())+'</small></article>');if(index<laneOrder.length-1){const next=laneOrder[index+1];parts.push('<button class="ob-lobby-swap" type="button" data-lobby-swap-side="'+esc(side)+'" data-lobby-swap-left="'+lane+'" data-lobby-swap-right="'+next+'" aria-label="Swap '+lane+' and '+next+'"><img src="engine/assets/lobby/Swap.png" alt="" aria-hidden="true"></button>')}});
  return '<div class="ob-lobby-formation">'+parts.join('')+'</div><div class="ob-lobby-rank-control" data-lobby-rank-side="'+esc(side)+'"><button type="button" data-lobby-rank-delta="-1" data-lobby-rank-side="'+esc(side)+'" aria-label="Previous rank">‹</button><strong>RANK '+['I','II','III'][Math.max(1,Math.min(3,Number(view.rank||1)))-1]+'</strong><button type="button" data-lobby-rank-delta="1" data-lobby-rank-side="'+esc(side)+'" aria-label="Next rank">›</button></div>';
}
function renderLobby(){
  if(!lobbyIsOpen){lobbyOverlay.classList.remove('open');return}
  lobbyOverlay.classList.add('open');appRoot?.classList.add('ob-lobby-hidden');
  const opts=B()?.getStarterDeckOptions?.()||{},state=E()?.getOptionBDeckSetupState?.()||{},keys=Object.keys(opts);
  const host=document.getElementById('obLobbyDecks'),err=document.getElementById('obLobbyError');if(!host||!err)return;err.textContent=lobbyErrorText||'';err.classList.toggle('show',!!lobbyErrorText);
  const sideBlock=(side,data)=>{const selected=state.selectedDeckKey?.[side]||keys[0]||'',imported=selected==='IMPORTED',optionHtml=keys.map(k=>'<option value="'+esc(k)+'" '+(selected===k?'selected':'')+'>'+esc(opts[k]?.label||k)+'</option>').join('')+(imported?'<option value="IMPORTED" selected>'+esc(data?.deck_name||'Imported Deck')+'</option>':'');return '<section class="ob-lobby-deck" data-lobby-side="'+side+'"><header><h2>'+(side==='PLAYER'?'Player Deck':'AI Deck')+'</h2><span class="ob-lobby-valid">VALID</span></header><div class="ob-lobby-picker"><select aria-label="'+(side==='PLAYER'?'Player':'AI')+' deck selector" data-lobby-select="'+side+'">'+optionHtml+'</select><button type="button" data-lobby-import="'+side+'">Import Deck</button><input type="file" data-lobby-file="'+side+'" accept="application/json,.json" hidden></div>'+deckFormationHtml(side)+'</section>'};
  host.innerHTML=sideBlock('PLAYER',state.player)+sideBlock('AI',state.ai);
  host.querySelectorAll('[data-lobby-select]').forEach(sel=>sel.onchange=()=>{const side=sel.dataset.lobbySelect,r=E().selectOptionBDeck?.(side,sel.value);if(!r?.ok)lobbyErrorText=r?.error||'Could not select deck.';else lobbyErrorText='';renderLobby()});
  host.querySelectorAll('[data-lobby-import]').forEach(btn=>btn.onclick=()=>host.querySelector('[data-lobby-file="'+btn.dataset.lobbyImport+'"]')?.click());
  host.querySelectorAll('[data-lobby-file]').forEach(inp=>inp.onchange=()=>{const f=inp.files?.[0];if(!f)return;const side=inp.dataset.lobbyFile,reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(String(reader.result||'')),r=E().importOptionBDeck?.(side,raw);if(!r?.ok)throw new Error(r?.error||'Invalid deck file.');lobbyErrorText='';renderLobby()}catch(err){lobbyErrorText=String(err?.message||err);renderLobby()}};reader.onerror=()=>{lobbyErrorText='Could not read the selected deck file.';renderLobby()};reader.readAsText(f);inp.value=''});
  host.querySelectorAll('[data-lobby-swap-left]').forEach(btn=>btn.onclick=()=>{E().swapOptionBLobbyFormation?.(btn.dataset.lobbySwapSide,btn.dataset.lobbySwapLeft,btn.dataset.lobbySwapRight);renderLobby()});
  host.querySelectorAll('[data-lobby-rank-delta]').forEach(btn=>btn.onclick=()=>{E().cycleOptionBLobbyRank?.(btn.dataset.lobbyRankSide,Number(btn.dataset.lobbyRankDelta||0));renderLobby()});
  host.querySelectorAll('[data-lobby-progression]').forEach(btn=>btn.onclick=()=>openLobbyHeroProgression(btn.dataset.lobbyProgressionSide,btn.dataset.lobbyProgression));
  document.getElementById('obLobbyStart').onclick=startMatchFromLobby;
}
function coinFaceSrc(face){return String(face||'HEADS').toUpperCase()==='TAILS'?'assets/ui/Racial-Token-Tail.webp':'assets/ui/Racial-Token-Head.webp'}
function fairCoinOutcome(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return (a[0]&1)?'TAILS':'HEADS'}catch{return Math.random()<.5?'HEADS':'TAILS'}}
function renderCoinChoice(){const body=coinOverlay.querySelector('.ob-coin-body');body.innerHTML='<p>Choose Heads or Tails.</p><div class="ob-coin-actions"><button type="button" data-coin-choice="HEADS"><img src="'+coinFaceSrc('HEADS')+'" alt="Heads"><strong>HEADS</strong></button><button type="button" data-coin-choice="TAILS"><img src="'+coinFaceSrc('TAILS')+'" alt="Tails"><strong>TAILS</strong></button></div>';body.querySelectorAll('[data-coin-choice]').forEach(btn=>btn.onclick=()=>runCoinFlip(btn.dataset.coinChoice));coinOverlay.classList.add('open')}
function runCoinFlip(choice){openingChoice=choice==='TAILS'?'TAILS':'HEADS';openingOutcome=fairCoinOutcome();openingFirstSide=openingChoice===openingOutcome?'PLAYER':'AI';const body=coinOverlay.querySelector('.ob-coin-body');let face=openingOutcome==='HEADS'?'TAILS':'HEADS';body.innerHTML='<p>Flipping the coin...</p><div class="ob-coin-flip-stage"><img src="'+coinFaceSrc(face)+'" alt="Coin"></div>';const im=body.querySelector('img');let step=0;const totalSteps=8,halfDuration=72;B()?.playOpeningCoinSound?.();const runStep=()=>{if(step>=totalSteps){im.src=coinFaceSrc(openingOutcome);im.alt=openingOutcome==='HEADS'?'Heads':'Tails';im.style.transition='none';im.style.transform='translateY(0) scaleX(1)';const text=body.querySelector('p');if(text)text.textContent=(openingOutcome==='HEADS'?'Heads':'Tails')+'!';setTimeout(renderCoinResult,1000);return}const progress=(step+1)/totalSteps,lift=Math.round(Math.sin(progress*Math.PI)*22);im.style.transition='transform '+halfDuration+'ms cubic-bezier(.45,0,.55,1)';im.style.transform='translateY(-'+lift+'px) scaleX(.04)';setTimeout(()=>{face=face==='HEADS'?'TAILS':'HEADS';im.src=coinFaceSrc(face);im.style.transition='transform '+halfDuration+'ms cubic-bezier(.2,.75,.3,1)';im.style.transform='translateY(-'+lift+'px) scaleX(1)';setTimeout(()=>{step++;runStep()},halfDuration)},halfDuration)};runStep()}
function renderCoinResult(){const body=coinOverlay.querySelector('.ob-coin-body'),won=openingFirstSide==='PLAYER';body.innerHTML='<div class="ob-coin-winner '+(won?'player-wins':'ai-wins')+'"><span>WINNER</span><strong>'+(won?'YOU WON THE COIN FLIP':'LOCAL AI WON THE COIN FLIP')+'</strong><p>'+(won?'You will take the first turn.':'Local AI will take the first turn.')+'</p></div><div class="ob-coin-result"><div><span>Your choice</span><img src="'+coinFaceSrc(openingChoice)+'" alt="'+openingChoice+'"></div><div><span>Coin result</span><img src="'+coinFaceSrc(openingOutcome)+'" alt="'+openingOutcome+'"></div></div><button class="ob-coin-start" type="button">START GAME</button>';body.querySelector('.ob-coin-start').onclick=beginOpeningPresentation}
function resetPresentationState(){presentationPrimed=false;previousVisualState=null;seenPresentationEvents.clear();resolvedHistory=[];historyKnown.clear();activeCardHold=null;obPendingDrawReservations.PLAYER.length=0;obPendingDrawReservations.AI.length=0;obHiddenCommittedDrawSlots.PLAYER.clear();obHiddenCommittedDrawSlots.AI.clear();obOpeningHiddenShardUids.clear();obExternalDrawSequence=Promise.resolve();resultShown=false;clearResultTimer();resultOverlay.classList.remove('open');closeLobbyProgression()}
function startMatchFromLobby(){
  lobbyErrorText='';const r=E().prepareOptionBLocalMatch?.();if(!r?.ok){lobbyErrorText=r?.error||'Could not start match.';renderLobby();return}
  resetPresentationState();lobbyIsOpen=false;lobbyOverlay.classList.remove('open');appRoot?.classList.add('ob-lobby-hidden');renderCoinChoice();
}
function beginOpeningPresentation(){
  const r=E().commitOptionBOpeningSetup?.(openingChoice,openingOutcome,openingFirstSide);if(!r?.ok){coinOverlay.querySelector('.ob-coin-body').innerHTML='<p>'+esc(r?.error||'Could not begin the match.')+'</p>';return}
  coinOverlay.classList.remove('open');openingPresentationActive=true;lastTurnBannerKey='';
  (r.handEvents||[]).forEach(e=>{if(e?.id)seenPresentationEvents.add(e.id);const side=e.side==='AI'?'AI':'PLAYER';obHiddenCommittedDrawSlots[side].set(Number(e.hand_index),String(e.id||side+'-'+e.hand_index))});
  (r.manaEvents||[]).forEach(e=>obOpeningHiddenShardUids.add((e.side==='AI'?'AI':'PLAYER')+'|'+String(e.uid)));
  handRenderKey='';opponentHandRenderKey='';manaRenderKey='';renderNow();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{syncPlayerManaPoolToHeroLeft();syncPlayerHandToHeroCenter();syncOpponentHand();appRoot?.classList.remove('ob-lobby-hidden');runOpeningHandGroups(r.handEvents||[],r.manaEvents||[])}));
}
function runPairMotions(parts,duration,done){let left=parts.length;if(!left){done();return}parts.forEach((part,i)=>{const finish=()=>{left--;if(left<=0)done()};if(!flyBetween(part.src,part.from,part.to,duration,finish,i===0))finish()})}
function runOpeningHandGroups(events,manaEvents){
  const groups=[];for(let i=0;i<6;i++)groups.push((events||[]).filter(e=>Number(e.group_index)===i));let gi=0;
  const next=()=>{if(gi>=groups.length){runOpeningShardGroups(manaEvents);return}const group=groups[gi++],parts=[];group.forEach(e=>{const side=e.side==='AI'?'AI':'PLAYER',hand=side==='PLAYER'?playerHandTrack:oppHandTrack,to=hand?.querySelector('.hand-card[data-hand-index="'+Number(e.hand_index)+'"]'),from=zoneEl(side,'Main Deck');parts.push({src:'assets/ui/back-main.webp',from:from?.querySelector('.zoneCard')||from,to});});runPairMotions(parts,220,()=>{group.forEach(e=>obHiddenCommittedDrawSlots[e.side==='AI'?'AI':'PLAYER'].delete(Number(e.hand_index)));handRenderKey='';opponentHandRenderKey='';renderHand(st());renderOpponentHand(st());requestAnimationFrame(()=>setTimeout(next,20))})};next();
}
function runOpeningShardGroups(events){
  const groups=[];for(let i=0;i<3;i++)groups.push((events||[]).filter(e=>Number(e.group_index)===i));let gi=0;
  const next=()=>{if(gi>=groups.length){obOpeningHiddenShardUids.clear();manaRenderKey='';renderMana();requestAnimationFrame(()=>setTimeout(()=>{previousVisualState=visualStateOf(st());presentationPrimed=true;openingPresentationActive=false;E().beginOptionBFirstTurn?.(openingFirstSide);setTimeout(renderNow,0)},180));return}const group=groups[gi++],parts=[];group.forEach(e=>{const side=e.side==='AI'?'AI':'PLAYER',host=side==='PLAYER'?playerManaHost:aiManaHost,to=host?.querySelector('.mana-card[data-uid="'+CSS.escape(String(e.uid))+'"]'),from=zoneEl(side,'Shard Deck');parts.push({src:'assets/ui/back-shard.webp',from:from?.querySelector('.zoneCard')||from,to});});runPairMotions(parts,220,()=>{group.forEach(e=>obOpeningHiddenShardUids.delete((e.side==='AI'?'AI':'PLAYER')+'|'+String(e.uid)));manaRenderKey='';renderMana();requestAnimationFrame(()=>setTimeout(next,20))})};next();
}
function visualStateOf(s){
  const hero={};for(const side of ['PLAYER','AI']){hero[side]={};for(const lane of laneOrder){const h=sideHeroes(s,side)?.[lane];hero[side][lane]={card_id:h?.card_id||'',image_id:heroImageId(h)||'',legacy:!!h?.legacy_mode,hp:Number(h?.hp||0),exp_cards:Array.isArray(h?.exp_cards)?h.exp_cards.slice():[]}}}
  return{turn:s.turn,round:Number(s.round||1),phase:s.phase,hero,discard:{PLAYER:(s.playerDiscard||[]).slice(),AI:(s.aiDiscard||[]).slice()},playerMana:(s.playerManaPoolCards||[]).map(x=>String(x.uid)),aiMana:(s.aiManaPoolCards||[]).map(x=>String(x.uid)),presentation:(s.presentationEvents||[]).map(x=>cloneLite(x)).filter(Boolean)};
}
function multisetAdded(before,after){const counts=new Map();(before||[]).forEach(id=>counts.set(String(id),(counts.get(String(id))||0)+1));const out=[];(after||[]).forEach(id=>{const k=String(id),n=counts.get(k)||0;if(n>0)counts.set(k,n-1);else out.push(id)});return out;}
function optionBPresentationBusy(){return obPresentationActive>0||Date.now()<obPresentationBusyUntil;}
function flyBetween(src,fromEl,toEl,duration=380,onFinish,playSound=true){
  if(!src||!fromEl||!toEl)return false;const fr=fromEl.getBoundingClientRect(),tr=toEl.getBoundingClientRect();if(fr.width<1||tr.width<1)return false;
  obPresentationActive++;obPresentationBusyUntil=Math.max(obPresentationBusyUntil,Date.now()+60);
  const im=document.createElement('img');im.className='ob-flying-card';im.src=src;im.style.left=fr.left+'px';im.style.top=fr.top+'px';im.style.width=fr.width+'px';im.style.height=fr.height+'px';animationLayer.appendChild(im);if(playSound)E()?.playCardMotionSound?.();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{im.style.transition='transform '+duration+'ms cubic-bezier(.2,.75,.2,1),opacity '+duration+'ms ease,width '+duration+'ms ease,height '+duration+'ms ease';im.style.transform='translate('+(tr.left-fr.left)+'px,'+(tr.top-fr.top)+'px)';im.style.width=tr.width+'px';im.style.height=tr.height+'px';im.style.opacity='.72'}));
  setTimeout(()=>{im.remove();obPresentationActive=Math.max(0,obPresentationActive-1);obPresentationBusyUntil=Math.max(obPresentationBusyUntil,Date.now()+60);if(typeof onFinish==='function')onFinish(true)},duration+20);return true;
}
function showTurnBannerFor(s){const key=String(s.turn)+'|'+Number(s.round||1);if(openingPresentationActive||!s.turn||lastTurnBannerKey===key)return;lastTurnBannerKey=key;turnBanner.innerHTML='<strong>'+(s.turn==='PLAYER'?'YOUR TURN':(window.GL_PVP_CLIENT_MODE?'OPPONENT TURN':'AI TURN'))+'</strong><small>ROUND '+Number(s.round||1)+'</small>';turnBanner.classList.remove('show');void turnBanner.offsetWidth;turnBanner.classList.add('show');clearTimeout(showTurnBannerFor.t);showTurnBannerFor.t=setTimeout(()=>turnBanner.classList.remove('show'),900)}
function buildPresentationPlan(s){
  const cur=visualStateOf(s),prev=previousVisualState,plan={draws:[],shards:[],heroTransitions:[],moved:[]};
  if(openingPresentationActive){(cur.presentation||[]).forEach(e=>{if(e?.id&&e.reason==='OPENING_HAND')seenPresentationEvents.add(e.id)});previousVisualState=cur;return plan;}
  (cur.presentation||[]).forEach(e=>{if(!e?.id||seenPresentationEvents.has(e.id))return;seenPresentationEvents.add(e.id);if(presentationPrimed&&e.type==='CARD_DRAWN')plan.draws.push(e)});
  if(prev&&presentationPrimed){
    for(const side of ['PLAYER','AI']){const before=new Set(side==='PLAYER'?prev.playerMana:prev.aiMana),after=side==='PLAYER'?cur.playerMana:cur.aiMana;after.forEach(uid=>{if(!before.has(uid))plan.shards.push({side,uid})});
      const beforeById={},afterById={};for(const lane of laneOrder){const a=prev.hero[side][lane],b=cur.hero[side][lane];if(a?.image_id)beforeById[a.image_id]=lane;if(b?.image_id)afterById[b.image_id]=lane;if(b?.image_id&&a?.image_id!==b.image_id){const wasAlreadyOnField=laneOrder.some(prevLane=>prev.hero[side][prevLane]?.image_id===b.image_id);if(b.legacy&&!a?.legacy&&!wasAlreadyOnField)plan.heroTransitions.push({side,lane,id:b.image_id,kind:'legacy'});else if(!b.legacy&&!a?.legacy&&!wasAlreadyOnField){const discardDelta=multisetAdded(prev.discard?.[side]||[],cur.discard?.[side]||[]);plan.heroTransitions.push({side,lane,id:b.image_id,fromId:a?.image_id||a?.card_id||'',kind:'rank',expCardIds:discardDelta.length?discardDelta:(a?.exp_cards||[]).slice()})}}}
      Object.keys(afterById).forEach(id=>{if(beforeById[id]&&beforeById[id]!==afterById[id])plan.moved.push({side,lane:afterById[id]})});
    }
  }
  // Same principle as VS AI's GL_HIDDEN_DRAW_TOKENS: keep every pre-existing
  // Hand card rendered, but hide only incoming committed draw slots in-place.
  (plan.draws||[]).forEach(e=>{
    const side=e.side==='AI'?'AI':'PLAYER',idx=Number(e.hand_index);
    if(Number.isInteger(idx)&&idx>=0)obHiddenCommittedDrawSlots[side].set(idx,String(e.id||side+'-'+idx));
  });
  previousVisualState=cur;if(!presentationPrimed)presentationPrimed=true;return plan;
}
function preparePresentationTargets(plan){

  (plan.shards||[]).forEach(x=>{const host=x.side==='PLAYER'?playerManaHost:aiManaHost;const el=host?.querySelector('.mana-card[data-uid="'+CSS.escape(String(x.uid))+'"]');if(el)el.classList.add('ob-presentation-deferred')});
  (plan.heroTransitions||[]).filter(x=>x.kind==='rank').forEach(x=>{
    const hero=heroCardEl(x.side,x.lane),lane=uiLaneElement(x.side,x.lane),pack=hero?.closest('.ob-hero-physical-stack');
    hero?.classList.add('ob-presentation-hidden');lane?.classList.add('ob-rank-transitioning');
    if(pack&&x.fromId&&!pack.querySelector(':scope > .ob-rank-old-hero')){const old=document.createElement('img');old.className='ob-rank-old-hero';old.src=art(x.fromId);old.alt='Previous Hero Rank';old.draggable=false;pack.appendChild(old)}
  });
}
function runPresentationPlan(plan,s){
  showTurnBannerFor(s);
  const draws=(plan.draws||[]).slice(),shards=(plan.shards||[]).slice(),rankTransitions=(plan.heroTransitions||[]).filter(x=>x.kind==='rank'),legacyTransitions=(plan.heroTransitions||[]).filter(x=>x.kind==='legacy');
  function runShardSequence(index){
    if(index>=shards.length)return;
    const x=shards[index],from=zoneEl(x.side,'Shard Deck'),host=x.side==='PLAYER'?playerManaHost:aiManaHost,to=host?.querySelector('.mana-card[data-uid="'+CSS.escape(String(x.uid))+'"]');
    if(to){to.classList.remove('ob-presentation-deferred');to.classList.add('ob-presentation-hidden');layoutManaPoolCards(host)}
    const done=()=>{if(to)to.classList.remove('ob-presentation-hidden');layoutManaPoolCards(host);requestAnimationFrame(()=>setTimeout(()=>runShardSequence(index+1),28))};
    if(!flyBetween('assets/ui/back-shard.webp',from?.querySelector('.zoneCard')||from,to,390,done))done();
  }
  function runDrawSequence(index){
    if(index>=draws.length){runShardSequence(0);return;}
    const e=draws[index],side=e.side==='AI'?'AI':'PLAYER',idx=Number(e.hand_index),from=zoneEl(side,'Main Deck'),hand=side==='PLAYER'?playerHandTrack:oppHandTrack,to=hand?.querySelector('.hand-card[data-hand-index="'+idx+'"]');
    if(to)to.classList.add('ob-presentation-hidden');
    const done=()=>{
      obHiddenCommittedDrawSlots[side].delete(idx);
      if(to)to.classList.remove('ob-presentation-hidden');
      requestAnimationFrame(()=>setTimeout(()=>runDrawSequence(index+1),28));
    };
    if(!flyBetween('assets/ui/back-main.webp',from?.querySelector('.zoneCard')||from,to,360,done))done();
  }
  function runRankTransition(index){
    if(index>=rankTransitions.length){runDrawSequence(0);return;}
    const x=rankTransitions[index],hero=heroCardEl(x.side,x.lane),legacy=zoneEl(x.side,'Legacy Deck'),discard=zoneEl(x.side,'Discard Pile'),exp=(x.expCardIds||[]).filter(Boolean);
    const reveal=()=>{const lane=uiLaneElement(x.side,x.lane),pack=hero?.closest('.ob-hero-physical-stack');pack?.querySelector(':scope > .ob-rank-old-hero')?.remove();hero?.classList.remove('ob-presentation-hidden');lane?.classList.remove('ob-rank-transitioning');requestAnimationFrame(()=>setTimeout(()=>runRankTransition(index+1),36))};
    const bringRank=()=>{if(!flyBetween(art(x.id),legacy?.querySelector('.zoneCard')||legacy,hero,350,reveal,true))reveal()};
    if(!exp.length){bringRank();return;}
    const from=hero,discardTarget=discard?.querySelector('.zoneCard')||discard;
    let remaining=exp.length,started=false;
    E()?.playCardMotionSound?.();
    exp.forEach(id=>{const done=()=>{remaining--;if(remaining<=0)bringRank()};if(flyBetween(art(id),from,discardTarget,230,done,false))started=true;else done()});
    if(!started&&remaining>0){remaining=0;bringRank()}
  }
  legacyTransitions.forEach((x,i)=>setTimeout(()=>{const from=zoneEl(x.side,'Legacy Deck'),to=heroCardEl(x.side,x.lane);flyBetween(art(x.id),from?.querySelector('.zoneCard')||from,to,430)},i*70));
  (plan.moved||[]).forEach(x=>{const lane=uiLaneElement(x.side,x.lane);if(!lane)return;lane.classList.remove('ob-reposition-flash');void lane.offsetWidth;lane.classList.add('ob-reposition-flash');setTimeout(()=>lane.classList.remove('ob-reposition-flash'),720)});
  if(rankTransitions.length)setTimeout(()=>runRankTransition(0),430);else runDrawSequence(0);
  E()?.flushBattleFeedback?.();
}
function responseOptionsForHand(rw,idx){
  const out=[];(rw?.options||[]).forEach((o,i)=>{if(Number(o?.hand_index)===Number(idx))out.push(i)});return out;
}
function responseChoiceLanes(s){
  if(!uiResponseSourceChoice||s?.responseWindow?.response_owner!=='PLAYER')return new Map();
  const m=new Map();uiResponseSourceChoice.optionIndices.forEach(i=>{const o=s.responseWindow.options?.[i];if(o?.source_lane)m.set(o.source_lane,i)});return m;
}
function beginResponseFromHand(handIndex,optionIndices){
  optionIndices=(optionIndices||[]).filter(i=>Number.isInteger(Number(i))).map(Number);
  if(!optionIndices.length)return;
  responseRollbackSnapshot=B()?.getSnapshot?.()||null;
  if(optionIndices.length===1){confirmResponseOption(optionIndices[0]);return}
  const s=st(),lanes=optionIndices.map(i=>s?.responseWindow?.options?.[i]?.source_lane).filter(Boolean);
  if(new Set(lanes).size<=1){confirmResponseOption(optionIndices[0]);return}
  uiResponseSourceChoice={handIndex:Number(handIndex),optionIndices};renderNow();
}
function confirmResponseOption(optionIndex){
  if(!responseRollbackSnapshot)responseRollbackSnapshot=B()?.getSnapshot?.()||null;
  uiResponseSourceChoice=null;
  intent('responseSelectNoStuck',[Number(optionIndex)]);
  intent('confirmSelectedResponse',[]);
  const s=st();
  if(s?.pending?.type!=='response_payment_choice')responseRollbackSnapshot=null;
}
function cancelResponsePrecommit(){
  uiResponseSourceChoice=null;
  if(window.GL_PVP_CLIENT_MODE&&window.GL_PVP_NETWORK){
    responseRollbackSnapshot=null;intent('cancelPendingAction',[]);return true;
  }
  if(responseRollbackSnapshot&&B()?.importSnapshot){
    B().importSnapshot(responseRollbackSnapshot,{skipImportAnimations:true});
    responseRollbackSnapshot=null;renderNow();return true;
  }
  return false;
}
function heroCombatHeld(side,lane,s){
  if(!combatChainStillActive(s))return false;
  return heldCombatCards.some(a=>a.side===side&&a.lane===lane&&!a.no_source);
}
function findAttackContextInWindow(rw){
  if(!rw)return null;
  if(rw.kind==='incoming_attack')return rw;
  if(rw.response_continuation){const x=findAttackContextInWindow(rw.response_continuation);if(x)return x}
  if(rw.original_attack_context){const x=findAttackContextInWindow(rw.original_attack_context);if(x)return x}
  return null;
}
function findActiveAttackWindow(s){
  let x=findAttackContextInWindow(s?.responseWindow);if(x)return x;
  const p=s?.pending;
  if(p?.type==='response_payment_choice')return findAttackContextInWindow(p.incoming_response_window);
  if(p?.after_stoneblood_response)return findAttackContextInWindow(p.after_stoneblood_response);
  return null;
}
const PRECOMMIT_PENDING_TYPES=new Set(['warp_scroll_selection','source_selection','target_selection','scouting_target_selection','scouting_exp_selection','exact_two_target_selection','double_casting_target_selection','mana_spend_choice','mana_shard_payment_choice','optional_magical_surge','status_removal_choice','tribute_target','racial_target_selection','hero_ability_target_selection','legacy_cost_selection','legacy_hero_target_selection','manual_reposition']);
function recentEventForCard(s,side,cardId){
  const list=side==='AI'?(s?.opponentPlayedEvents||s?.aiPlayedEvents||[]):(s?.playerPlayedEvents||[]);
  return list.find(e=>e&&e.card_id===cardId)||null;
}
function pendingActionInfo(s,p){
  if(!p||PRECOMMIT_PENDING_TYPES.has(p.type))return null;
  if(['hand_limit_discard','draw_replacement_choice','legacy_defeat_choice','response_window'].includes(p.type))return null;
  const id=p.card_id||p.response_option?.card_id||null;
  if(!id)return null;
  const side=p.source_side||p.host_side||p.side||p.decision_side||'PLAYER';
  const evt=recentEventForCard(s,side,id);
  const sourceCardId=p.source_card_id||p.response_option?.source_card_id||evt?.source_card_id||null;
  const fallbackLane=p.source_lane||p.host_lane||p.response_option?.source_lane||evt?.source_lane||null;
  const lane=currentLaneForSourceCard(s,side,sourceCardId,fallbackLane);
  const targetSide=p.target_side||evt?.target_side||null;
  const targetLane=p.target_lane||evt?.target_lane||null;
  return{card_id:id,side,lane,source_card_id:sourceCardId,target_side:targetSide,target_lane:targetLane,no_source:!lane};
}
function bindOptionBHandHover(card){
  if(!card||card.dataset.obHoverBound==='1')return;card.dataset.obHoverBound='1';
  let leaveTimer=0;
  card.addEventListener('mouseenter',()=>{clearTimeout(leaveTimer);card.classList.add('is-hovered')});
  card.addEventListener('mouseleave',()=>{clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>card.classList.remove('is-hovered'),170)});
}

// Stage 1.5.9: calculate the fan from the actual number of visible slots on both sides.
// This removes the old nth-child edge mismatch when the Hand was shorter than the authored fan.
function applyHandFan(track,side){
  const cards=[...track.querySelectorAll('.hand-card')],n=cards.length,isPlayer=side==='PLAYER';
  cards.forEach(c=>{c.style.removeProperty('--fan-rot');c.style.removeProperty('--fan-lift');c.style.removeProperty('--opp-fan-rot');c.style.removeProperty('--opp-fan-lift')});
  if(!n)return;
  const center=(n-1)/2,max=Math.max(center,1),maxRot=n<=1?0:Math.min(3.6,1.15+(n-2)*.48),maxLift=n<=1?0:2.7;
  cards.forEach((c,i)=>{
    const t=center===0?0:(i-center)/max,rot=maxRot*t,lift=maxLift*Math.pow(Math.abs(t),1.55);
    if(isPlayer){c.style.setProperty('--fan-rot',rot.toFixed(2)+'deg');c.style.setProperty('--fan-lift',lift.toFixed(2)+'px');}
    else{c.style.setProperty('--opp-fan-rot',(-rot).toFixed(2)+'deg');c.style.setProperty('--opp-fan-lift',lift.toFixed(2)+'px');}
  });
}


function syncPlayerHandToHeroCenter(){const c=uiLaneElement('PLAYER','CENTER'),r=uiLaneElement('PLAYER','RIGHT'),cards=[...playerHandTrack.querySelectorAll('.hand-card')];if(!c||!r||!cards.length)return;const scale=currentUiScale(),cr=c.getBoundingClientRect(),rr=r.getBoundingClientRect(),a=cards[0].getBoundingClientRect(),b=cards[cards.length-1].getBoundingClientRect(),target=(cr.right+rr.left)/2,actual=(a.left+b.right)/2,d=(target-actual)/scale;if(Math.abs(d)>.15){playerHandShift+=d;document.querySelector('.bottom-hud .hand').style.setProperty('--hand-align-shift',playerHandShift+'px')}}
function syncOpponentHand(){const lanes=[...document.querySelectorAll('.opponent-field .hero-grid .hero-lane')],l=lanes[0],c=lanes[1],cards=[...oppHandTrack.querySelectorAll('.hand-card')];if(!l||!c||!cards.length)return;const scale=currentUiScale(),lr=l.getBoundingClientRect(),cr=c.getBoundingClientRect(),a=cards[0].getBoundingClientRect(),b=cards[cards.length-1].getBoundingClientRect(),target=(lr.right+cr.left)/2,actual=(a.left+b.right)/2,d=(target-actual)/scale;if(Math.abs(d)>.15){opponentHandShift+=d;oppHandTrack.style.setProperty('--opponent-hand-align-shift',opponentHandShift+'px')}}
function syncPlayerManaPoolToHeroLeft(){const field=document.querySelector('.player-field'),lane=uiLaneElement('PLAYER','LEFT'),pool=document.querySelector('.player-mana-pool');if(!field||!lane||!pool)return;const scale=currentUiScale(),fr=field.getBoundingClientRect(),lr=lane.getBoundingClientRect(),left=parseFloat(getComputedStyle(pool).left)||4,right=(lr.right-fr.left)/scale,w=Math.max(120,right-left);pool.style.setProperty('--player-mana-pool-w',w+'px');pool.style.width=w+'px';const op=document.querySelector('.opponent-mana-pool');if(op)op.style.width=w+'px';renderMana();requestAnimationFrame(syncPlayerHandToHeroCenter)}
window.syncPlayerHandToHeroCenter=syncPlayerHandToHeroCenter;window.syncOpponentHand=syncOpponentHand;window.syncPlayerManaPoolToHeroLeft=syncPlayerManaPoolToHeroLeft;
function layoutManaPoolCards(host){
  if(!host)return;const cards=[...host.querySelectorAll(':scope > .mana-card')];if(!cards.length)return;
  const sample=cards.find(c=>getComputedStyle(c).display!=='none')||cards[0];
  const cw=Math.max(1,parseFloat(getComputedStyle(sample).width)||sample.getBoundingClientRect().width||64);
  const hostWidth=Math.max(cw+4,host.getBoundingClientRect().width||host.clientWidth||cw+4);
  const inner=Math.max(cw,hostWidth-4),naturalStep=cw+5,start=2;
  // One continuous Shard stack. Position sorting is handled by renderPool; layering follows
  // the visual stack direction only, never Shard type and never payment-selection state.
  const step=cards.length<=1?0:Math.max(7,Math.min(naturalStep,(inner-cw)/(cards.length-1)));
  const isPlayer=host===playerManaHost||host.id==='manaCards';
  cards.forEach((c,i)=>{
    c.style.left=(start+i*step)+'px';
    // Player: farther right = visually in front. Opponent: mirrored, farther left = in front.
    // A selected/lifted Shard changes only Y; it must not jump above a Shard that is already
    // in front of it in the horizontal stack.
    const z=100+(isPlayer?i:(cards.length-1-i));
    c.style.setProperty('z-index',String(z),'important');
  });
}

function renderPool(host,countEl,pool,side){
  const s=st(),p=s?.pending,plan=side==='PLAYER'?E().getManaPlan():null;
  const selected=new Set(),selectable=new Set();
  if(side==='PLAYER'&&p?.type==='mana_shard_payment_choice'&&plan){
    (plan.plan?.selected_class_uids||p.selected_class_uids||[]).forEach(x=>selected.add(String(x)));
    const genericNeed=Number(plan.plan?.generic_used||0);let n=0;
    (pool||[]).forEach(sh=>{if(sh.kind!=='CLASS'&&n<genericNeed){selected.add(String(sh.uid));n++}});
    (p.class_choices||[]).forEach(x=>selectable.add(String(x.uid)));
  }
  if(side==='PLAYER'&&p?.type==='mana_spend_choice') (pool||[]).forEach(sh=>selected.add(String(sh.uid)));
  if(side==='PLAYER'&&p?.type==='response_payment_choice'){
    const chosen=new Set((p.selected_mana_class_uids||[]).map(String));
    const choiceValue=new Map((p.mana_class_choices||[]).map(x=>[String(x.uid),Number(x.value||1)]));
    let classValue=0;
    (pool||[]).forEach(sh=>{
      const uid=String(sh.uid);
      if(sh.kind==='CLASS'&&choiceValue.has(uid)) selectable.add(uid);
      if(sh.kind==='CLASS'&&chosen.has(uid)){
        selected.add(uid);
        classValue+=choiceValue.get(uid)||1;
      }
    });
    let need=Math.max(0,Number(p.mana_cost||0)-classValue),g=0;
    (pool||[]).forEach(sh=>{if(sh.kind!=='CLASS'&&g<need){selected.add(String(sh.uid));g++}});
  }

  const blindOpponent = p?.type==='opponent_mana_selection' && pendingOwner(p)==='PLAYER' && side===p.target_side;
  const blindSelected = new Set();
  if(blindOpponent) (p.selected_indices||[]).forEach(i=>blindSelected.add(Number(i)));

  host.classList.toggle('ob-blind-shard-layout',!!blindOpponent);
  host.innerHTML='';const cards=[];
  // Blind opponent Shard selection must destroy positional memory: use the runtime's
  // shuffled candidate UID order before turning every Shard face-down.
  const displayPool=blindOpponent
    ? (p.candidates||[]).map(c=>(pool||[]).find(sh=>String(sh?.uid)===String(c?.uid))).filter(Boolean)
    : (pool||[]).map((sh,originalIndex)=>({sh,originalIndex}))
        .sort((a,b)=>{
          // Mirror the visible pool around the Mana Pool counter: Player Class Shards live on the
          // right edge, while Opponent Class Shards stay on the left edge of the 180° field.
          const ak=a.sh?.kind==='CLASS',bk=b.sh?.kind==='CLASS';
          const ar=side==='PLAYER'?(ak?1:0):(ak?0:1),br=side==='PLAYER'?(bk?1:0):(bk?0:1);
          return ar-br||a.originalIndex-b.originalIndex;
        })
        .map(x=>x.sh);
  displayPool.forEach((sh,i)=>{
    const wrap=document.createElement('div');
    const blindIdx=blindOpponent?i:-1;
    const isBlindSelected=blindOpponent&&blindSelected.has(blindIdx);
    const openingHidden=obOpeningHiddenShardUids.has((side==='AI'?'AI':'PLAYER')+'|'+String(sh.uid));
    wrap.className='mana-card'+(selected.has(String(sh.uid))||isBlindSelected?' ob-selected':'')+(selectable.has(String(sh.uid))||blindOpponent?' ob-class-choice':'')+(sh?.kind==='CLASS'&&!blindOpponent?' ob-class-shard':'')+(openingHidden?' ob-presentation-hidden':'');
    wrap.dataset.uid=sh.uid||'';wrap.dataset.shardKind=sh?.kind||'';
    const im=document.createElement('img');
    im.src=blindOpponent?'assets/ui/back-shard.webp':shardArt(sh);
    im.alt=blindOpponent?'Face-down opponent Shard':((sh.class_name||'Mana')+' Shard');
    wrap.appendChild(im);host.appendChild(wrap);cards.push(wrap);
    if(!blindOpponent) bindPreview(im);
    if(blindOpponent){
      wrap.addEventListener('click',()=>{
        const q=st()?.pending,selectedNow=new Set((q?.selected_indices||[]).map(Number)),required=Math.max(1,Number(q?.required_count||1));
        const willAdd=!selectedNow.has(Number(blindIdx)),nextCount=selectedNow.size+(willAdd?1:-1);
        intent('selectOpponentManaChoice',[blindIdx]);
        if(q?.type==='opponent_mana_selection'&&willAdd&&nextCount>=required)intent('commitOpponentManaSelection',[]);
      });
    }else if(selectable.has(String(sh.uid))){
      wrap.addEventListener('click',()=>{
        if(p?.type==='response_payment_choice') intent('toggleResponseManaShardChoice',[sh.uid]);
        else intent('toggleManaShardPaymentChoice',[sh.uid]);
      });
    }
  });
  countEl.textContent=(pool||[]).length;
  requestAnimationFrame(()=>layoutManaPoolCards(host));
}
function renderMana(){
  const s=st();if(!s)return;
  const key=JSON.stringify([
    (s.playerManaPoolCards||[]).map(x=>[x.uid,x.kind,x.class_name]),
    (s.aiManaPoolCards||[]).map(x=>[x.uid,x.kind,x.class_name]),
    s.pending?.type,
    s.pending?.selected_class_uids,
    s.pending?.selected_mana_class_uids,
    s.pending?.selected_indices,
    s.pending?.target_side,
    [...obOpeningHiddenShardUids].sort()
  ]);
  if(key===manaRenderKey)return;
  manaRenderKey=key;
  renderPool(playerManaHost,playerManaCount,s.playerManaPoolCards||[],'PLAYER');
  renderPool(aiManaHost,aiManaCount,s.aiManaPoolCards||[],'AI');
}
function ensureHeroPhysicalStack(laneEl,hc){
  let pack=laneEl.querySelector(':scope > .ob-hero-physical-stack');
  if(!pack){
    pack=document.createElement('div');pack.className='ob-hero-physical-stack hero-card-physical-stack is-ready';laneEl.appendChild(pack);
  }
  if(hc.parentElement!==pack)pack.appendChild(hc);
  return pack;
}
function renderExpStack(pack,h,exhaustedVisual){
  pack.querySelector(':scope > .ob-exp-stack')?.remove();
  const cards=Array.isArray(h?.exp_cards)?h.exp_cards.slice(0,4):[];
  if(!cards.length)return;
  const wrap=document.createElement('div');
  wrap.className='ob-exp-stack hero-exp-stack';
  for(let i=0;i<4;i++){
    const id=cards[i]||'';
    const slot=document.createElement('span');slot.className='ob-exp-slot hero-exp-slot'+(id?'':' is-empty');
    if(id){
      const c=E().cardView(id);
      slot.dataset.expValue=c?.isUltimate?'200':'100';
      slot.title=(c?.name||id)+' · '+slot.dataset.expValue+' EXP';
    }
    wrap.appendChild(slot);
  }
  pack.appendChild(wrap);
  // Copy VS AI v6.48 EXP geometry from the actual rendered Hero size.
  // This keeps Ready and Exhausted physical stack lengths identical even when Option B scales the Hero.
  const heroEl=pack.querySelector(':scope > .hero-card');
  if(heroEl){
    const visibleW=Number(heroEl.offsetWidth||0),visibleH=Number(heroEl.offsetHeight||0);
    if(visibleW>0&&visibleH>0){
      wrap.style.setProperty('--gl-exp-stack-height',visibleH+'px');
      wrap.style.setProperty('--gl-exp-exhausted-stack-width',visibleH+'px');
      wrap.style.setProperty('--gl-exp-exhausted-half-height',(visibleW/2)+'px');
    }
  }
}
function renderHero(side,lane,h,s){
  const laneEl=uiLaneElement(side,lane),hc=heroCardEl(side,lane);if(!laneEl||!hc)return;
  laneEl.classList.add('hero-panel');laneEl.dataset.side=side;laneEl.dataset.lane=lane;hc.classList.add('hero-main');
  laneEl.classList.toggle('ob-casting-target',castingTargetsPosition(s,side,lane));
  const pack=ensureHeroPhysicalStack(laneEl,hc);pack.classList.add('hero-card-anchor');
  const id=heroImageId(h),v=cv(id);let img=hc.querySelector(':scope > img');if(!img){img=document.createElement('img');hc.prepend(img)}
  if(id&&img.getAttribute('src')!==art(id))img.src=art(id);img.alt=v?.name||'Hero';img.classList.add('heroImg');bindPreview(img);
  // HP/state UI belongs to the lane overlay and never rotates with the physical Hero package.
  // Legacy is not a Hero and has no HP. Match the VS AI renderer: never show an HP bar / 0/0 in Legacy Mode.
  hc.querySelector(':scope > .hp')?.remove();
  const legacyMode=!!h?.legacy_mode;
  laneEl.classList.toggle('ob-legacy-slot',legacyMode);
  laneEl.querySelector(':scope > .ob-legacy-under-hero')?.remove();
  if(legacyMode){const under=h?.defeated_hero_snapshot?.card_id||h?.original_hero_card_id;if(under){const info=document.createElement('button');info.type='button';info.className='ob-legacy-under-hero';info.textContent='!';info.title='Hover to view Hero under this Legacy';info.setAttribute('aria-label','Hover to view Hero under this Legacy');const showUnder=()=>{img.src=art(under);img.alt=cv(under)?.name||'Hero under Legacy';laneEl.classList.add('ob-legacy-peek')};const restoreLegacy=()=>{img.src=art(id);img.alt=v?.name||'Legacy';laneEl.classList.remove('ob-legacy-peek')};info.addEventListener('mouseenter',showUnder);info.addEventListener('mouseleave',restoreLegacy);info.addEventListener('focus',showUnder);info.addEventListener('blur',restoreLegacy);info.onclick=e=>{e.preventDefault();e.stopPropagation()};laneEl.appendChild(info)}}
  let hp=laneEl.querySelector(':scope > .ob-hp-overlay');
  if(legacyMode){ if(hp)hp.remove(); hp=null; }
  else{
    if(!hp){hp=document.createElement('span');hp.className='ob-hp-overlay';laneEl.appendChild(hp)}
    const hpNow=Math.max(0,Number(h?.hp||0)),hpMax=Math.max(0,Number(h?.maxHp||h?.hp||0)),hpPct=hpMax>0?Math.max(0,Math.min(100,(hpNow/hpMax)*100)):0;
    hp.classList.toggle('is-warning',hpPct>40&&hpPct<=60);hp.classList.toggle('is-low',hpPct<=40);
    hp.style.setProperty('--hp-ratio',String(hpPct/100));
    hp.innerHTML='<span class="ob-hp-text">'+Math.round(hpNow)+'/'+Math.round(hpMax)+'</span><span class="ob-hp-track"><span class="ob-hp-fill"></span></span>';
  }
  // Draw This Turn moved into the existing Hero-information ! tooltip in Stage 1.5.10.
  laneEl.querySelector(':scope > .ob-draw-this-turn')?.remove();
  laneEl.classList.remove('ob-selectable','ob-selected','ob-invalid');
  const p=s.pending,engineSelectable=heroSelectable(p,side,lane),selected=heroSelected(p,side,lane),responseLanes=responseChoiceLanes(s);
  const responseSelectable=side==='PLAYER'&&responseLanes.has(lane),selectable=engineSelectable||responseSelectable;
  if(selectable)laneEl.classList.add('ob-selectable');if(selected)laneEl.classList.add('ob-selected');
  if(p&&pendingOwner(p)==='PLAYER'&&!selectable&&!selected&&['warp_scroll_selection','source_selection','target_selection','tribute_target','racial_target_selection','hero_ability_target_selection','legacy_hero_target_selection','exact_two_target_selection','double_casting_target_selection','scouting_target_selection'].includes(p.type))laneEl.classList.add('ob-invalid');
  let heroSingleAction=null;
  if(responseSelectable)heroSingleAction=()=>confirmResponseOption(responseLanes.get(lane));
  else if(directTributeHeroReady(p,side,lane))heroSingleAction=()=>intent('handleChoiceConfirm',[]);
  else if(engineSelectable)heroSingleAction=()=>intent('chooseHeroFromBoard',[side,lane]);
  hc.onclick=heroSingleAction?e=>{e.preventDefault();e.stopPropagation();if(e.detail>1){clearTimeout(hc._obSingleClickTimer);hc._obSingleClickTimer=null;return}clearTimeout(hc._obSingleClickTimer);hc._obSingleClickTimer=setTimeout(()=>{hc._obSingleClickTimer=null;heroSingleAction()},210)}:null;
  hc.ondblclick=e=>{e.preventDefault();e.stopPropagation();clearTimeout(hc._obSingleClickTimer);hc._obSingleClickTimer=null;openCardReview(id)};
  img.draggable=false;
  const delayExhaust=heroCombatHeld(side,lane,s),exhaustedVisual=!!(h?.exhausted&&!delayExhaust);
  pack.classList.toggle('is-exhausted',exhaustedVisual);
  pack.classList.toggle('is-ready',!exhaustedVisual);
  renderExpStack(pack,h,exhaustedVisual);
  renderAttachments(laneEl,h,side,lane,s);renderStatuses(laneEl,h,s,side,lane,delayExhaust);renderHeroActions(laneEl,side,lane,s);
}
function targetSelectionLanes(p){
  // Runtime is the sole authority for Area of Attack / Range / special targeting.
  // Never cache or reinterpret legal lanes in the UI adapter.
  return Array.isArray(p?.legal_targets)?p.legal_targets:[];
}
function heroSelectable(p,side,lane){
  if(!p||pendingOwner(p)!=='PLAYER')return false;
  if(p.type==='warp_scroll_selection')return side==='PLAYER'&&(p.legal_targets||[]).includes(lane);
  if(p.type==='source_selection')return side==='PLAYER'&&(p.legal_sources||[]).includes(lane);
  if(p.type==='target_selection')
    return side===(p.target_side||'AI')&&targetSelectionLanes(p).includes(lane);
  if(p.type==='scouting_target_selection'||p.type==='double_casting_target_selection'||p.type==='racial_target_selection'||p.type==='hero_ability_target_selection'||p.type==='legacy_hero_target_selection')
    return side===(p.target_side||'AI')&&(p.legal_targets||[]).includes(lane);
  if(p.type==='tribute_target')return side==='PLAYER'&&(p.legal_targets||[]).includes(lane);
  if(directTributeHeroReady(p,side,lane))return true;
  if(p.type==='exact_two_target_selection')return side===p.target_side&&(p.legal_targets||[]).includes(lane);
  return false;
}
function heroSelected(p,side,lane){if(!p)return false;if(side===p.source_side&&lane===p.source_lane)return true;if((p.selected_target_lanes||[]).includes(lane)&&side===p.target_side)return true;return false}
function attachmentCounterValue(h,id,side,lane,slot,s){
  const first=(obj,keys,allowZero=true)=>{if(!obj)return null;for(const k of keys){if(obj[k]==null)continue;const n=Number(obj[k]);if(Number.isFinite(n)&&(allowZero?n>=0:n>0))return n}return null};
  const attached=h?.attachments?.[slot];let v=first(attached,['counters','remaining_count','remaining_turns','turns_remaining','duration','remaining'],true);if(v!=null)return Math.min(6,v);
  const casting=(s?.pendingCastings||[]).find(x=>x&&x.card_id===id&&x.side===side&&Number(x.attachmentSlot)===Number(slot)&&((x.original_source_lane||x.source_lane)===lane||x.source_hero_card_id===h?.card_id||x.source_instance_id===h?.instance_id));
  v=first(casting,['counters','remaining_count','remaining_turns','turns_remaining','duration','remaining'],true);if(v!=null)return Math.min(6,v);
  const active=(s?.activeAttachments||[]).find(a=>a&&a.card_id===id&&a.side===side&&Number(a.slot)===Number(slot)&&(a.lane===lane||!a.lane));
  v=first(active,['counters','remaining_count','remaining_turns','turns_remaining','duration','remaining'],true);if(v!=null)return Math.min(6,v);
  const status=(h?.statuses||[]).find(x=>x&&(x.card_id===id||x.source_card_id===id||x.source===id||(Array.isArray(x.sources)&&x.sources.includes(id))));
  v=first(status,['counters','remaining_count','remaining_turns','turns_remaining','duration','remaining'],false);return v==null?0:Math.min(6,v);
}
function renderAttachments(laneEl,h,side,lane,s){laneEl.querySelectorAll('.attachment-card').forEach(x=>x.remove());const at=h?.attachments||[];at.slice(0,2).forEach((entry,slot)=>{const id=typeof entry==='string'?entry:entry?.card_id;if(!id)return;const v=cv(id),d=document.createElement('div');d.className='attachment-card '+(slot===0?'left':'right');d.dataset.obCardId=id;d.dataset.obAttachmentSide=side;d.dataset.obAttachmentLane=lane;d.dataset.obAttachmentSlot=String(slot);if(castingForAttachment(s,h,id,side,lane,slot))d.classList.add('ob-casting-active');const im=document.createElement('img');im.src=art(id);im.alt=v?.name||'Attachment';d.appendChild(im);const counter=attachmentCounterValue(h,id,side,lane,slot,s);if(counter>0){const c=document.createElement('span');c.className='attachment-turn';c.textContent=counter;c.setAttribute('aria-label',(v?.name||'Attachment')+' counter '+counter);d.appendChild(c)}laneEl.appendChild(d);bindPreview(im)});}
function renderStatuses(laneEl,h,s,side,lane,delayExhaust){
  laneEl.querySelector('.ob-status-stack')?.remove();
  const statuses=h?.statuses||[],negative=statuses.map((x,idx)=>({x,idx,name:getStatusName(x)})).filter(o=>negativeStatusName(o.name));
  const info=[];
  if(h?.exhausted&&!delayExhaust)info.push(h?.exhaust_reason?('Exhausted — '+String(h.exhaust_reason)):'Exhausted');
  if(h?.casting)info.push('Casting');
  if(heroHasDrawReplacementCounter(h))info.push('Draw This Turn: '+Math.max(0,Number(s?.cardsDrawnThisTurn?.[side]||0)));
  statuses.forEach(stt=>{const n=getStatusName(stt);if(n&&!negativeStatusName(n)&&!/^(Ready|Exhausted)$/i.test(n))info.push(n)});
  if(!negative.length&&!info.length)return;
  const wrap=document.createElement('div');wrap.className='ob-status-stack';
  if(info.length){
    const inf=document.createElement('div');inf.className='ob-info-indicator';
    const b=document.createElement('button');b.type='button';b.textContent='!';b.setAttribute('aria-label','Hero information');
    const tip=document.createElement('div');tip.className='ob-indicator-tooltip';tip.innerHTML='<strong>Hero Information</strong>'+info.map(x=>'<span>'+esc(x)+'</span>').join('');
    inf.append(b,tip);wrap.appendChild(inf);
  }
  negative.forEach(({x:stt,idx,name})=>{
    const holder=document.createElement('div');holder.className='ob-negative-status';
    const b=document.createElement('button');b.type='button';b.className='ob-status';b.setAttribute('aria-label',name);
    const im=document.createElement('img');im.src=statusIcon(name);im.alt=name;b.appendChild(im);
    const dur=Number(stt?.duration||0);if(dur>0){const sm=document.createElement('small');sm.textContent=dur;b.appendChild(sm)}
    const tip=document.createElement('div');tip.className='ob-indicator-tooltip';tip.innerHTML='<strong>'+esc(name+(dur>0?' '+dur:''))+'</strong><span>'+esc(E().getStatusDetail(stt)||name)+'</span>';
    const p=s.pending;
    if(p?.target_lane===lane&&p?.target_side===side){
      if(p.type==='status_removal_choice'){
        b.classList.add('ob-clickable');b.onclick=()=>{intent('selectStatusRemovalChoice',[idx]);intent('handleChoiceConfirm',[])};
      }else if(p.type==='saint_purify_choice'){
        const choiceIndex=(p.status_choices||[]).findIndex(x=>Number(x.status_index)===idx);
        if(choiceIndex>=0){b.classList.add('ob-clickable');b.onclick=()=>{intent('selectSaintPurifyChoice',[choiceIndex]);intent('handleChoiceConfirm',[])}}
      }
    }
    holder.append(b,tip);wrap.appendChild(holder);
  });
  laneEl.appendChild(wrap);
}
function renderHeroActions(laneEl,side,lane,s){
  laneEl.classList.remove('ob-class-ability-ready','ob-racial-trait-ready');
  if(side!=='PLAYER'){laneEl.querySelector(':scope > .ob-hero-actions')?.remove();return;}
  const p=s.pending,rw=s.responseWindow,hero=sideHeroes(s,side)?.[lane],glowKey=heroContextGlowKey(hero);
  const items=[];let classReady=false,racialReady=false;

  // Response abilities that live on a Hero use the same top-right Hero action area as VS AI.
  // Glow is only approved for Aurex / Finnian when their Racial response is actually legal now.
  if(rw?.response_owner==='PLAYER'){
    (rw.options||[]).forEach((o,i)=>{
      if(o&&o.hand_index==null&&o.source_lane===lane){
        const isRacial=!!o.racial_ability;
        const label=isRacial?(heroRacialAbilityName(hero)||String(o.label||'').split(' — ')[0]||'RACIAL TRAIT'):(o.label||cv(o.card_id)?.name||o.response_kind||'RESPONSE');
        if(isRacial&&(glowKey==='AUREX'||glowKey==='FINNIAN'))racialReady=true;
        items.push({key:'response:'+String(rw.response_window_token||rw.card_id||'')+':'+i+':'+String(o.card_id||'')+':'+lane,label,fn:()=>{responseRollbackSnapshot=B()?.getSnapshot?.()||null;confirmResponseOption(i)}});
      }
    });
  }

  if(pendingOwner(p)==='PLAYER'&&p?.source_side==='PLAYER'&&p?.source_lane===lane){
    if(p.type==='optional_magical_surge'){
      classReady=glowKey==='LUCIEN';const ability=heroClassAbilityName(hero)||(String(rawCardDef(hero?.card_id)?.identity?.class||'').toLowerCase()==='arcane duelist'?'Arcane Surge':'Mana Surge');
      items.push({key:'magical-surge:use',label:ability||'MANA SURGE',fn:()=>intent('commitMagicalSurgeChoice',[true])},{key:'magical-surge:skip',label:'SKIP',fn:()=>intent('commitMagicalSurgeChoice',[false])});
    }else if(p.type==='draw_replacement_choice'){
      classReady=glowKey==='ALDEN';const ability=String(p.abilityName||heroClassAbilityName(hero)||'REDRAW');
      items.push({key:'draw-replacement:redraw',label:ability,fn:()=>intent('commitDrawReplacementChoice',[true])},{key:'draw-replacement:skip',label:'SKIP',fn:()=>intent('commitDrawReplacementChoice',[false])});
    }else if(p.type==='racial_stoneblood'){
      racialReady=glowKey==='THRAIN';const ability=heroRacialAbilityName(hero)||'Stoneblood';
      items.push({key:'stoneblood:use',label:ability,fn:()=>intent('resolveStonebloodChoice',[true])},{key:'stoneblood:skip',label:'SKIP',fn:()=>intent('resolveStonebloodChoice',[false])});
    }
  }

  if(!rw&&!s.pending&&s.turn==='PLAYER'){
    const a=E().getHeroActions(side,lane)||{};
    // Active abilities may still have their normal buttons, but owning one never turns the box on.
    (a.racialAbilities||[]).forEach(x=>items.push({key:'racial:'+String(x.abilityId||x.label||x.name||''),label:x.label||x.name||heroRacialAbilityName(hero)||'RACIAL TRAIT',fn:()=>intent('beginActivatedRacialAbility',[side,lane,x.abilityId])}));
    (a.classAbilities||[]).forEach(x=>items.push({key:'class:'+String(x.abilityId||x.label||x.name||''),label:x.label||x.name||heroClassAbilityName(hero)||'CLASS SKILL',fn:()=>intent('beginActivatedHeroAbility',[side,lane,x.abilityId])}));
    (a.legacyAbilities||[]).forEach(x=>items.push({key:'legacy:'+String(x.abilityId||x.label||x.name||''),label:x.label||x.name||'LEGACY',fn:()=>intent('beginActivatedLegacyAbility',[side,lane,x.abilityId])}));
  }
  laneEl.classList.toggle('ob-class-ability-ready',classReady);
  laneEl.classList.toggle('ob-racial-trait-ready',racialReady);
  const existing=laneEl.querySelector(':scope > .ob-hero-actions');
  if(!items.length){if(existing)existing.remove();return;}
  const sig=JSON.stringify(items.map(x=>[x.key,x.label]));
  // Polling must not recreate a pressed button before its click event fires.
  if(existing?.dataset.obSig===sig)return;
  if(existing)existing.remove();
  const w=document.createElement('div');w.className='ob-hero-actions';w.dataset.obSig=sig;
  items.forEach(x=>{const b=document.createElement('button');b.type='button';b.className='ob-hero-action';b.textContent=x.label;b.title=x.label;b.onclick=e=>{e.preventDefault();e.stopPropagation();x.fn()};w.appendChild(b)});
  laneEl.appendChild(w);
}

function currentActiveSource(s){
  const p=s.pending,r=s.responseWindow;
  if(p?.type==='response_payment_choice'){
    const o=p.response_option||{},rw=p.incoming_response_window||{};
    return{side:p.side||rw.target_side||'PLAYER',lane:o.source_lane||rw.target_lane||null};
  }
  if(r)return{side:r.source_side,lane:r.source_lane};
  if(p?.source_side&&p?.source_lane && !['manual_reposition','source_selection','target_selection','tribute_target'].includes(p.type))
    return{side:p.source_side,lane:p.source_lane};
  return null;
}
function chainActions(s){
  const out=[];
  function walk(rw){
    if(!rw)return;
    if(rw.response_continuation)walk(rw.response_continuation);
    else if(rw.action)out.push(normalizeAction(rw.action,rw.card_id));
    else if(rw.card_id)out.push(normalizeAction(rw,rw.card_id));
    if(rw.kind==='incoming_card'&&rw.card_id&&!rw.action&&!out.some(a=>a.card_id===rw.card_id&&a.side===rw.source_side&&a.lane===rw.source_lane))
      out.push(normalizeAction(rw,rw.card_id));
  }
  walk(s.responseWindow);
  const p=s.pending;
  if(p?.type==='response_payment_choice'&&p.response_option){
    const rw=p.incoming_response_window||{},o=p.response_option;
    {const responseSide=p.side||rw.target_side||'PLAYER',responseLane=o.source_lane||rw.target_lane||null,responseHero=responseLane?sideHeroes(s,responseSide)?.[responseLane]:null;out.push({card_id:o.card_id,side:responseSide,lane:responseLane,source_card_id:o.source_card_id||heroImageId(responseHero)||null,target_side:rw.source_side,target_lane:rw.source_lane,no_source:!o.source_lane});}
  }
  if(p?.type==='racial_stoneblood'&&p.after_stoneblood_response?.action){
    out.push(normalizeAction(p.after_stoneblood_response.action,p.after_stoneblood_response.action.card_id));
  }
  if(['optional_swap','optional_target_swap'].includes(p?.type)&&p.card_id){
    out.push({card_id:p.card_id,side:p.source_side||'PLAYER',lane:p.source_lane||null,target_side:p.target_side||null,target_lane:p.target_lane||null,no_source:!p.source_lane});
  }
  const pendingAction=pendingActionInfo(s,p);
  if(pendingAction)out.push(pendingAction);
  return dedupeActions(out);
}
function normalizeAction(a,id){return{card_id:id||a.card_id,side:a.source_side||a.side||'AI',lane:a.source_lane||null,source_card_id:a.source_card_id||null,target_side:a.target_side||null,target_lane:a.target_lane||null,target_lanes:Array.isArray(a.target_lanes)?a.target_lanes.slice():null,no_source:!a.source_lane}}
function dedupeActions(a){const seen=new Set();return a.filter(x=>{const k=[x.card_id,x.side,x.lane,x.target_side,x.target_lane].join('|');if(seen.has(k))return false;seen.add(k);return true})}
function combatChainStillActive(s){
  const p=s?.pending;
  return !!(s?.responseWindow || ['response_payment_choice','optional_swap','optional_target_swap','racial_stoneblood','double_casting_target_selection','exact_two_target_selection'].includes(p?.type) || pendingActionInfo(s,p));
}
function renderCombatStacks(s){
  document.querySelectorAll('.ob-combat-stack').forEach(x=>x.remove());
  const now=chainActions(s).map(a=>resolveActionSourceLane(s,a));
  if(combatChainStillActive(s)){
    const merged=heldCombatCards.map(a=>resolveActionSourceLane(s,a));
    now.forEach(a=>{
      // One logical action only. Target changes/redirects update the same action instead of cloning it.
      const idx=merged.findIndex(x=>x.card_id===a.card_id&&x.side===a.side&&x.lane===a.lane);
      if(idx>=0)merged[idx]={...merged[idx],...a};else merged.push(a);
    });
    heldCombatCards=merged;
  }else heldCombatCards=now.slice();
  const chain=heldCombatCards.slice(),groups={};
  chain.forEach(a=>{
    // A played card is rendered exactly once on the battlefield.
    // If it has a Hero source (Skill/Attack/Scouting/etc.), keep the card above that source Hero.
    // The target is represented only by the connector line + arrow; never clone the card at the line end.
    // Source-less targeted Item/Event cards anchor to their Hero target. Cards with neither source nor target
    // remain only in Active Card.
    let anchorSide=null,anchorLane=null;
    if(a.lane&&!a.no_source){anchorSide=a.side;anchorLane=a.lane;}
    else if(a.target_side&&a.target_lane){anchorSide=a.target_side;anchorLane=a.target_lane;}
    if(!anchorSide||!anchorLane)return;
    const k=anchorSide+'|'+anchorLane;(groups[k]??=[]).push(a);
  });
  Object.entries(groups).forEach(([k,arr])=>{
    const [side,lane]=k.split('|'),host=uiLaneElement(side,lane);if(!host)return;
    const stack=document.createElement('div');stack.className='ob-combat-stack';
    arr.forEach((a,i)=>{
      const v=cv(a.card_id);if(!v)return;
      const c=document.createElement('div');c.className='ob-combat-card';c.style.setProperty('--ob-stack-y',(i*13)+'px');c.style.setProperty('--ob-stack-i',String(i));
      const im=document.createElement('img');im.src=art(a.card_id);im.alt=v.name;c.appendChild(im);c.addEventListener('dblclick',e=>{e.preventDefault();e.stopPropagation();openCardReview(a.card_id)});stack.appendChild(c);bindPreview(im);
    });
    host.appendChild(stack);
  });
  if(!combatChainStillActive(s))heldCombatCards=[];
  lastChainKey=JSON.stringify(chain);return chain;
}
function activeTargetContexts(s,chain){
  const p=s?.pending;
  // Pre-commit Mana selection is still the acting player's decision. Do not show a source->target
  // connector until payment is committed and the opponent actually owns a Response/decision window.
  if(['mana_shard_payment_choice','mana_spend_choice'].includes(p?.type)&&!s?.responseWindow)return[];
  const attack=findActiveAttackWindow(s);
  if(attack?.source_lane&&attack?.target_side){
    // Area / multi-target Attacks are resolved by the authoritative runtime one Hero at a time.
    // Follow the *current* response frame instead of drawing the whole queued affected_lanes list,
    // otherwise the player cannot tell which Hero a Defense/Response currently protects.
    if(attack.multi_sequence&&attack.target_lane){
      return[{source_side:attack.source_side,source_lane:attack.source_lane,target_side:attack.target_side,target_lane:attack.target_lane}];
    }
    const multi=(attack.affected_lanes&&attack.affected_lanes.length?attack.affected_lanes:[]).filter(Boolean);
    const lanes=multi.length?multi:(attack.target_lane?[attack.target_lane]:[]);
    if(lanes.length)return lanes.map(target_lane=>({source_side:attack.source_side,source_lane:attack.source_lane,target_side:attack.target_side,target_lane}));
  }
  if(p?.type==='exact_two_target_selection'&&p.source_side&&p.source_lane&&p.target_side&&(p.selected_target_lanes||[]).length){
    return (p.selected_target_lanes||[]).map(target_lane=>({source_side:p.source_side,source_lane:p.source_lane,target_side:p.target_side,target_lane}));
  }
  const candidates=[...(chain||[])].map(a=>resolveActionSourceLane(s,a)).reverse();
  const targeted=candidates.find(a=>a?.lane&&a?.target_side&&(a?.target_lane||(a?.target_lanes||[]).length));
  if(targeted){
    const lanes=(targeted.target_lanes&&targeted.target_lanes.length)?targeted.target_lanes:(targeted.target_lane?[targeted.target_lane]:[]);
    return lanes.map(target_lane=>({source_side:targeted.side,source_lane:targeted.lane,target_side:targeted.target_side,target_lane}));
  }
  const pa=pendingActionInfo(s,p);
  if(pa?.lane&&pa?.target_side&&(pa?.target_lane||(pa?.target_lanes||[]).length)){
    const lanes=(pa.target_lanes&&pa.target_lanes.length)?pa.target_lanes:[pa.target_lane];
    return lanes.filter(Boolean).map(target_lane=>({source_side:pa.side,source_lane:pa.lane,target_side:pa.target_side,target_lane}));
  }
  // AI Scouting can resolve its EXP choice immediately, so its pending state may be gone before
  // Option B gets a paint. While Scouting remains the latest Active Card in this phase, reuse the
  // authoritative played-event source/target snapshot so the player can still see which Hero was hit.
  const recent=latestResolvedActionThisPhase(s);
  if(recent?.card_id==='S1-EVT-003'&&recent.source_side&&recent.source_lane&&recent.target_side&&recent.target_lane){
    const key=String(recent.id||recent.timestamp||'')+'|'+recent.card_id+'|'+recent.source_side+'|'+recent.source_lane+'|'+recent.target_side+'|'+recent.target_lane;
    if(key!==transientConnectorKey){transientConnectorKey=key;transientConnectorUntil=performance.now()+280}
    if(performance.now()<transientConnectorUntil){const sourceLane=currentLaneForSourceCard(s,recent.source_side,recent.source_card_id||null,recent.source_lane)||recent.source_lane;return[{source_side:recent.source_side,source_lane:sourceLane,target_side:recent.target_side,target_lane:recent.target_lane}]}
  }
  return [];
}
function renderAttackLine(s,chain){
  svg.querySelectorAll(':scope > path').forEach(x=>x.remove());
  const contexts=activeTargetContexts(s,chain);if(!contexts.length)return;
  svg.setAttribute('viewBox','0 0 '+Math.max(1,window.innerWidth||1)+' '+Math.max(1,window.innerHeight||1));
  const seen=new Set();
  contexts.forEach(ctx=>{
    const key=[ctx.source_side,ctx.source_lane,ctx.target_side,ctx.target_lane].join('|');if(seen.has(key))return;seen.add(key);
    const src=heroCardEl(ctx.source_side,ctx.source_lane)?.parentElement||heroCardEl(ctx.source_side,ctx.source_lane);
    const tar=heroCardEl(ctx.target_side,ctx.target_lane)?.parentElement||heroCardEl(ctx.target_side,ctx.target_lane);
    if(!src||!tar)return;
    const from=src.getBoundingClientRect(),to=tar.getBoundingClientRect();
    if(from.width<1||to.width<1)return;
    const x1=from.left+from.width/2,y1=from.top+from.height/2,x2=to.left+to.width/2,y2=to.top+to.height/2,dx=x2-x1,dy=y2-y1,dist=Math.sqrt(dx*dx+dy*dy)||1;
    const a=Math.min(from.width,from.height)*.28,b=Math.min(to.width,to.height)*.28;
    const sx=x1+dx/dist*a,sy=y1+dy/dist*a,ex=x2-dx/dist*b,ey=y2-dy/dist*b,lift=Math.max(16,Math.min(70,dist*.12));
    const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('class','gl-pending-attack-line is-looping');line.setAttribute('marker-end','url(#obVsaiAttackArrow)');line.setAttribute('d',`M ${sx} ${sy} Q ${(sx+ex)/2} ${(sy+ey)/2-lift} ${ex} ${ey}`);svg.appendChild(line);
  });
}
function renderHand(s){
  const model=E().getHandModel(),rw=s.responseWindow,p=s.pending,responseMap=new Map();
  if(rw?.response_owner==='PLAYER')(rw.options||[]).forEach((o,i)=>{if(Number.isInteger(Number(o.hand_index))){const k=Number(o.hand_index);if(!responseMap.has(k))responseMap.set(k,[]);responseMap.get(k).push(i)}});
  const responseNeedsDiscard=p?.type==='response_payment_choice'&&Number(p.required_discard_count||0)>0;
  const discardSet=new Set(),discardMode=p&&(['hand_limit_discard','legacy_cost_selection'].includes(p.type)||responseNeedsDiscard)&&pendingOwner(p)==='PLAYER';
  if(discardMode){
    if(p.type==='hand_limit_discard')(s.playerHand||[]).forEach((_,i)=>discardSet.add(i));
    if(p.type==='response_payment_choice')(p.candidates||[]).forEach(x=>discardSet.add(Number(x.hand_index)));
    if(p.type==='legacy_cost_selection')(p.cost_candidates||[]).forEach(x=>discardSet.add(Number(x.hand_index??x.index)));
  }
  const directChoice=isDirectHandCardSearch(p)&&pendingOwner(p)==='PLAYER';
  const directCandidates=new Map();
  if(directChoice)(p.candidates||[]).forEach((x,i)=>directCandidates.set(Number(x.hand_index),i));
  const directSelected=selectedChoiceIndex(p);
  const pendingDraws=obPendingDrawReservations.PLAYER||[],hiddenDrawKey=[...obHiddenCommittedDrawSlots.PLAYER.keys()].sort((a,b)=>a-b).join(',');
  const signature=(s.playerHand||[]).map((id,idx)=>{
    const m=model[idx]||{},r=(responseMap.get(idx)||[]).join(','),d=discardSet.has(idx)?1:0,dc=directCandidates.has(idx)?directCandidates.get(idx):'';
    const ds=discardSelectionState(p,idx).selected?1:0;
    return [id,m.canPlay?1:0,m.canTribute?1:0,r,d,dc,directSelected===dc?1:0,ds,obHiddenCommittedDrawSlots.PLAYER.has(idx)?'H':''].join(':');
  }).join('|')+'#'+String(p?.type||'')+'#'+String(p?.resolve_to||'')+'#'+String(rw?.response_window_token||rw?.card_id||'')+'#'+String(uiResponseSourceChoice?.handIndex??'')+'#'+JSON.stringify(p?.selected_indices||p?.selected_cost_indices||p?.selected||[])+'#HD:'+hiddenDrawKey+'#PR:'+pendingDraws.map(x=>x.id).join(',');
  if(signature===handRenderKey)return;handRenderKey=signature;
  playerHandTrack.innerHTML='';
  (s.playerHand||[]).forEach((id,idx)=>{
    const v=cv(id),m=model[idx]||{},card=document.createElement('div');card.className='hand-card';card.dataset.index=idx;card.dataset.handIndex=idx;if(obHiddenCommittedDrawSlots.PLAYER.has(idx))card.classList.add('ob-presentation-hidden');
    const discardSel=discardSelectionState(p,idx);if(discardSel.selected)card.classList.add('is-selected','ob-discard-selected');
    const actions=document.createElement('div');actions.className='card-actions';let actionCount=0;
    if(rw?.response_owner==='PLAYER'){
      const opts=responseMap.get(idx)||[];
      if(opts.length){addAction(actions,'PLAY','play',()=>beginResponseFromHand(idx,opts));actionCount++}
    }else if(directChoice&&directCandidates.has(idx)){
      const choiceIndex=directCandidates.get(idx);
      if(p.resolve_to==='source_exp'){
        addAction(actions,'TRIBUTE','tribute',()=>intent('selectCardSearchChoice',[choiceIndex]));actionCount++;
        if(directSelected===choiceIndex)card.classList.add('is-selected');
      }else if(p.resolve_to==='discard_then_draw_three'){
        addAction(actions,'DISCARD','discard',()=>{intent('selectCardSearchChoice',[choiceIndex]);intent('handleChoiceConfirm',[])});actionCount++;
      }
    }else if(discardMode&&discardSet.has(idx)){
      addAction(actions,discardSel.selected?'CANCEL':'DISCARD',discardSel.selected?'cancel':'discard',()=>handleDiscardClick(p,idx));actionCount++;
    }else if(!s.pending&&!s.responseWindow&&s.turn==='PLAYER'){
      if(m.canPlay){addAction(actions,'PLAY','play',()=>intent('beginPlayFromHand',[idx]));actionCount++}
      if(m.canTribute){addAction(actions,'TRIBUTE','tribute',()=>intent('beginTributeFromHand',[idx]));actionCount++}
    }
    if(actionCount)card.classList.add('ob-has-action');
    card.appendChild(actions);const im=document.createElement('img');im.className='hand-art';im.src=art(id);im.alt=v?.name||'Card';im.draggable=false;card.appendChild(im);bindPreview(im);bindOptionBHandHover(card);card.ondblclick=e=>{e.preventDefault();e.stopPropagation();openCardReview(id)};playerHandTrack.appendChild(card);
  });
  pendingDraws.forEach((r,i)=>{
    const idx=(s.playerHand||[]).length+i,slot=document.createElement('div');slot.className='hand-card ob-draw-reservation-slot ob-presentation-hidden';slot.dataset.handIndex=idx;slot.dataset.drawReservationId=String(r.id||'');
    const im=document.createElement('img');im.className='hand-art';im.src='assets/ui/back-main.webp';im.alt='Incoming card';slot.appendChild(im);playerHandTrack.appendChild(slot);
  });
  applyHandFan(playerHandTrack,'PLAYER');
  requestAnimationFrame(syncPlayerHandToHeroCenter);
}
function addAction(host,label,cls,fn){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=e=>{e.stopPropagation();fn()};host.appendChild(b)}
function handleDiscardClick(p,handIndex){
  if(p.type==='hand_limit_discard'){
    const selectedNow=new Set((p.selected||[]).map(Number)),idx=Number(handIndex),willAdd=!selectedNow.has(idx),nextCount=selectedNow.size+(willAdd?1:-1),required=Math.max(0,Number(p.required||0));
    intent('toggleDiscardIndex',[handIndex]);
    if(willAdd&&nextCount>=required)intent('handleChoiceConfirm',[]);
    return;
  }
  if(p.type==='response_payment_choice'){
    const ci=(p.candidates||[]).findIndex(x=>Number(x.hand_index)===Number(handIndex));
    if(ci>=0){
      const selectedNow=new Set((p.selected_indices||[]).map(Number)),willAdd=!selectedNow.has(Number(ci)),nextCount=selectedNow.size+(willAdd?1:-1),required=Math.max(0,Number(p.required_discard_count||0));
      intent('selectResponsePaymentChoice',[ci]);
      if(willAdd&&nextCount>=required&&Number(p.mana_cost||0)<=0)intent('commitResponsePaymentChoice',[]);
    }
    return;
  }
  if(p.type==='legacy_cost_selection'){
    const ci=(p.cost_candidates||[]).findIndex(x=>Number(x.hand_index??x.index)===Number(handIndex));
    if(ci>=0){
      const selectedNow=new Set((p.selected_cost_indices||[]).map(Number)),willAdd=!selectedNow.has(Number(ci)),nextCount=selectedNow.size+(willAdd?1:-1),required=Math.max(1,Number(p.required_cost||1));
      intent('selectLegacyCostChoice',[ci]);
      if(willAdd&&nextCount>=required)intent('handleChoiceConfirm',[]);
    }
  }
}
function renderOpponentHand(s){
  const p=s.pending,choice=p?.type==='opponent_hand_choice'&&pendingOwner(p)==='PLAYER',scopeReveal=p?.type==='magic_scope_reveal'&&pendingOwner(p)==='PLAYER',reveal=choice?!!p.reveal_cards:scopeReveal;
  const pendingDraws=obPendingDrawReservations.AI||[],hiddenDrawKey=[...obHiddenCommittedDrawSlots.AI.keys()].sort((a,b)=>a-b).join(',');
  const key=JSON.stringify([s.aiHand||[],p?.type,choice?(p.candidates||[]):null,scopeReveal?(p.revealed_cards||[]):null,reveal,hiddenDrawKey,pendingDraws.map(x=>x.id)]);
  if(key===opponentHandRenderKey)return;opponentHandRenderKey=key;
  oppHandTrack.innerHTML='';document.querySelector('.ob-magic-scope-done')?.remove();
  if(choice){
    (p.candidates||[]).forEach((x,i)=>{const card=document.createElement('div');card.className='hand-card';card.dataset.handIndex=i;const im=document.createElement('img');im.className='hand-art';im.src=reveal?art(x.card_id):'assets/ui/back-main.webp';card.appendChild(im);card.style.cursor='pointer';card.onclick=e=>{if(e.detail>1)return;intent('selectOpponentHandChoice',[i]);intent('commitOpponentHandChoice',[])};if(reveal)card.ondblclick=e=>{e.preventDefault();e.stopPropagation();openCardReview(x.card_id)};oppHandTrack.appendChild(card);if(reveal)bindPreview(im)});
  }else if(scopeReveal){
    (p.revealed_cards||[]).forEach((id,i)=>{const card=document.createElement('div');card.className='hand-card';card.dataset.handIndex=i;const im=document.createElement('img');im.className='hand-art';im.src=art(id);card.appendChild(im);card.ondblclick=e=>{e.preventDefault();e.stopPropagation();openCardReview(id)};oppHandTrack.appendChild(card);bindPreview(im)});
    const hand=document.querySelector('.hand.top');if(hand){const done=document.createElement('button');done.type='button';done.className='ob-magic-scope-done';done.textContent='DONE';done.onclick=()=>intent('handleChoiceConfirm',[]);hand.appendChild(done)}
  }else{
    (s.aiHand||[]).forEach((_,i)=>{const card=document.createElement('div');card.className='hand-card';card.dataset.handIndex=i;if(obHiddenCommittedDrawSlots.AI.has(i))card.classList.add('ob-presentation-hidden');const im=document.createElement('img');im.className='hand-art';im.src='assets/ui/back-main.webp';card.appendChild(im);oppHandTrack.appendChild(card)});
    pendingDraws.forEach((r,i)=>{const idx=(s.aiHand||[]).length+i,slot=document.createElement('div');slot.className='hand-card ob-draw-reservation-slot ob-presentation-hidden';slot.dataset.handIndex=idx;slot.dataset.drawReservationId=String(r.id||'');const im=document.createElement('img');im.className='hand-art';im.src='assets/ui/back-main.webp';im.alt='Incoming card';slot.appendChild(im);oppHandTrack.appendChild(slot)});
  }
  applyHandFan(oppHandTrack,'AI');
  requestAnimationFrame(syncOpponentHand);
}
function renderPhase(s){
  const labels=[...document.querySelectorAll('.phase-label')];labels.forEach(x=>x.classList.toggle('active',x.textContent.trim().toUpperCase().startsWith(phaseName(s.phase).toUpperCase())));
  const turn=document.querySelector('.phase-turn .turn');turn.innerHTML=(s.turn==='PLAYER'?'YOUR TURN':(window.GL_PVP_CLIENT_MODE?'OPPONENT TURN':'AI TURN'))+'<small>TURN '+Number(s.round||1)+'</small>';
  const responseOwned=s.responseWindow?.response_owner==='PLAYER',p=s.pending;
  let mode='',label='REPOSITION';
  if(uiResponseSourceChoice){mode='cancel-response-source';label='CANCEL'}
  else if(pendingOwner(p)==='PLAYER'&&p?.type==='response_payment_choice'){mode='cancel-response-payment';label='CANCEL'}
  else if(responseOwned){mode='pass';label='PASS'}
  else if(pendingOwner(p)==='PLAYER'&&(p?.type==='optional_swap'||p?.type==='optional_target_swap')){mode='decline-swap';label='CANCEL'}
  else if(isPrecommitCancelable(s)||p?.type==='manual_reposition'){mode='cancel';label='CANCEL'}
  else{
    const pairs=E().getRepositionPairs()||[];
    if(s.turn==='PLAYER'&&(s.phase==='Deploy'||s.phase==='Reform')&&!s.pending&&!s.responseWindow&&pairs.length){mode='reposition';label='REPOSITION'}
  }
  primary.className='phase-action'+(mode==='pass'?' ob-pass':mode.startsWith('cancel')||mode==='decline-swap'?' ob-cancel':mode?'':' ob-hidden');primary.textContent=label;primary.disabled=!mode;
  primary.onclick=()=>{
    if(mode==='pass'){responseRollbackSnapshot=null;uiResponseSourceChoice=null;intent('responsePassNoStuck',[])}
    else if(mode==='cancel-response-source'){uiResponseSourceChoice=null;responseRollbackSnapshot=null;renderNow()}
    else if(mode==='cancel-response-payment'){if(!cancelResponsePrecommit())intent('cancelPendingAction',[])}
    else if(mode==='cancel'){intent('cancelPendingAction',[])}
    else if(mode==='decline-swap'){if(p?.type==='optional_swap')intent('performOptionalSwapDecision',[false]);else if(p?.type==='optional_target_swap')intent('performOptionalTargetSwapDecision',[false])}
    else if(mode==='reposition')intent('openManualRepositionChoice',[]);
  };
  const blocked=s.turn!=='PLAYER'||!!s.pending||!!s.responseWindow||!!uiResponseSourceChoice||s.gameOver||s.phase==='Draw';nextBtn.disabled=blocked;nextBtn.textContent=s.phase==='End'?'END TURN':'NEXT PHASE';nextBtn.onclick=()=>intent('advancePhase',[]);renderSwap(s);
}
function renderSwap(s){
  const p=s.pending,descriptors=[];
  if(p&&pendingOwner(p)==='PLAYER'){
    if(p.type==='manual_reposition'){
      const pairs=p.pairs||p.swap_pairs||E().getRepositionPairs()||[];
      pairs.forEach(pair=>{let a,b;if(Array.isArray(pair)){[a,b]=pair}else{const parts=String(pair).split(/[-–—<>|/ ]+/).filter(x=>laneOrder.includes(x));[a,b]=parts}if(a&&b)descriptors.push({kind:'manual',side:'PLAYER',a,b});});
    }else if(p.type==='optional_swap'){
      const a=p.source_lane,opts=(p.swap_options&&p.swap_options.length)?p.swap_options:(p.swap_lane?[p.swap_lane]:[]);opts.forEach(b=>{if(a&&b)descriptors.push({kind:'optional-source',side:p.source_side||'PLAYER',a,b})});
    }else if(p.type==='optional_target_swap'){
      const a=p.target_lane,opts=p.swap_options||[];opts.forEach(b=>{if(a&&b)descriptors.push({kind:'optional-target',side:p.target_side||'AI',a,b})});
    }
  }
  const sig=JSON.stringify(descriptors);
  if(sig!==swapRenderKey){
    swapRenderKey=sig;swapLayer.innerHTML='';
    descriptors.forEach((d,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.className='ob-swap-button';btn.setAttribute('aria-label','Swap positions');btn.dataset.swapIndex=String(i);
      const im=document.createElement('img');im.src='engine/assets/lobby/Swap.png';im.alt='Swap';btn.appendChild(im);
      if(d.kind==='manual')btn.onclick=()=>intent('performManualReposition',[d.a+'|'+d.b]);
      else if(d.kind==='optional-source')btn.onclick=()=>intent('performOptionalSwapDecision',[d.b]);
      else btn.onclick=()=>intent('performOptionalTargetSwapDecision',[d.b]);
      swapLayer.appendChild(btn);
    });
  }
  // Recalculate geometry every render/resize, but keep the actual button nodes stable.
  const br=BF.getBoundingClientRect();
  descriptors.forEach((d,i)=>{
    const btn=swapLayer.querySelector('[data-swap-index="'+i+'"]'),ae=uiLaneElement(d.side,d.a),be=uiLaneElement(d.side,d.b);if(!btn||!ae||!be)return;
    const ar=ae.getBoundingClientRect(),rr=be.getBoundingClientRect(),x=((ar.left+ar.width/2+rr.left+rr.width/2)/2-br.left)/currentUiScale(),y=((ar.top+ar.height/2+rr.top+rr.height/2)/2-br.top)/currentUiScale();
    btn.style.left=x+'px';btn.style.top=y+'px';
  });
}
function responsePaymentReady(s,p){
  const selectedDiscard=(p?.selected_indices||[]).length,requiredDiscard=Number(p?.required_discard_count||0);
  if(selectedDiscard<requiredDiscard)return false;
  const selected=new Set((p?.selected_mana_class_uids||[]).map(String));
  const values=new Map((p?.mana_class_choices||[]).map(x=>[String(x.uid),Number(x.value||1)]));
  let classValue=0;(s?.playerManaPoolCards||[]).forEach(sh=>{if(sh.kind==='CLASS'&&selected.has(String(sh.uid)))classValue+=values.get(String(sh.uid))||1});
  const generic=(s?.playerManaPoolCards||[]).filter(sh=>sh.kind!=='CLASS').length;
  return classValue+generic>=Number(p?.mana_cost||0);
}
function renderPay(s){
  const p=s.pending;
  const show=pendingOwner(p)==='PLAYER'&&['mana_shard_payment_choice','mana_spend_choice','response_payment_choice'].includes(p?.type)&&Number(p?.mana_cost??p?.selected_mana??1)>0;
  payBtn.classList.toggle('is-visible',!!show);
  if(!show)return;
  const pool=document.querySelector('.player-mana-pool'),br=BF.getBoundingClientRect(),pr=pool.getBoundingClientRect();
  payBtn.style.left=((pr.right-br.left)/currentUiScale()+8)+'px';
  payBtn.style.top=((pr.top+pr.height/2-br.top)/currentUiScale()-13)+'px';
  let ready=true;
  if(p.type==='mana_shard_payment_choice')ready=!!E().getManaPlan()?.plan?.ok;
  else if(p.type==='response_payment_choice')ready=responsePaymentReady(s,p);
  payBtn.disabled=!ready;
  payBtn.title=ready?'Pay selected Mana':'Select a valid Mana payment first';
  payBtn.onclick=()=>{
    if(payBtn.disabled)return;
    if(p.type==='mana_shard_payment_choice')intent('commitManaShardPaymentChoice',[]);
    else if(p.type==='response_payment_choice')intent('commitResponsePaymentChoice',[]);
    else intent('handleChoiceConfirm',[]);
  };
}
function renderDeckActions(){document.querySelectorAll('.ob-deck-actions').forEach(x=>x.remove());}
function currentPhaseStamp(s){return [s?.turn||'',Number(s?.round||1),s?.phase||''].join('|')}
function latestResolvedActionThisPhase(s){
  const stamp=currentPhaseStamp(s);
  return allEvents(s).find(e=>[e.turn||'',Number(e.round||1),e.phase||''].join('|')===stamp&&e.card_id)||null;
}
function renderSidebar(s,chain){
  turnBox.innerHTML=`<h3 class="gold">${s.turn==='PLAYER'?'Your Turn':(window.GL_PVP_CLIENT_MODE?'Opponent Turn':'AI Turn')}</h3><div class="tiny">Round ${Number(s.round||1)} · ${s.turn==='PLAYER'?'Player':(window.GL_PVP_CLIENT_MODE?'Opponent':'AI')}<br>Phase: ${esc(phaseName(s.phase))}<br>Mana ${Number(s.mana||0)} / 12 · Regen +${Number(s.manaRegen||0)}<br>${window.GL_PVP_CLIENT_MODE?'Opponent Mana':'AI Mana'} ${Number(s.aiMana||0)} / 12 · Regen +${Number(s.aiManaRegen||0)}</div>`;
  const phaseStamp=currentPhaseStamp(s);
  if(activeCardPhaseStamp!==phaseStamp){activeCardPhaseStamp=phaseStamp;activeCardHold=null}
  const live=topActive(s,chain);
  if(live?.card_id)activeCardHold={card_id:live.card_id,side:live.side||'PLAYER'};
  else{
    const evt=latestResolvedActionThisPhase(s);
    if(evt?.card_id)activeCardHold={card_id:evt.card_id,side:evt.side||'PLAYER'};
  }
  const active=live||activeCardHold,activeKey=active?[active.card_id,active.side].join('|'):'empty';
  if(activeStage.dataset.activeKey!==activeKey){
    hideSidebarHoverPreview();activeStage.dataset.activeKey=activeKey;activeStage.innerHTML='';
    if(active?.card_id){const v=cv(active.card_id),d=document.createElement('div');d.className='active-card-visual';const im=document.createElement('img');im.src=art(active.card_id);im.alt=v?.name||'Active card';d.appendChild(im);const owner=document.createElement('span');owner.className='active-owner';owner.textContent=active.side==='PLAYER'?'YOU':'OPPONENT';d.appendChild(owner);activeStage.appendChild(d);bindSidebarPreview(im)}
    else activeStage.innerHTML='<div class="ob-active-empty">No active card</div>';
  }
  renderHistory(s,chain);renderLog(s);
}
function topActive(s,chain){
  const p=s.pending,r=s.responseWindow;
  if(p?.type==='response_payment_choice'&&p.response_option)return{card_id:p.response_option.card_id,side:p.side||p.incoming_response_window?.target_side||'PLAYER'};
  if(r?.card_id)return{card_id:r.card_id,side:r.source_side||'AI'};
  const pa=pendingActionInfo(s,p);if(pa)return pa;
  return chain[chain.length-1]||null;
}
function allEvents(s){const a=[];(s.playerPlayedEvents||[]).forEach(e=>a.push({...e,side:'PLAYER'}));(s.opponentPlayedEvents||[]).forEach(e=>a.push({...e,side:'AI'}));return a.sort((x,y)=>Number(y.timestamp||0)-Number(x.timestamp||0))}
function renderHistory(s,chain){
  const activeIds=new Set(chain.map(a=>a.card_id+'|'+a.side)),events=allEvents(s).filter(e=>e.card_id&&!activeIds.has(e.card_id+'|'+e.side));
  events.forEach(e=>{const k=e.id||[e.side,e.card_id,e.timestamp].join('|');if(!historyKnown.has(k)){historyKnown.add(k);resolvedHistory.push(e)}});
  resolvedHistory.sort((a,b)=>Number(b.timestamp||0)-Number(a.timestamp||0));
  const draw=(host,arr,keepSix=false)=>{
    const sig=JSON.stringify(arr.map(e=>[e.id||'',e.side||'',e.card_id||'',Number(e.timestamp||0)]))+'|six:'+String(!!keepSix);
    if(host.dataset.obHistorySig===sig)return false;hideSidebarHoverPreview();host.dataset.obHistorySig=sig;host.innerHTML='';
    arr.forEach(e=>{const v=cv(e.card_id);if(!v)return;const d=document.createElement('button');d.type='button';d.className='played-card ob-played-clickable';d.title='View Card Played detail';const im=document.createElement('img');im.src=art(e.card_id);im.alt=v.name;im.draggable=false;d.appendChild(im);const o=document.createElement('span');o.className='played-owner';o.textContent=e.side==='PLAYER'?'YOU':'OPPONENT';d.appendChild(o);d.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();hideSidebarHoverPreview();openPlayedDetail(e.side,e.id)});host.appendChild(d);bindSidebarPreview(im)});
    if(keepSix){for(let i=host.children.length;i<6;i++){const ph=document.createElement('div');ph.className='played-card ob-played-placeholder';host.appendChild(ph)}}
    return true;
  };
  const changed=draw(playedGrid,resolvedHistory.slice(0,6),true)|draw(historyGrid,resolvedHistory,false);if(changed)requestAnimationFrame(fitPlayedCards);
}

function renderLog(s){battleLogPanel.querySelectorAll('.logline').forEach(x=>x.remove());(s.log||[]).forEach(line=>{const d=document.createElement('div');d.className='logline';d.textContent=line;battleLogPanel.appendChild(d)})}
function choiceCardTile(id,idx,selected,selectHandler){
  const v=cv(id),article=document.createElement('article');article.className='card-search-choice'+(selected?' selected':'');
  const previewBtn=document.createElement('button');previewBtn.type='button';previewBtn.className='discard-preview';
  const im=document.createElement('img');im.src=v?.thumb||art(id);im.alt=(v?.name||id)+' thumbnail';previewBtn.appendChild(im);
  const name=document.createElement('span');name.textContent=v?.name||id;previewBtn.appendChild(name);bindModalPreview(im);
  const select=document.createElement('button');select.type='button';select.className='discard-select';select.textContent=selected?'Selected':'Select';select.onclick=selectHandler;
  article.append(previewBtn,select);return article;
}
function renderAllowedModal(s){
  const p=s.pending,allowed=['card_search_choice','legacy_defeat_choice','legacy_card_choice','crystal_ball_reorder'];
  if(!p||!allowed.includes(p.type)||pendingOwner(p)!=='PLAYER'||isDirectHandCardSearch(p)){
    if(!p&&inspectState){renderInspectModal();return}
    hideModalHoverPreview();
    if(p)inspectState=null;
    choiceOverlay.classList.remove('open');activeModalType='';modalRenderKey='';return;
  }
  const modalSig=JSON.stringify({type:p.type,choice_id:p.choice_id||'',title:p.title||'',candidates:(p.candidates||[]).map(x=>typeof x==='string'?x:(x.card_id||x.id||x.hand_index||'')),selected_index:selectedChoiceIndex(p),selected_indices:p.selected_indices||[],selected_order:p.selected_order||[],required_count:p.required_count||p.required_choices||p.max_count||0,multi_select:!!p.multi_select,committing:!!p.committing,confirm_text:p.confirm_text||'',zone:p.zone||'',resolve_to:p.resolve_to||''});
  activeModalType=p.type;choiceOverlay.classList.add('open');
  // Polling renders used to destroy/recreate the modal buttons every 120 ms, which could eat
  // ordinary mouse clicks. Rebuild only when the choice state actually changes.
  if(modalRenderKey===modalSig)return;
  hideModalHoverPreview();
  modalRenderKey=modalSig;
  const title=choiceOverlay.querySelector('.ob-choice-title'),body=choiceOverlay.querySelector('.ob-choice-body'),confirm=choiceOverlay.querySelector('.ob-choice-confirm');
  title.textContent=p.title||({card_search_choice:'Choose Card',legacy_defeat_choice:'Choose Legacy',legacy_card_choice:'Legacy Choice',crystal_ball_reorder:'Crystal Ball — Reorder Top Deck'}[p.type]);
  body.innerHTML='';
  const instruction=document.createElement('p');instruction.className='choice-instruction';
  if(p.type==='legacy_defeat_choice')instruction.textContent=(cv(p.defeated_card_id)?.name||'Hero')+' was defeated. Choose which Legacy card will replace this Hero.';
  else if(p.type==='card_search_choice')instruction.textContent=p.instruction||'Select the required card choice.';
  else if(p.type==='legacy_card_choice')instruction.textContent='Choose exactly '+Number(p.required_choices||1)+' card(s).';
  else instruction.textContent='Reorder the revealed top cards. The first card shown will be the next card drawn.';
  body.appendChild(instruction);
  const grid=document.createElement('div');grid.className='choice-grid '+(p.type==='crystal_ball_reorder'?'reorder-choice-grid':'card-search-choice-grid');body.appendChild(grid);
  if(p.type==='legacy_defeat_choice'){
    (p.candidates||[]).forEach((raw,i)=>{const id=typeof raw==='string'?raw:(raw.card_id||raw.id);grid.appendChild(choiceCardTile(id,i,selectedChoiceIndex(p)===i,()=>intent('selectLegacyDefeatChoice',[i])))});
    const legacySelected=selectedChoiceIndex(p);confirm.textContent=p.committing?'Entering Legacy Mode…':'Enter Legacy Mode';confirm.disabled=!!p.committing||legacySelected==null||!(p.candidates||[])[legacySelected];
  }else if(p.type==='card_search_choice'){
    const req=p.multi_select?Math.min(Number(p.required_count||p.max_count||1),(p.candidates||[]).length):1;
    (p.candidates||[]).forEach((raw,i)=>{const id=typeof raw==='string'?raw:raw.card_id,sel=p.multi_select?(p.selected_indices||[]).includes(i):selectedChoiceIndex(p)===i;grid.appendChild(choiceCardTile(id,i,sel,()=>intent('selectCardSearchChoice',[i])))});
    const count=p.multi_select?(p.selected_indices||[]).length:(typeof p.selected_index==='number'?1:0);confirm.textContent=p.confirm_text||'Add Selected';confirm.disabled=count<req;
  }else if(p.type==='legacy_card_choice'){
    const req=Number(p.required_choices||1);
    (p.candidates||[]).forEach((raw,i)=>{const id=typeof raw==='string'?raw:raw.card_id,sel=(p.selected_indices||[]).includes(i)||selectedChoiceIndex(p)===i;grid.appendChild(choiceCardTile(id,i,sel,()=>intent('selectLegacyCardChoice',[i])))});
    confirm.textContent='Confirm Legacy Choice';confirm.disabled=(p.selected_indices||[]).length!==req && !(req===1&&typeof p.selected_index==='number');
  }else{
    (p.selected_order||[]).forEach((raw,i)=>{const id=typeof raw==='string'?raw:raw.card_id,v=cv(id),article=document.createElement('article');article.className='discard-choice';
      const pb=document.createElement('button');pb.type='button';pb.className='discard-preview';const im=document.createElement('img');im.src=v?.thumb||art(id);im.alt=(v?.name||id)+' thumbnail';pb.appendChild(im);const sp=document.createElement('span');sp.textContent='#'+(i+1)+' '+(v?.name||id);pb.appendChild(sp);bindModalPreview(im);
      const buttons=document.createElement('div');buttons.className='choice-footer-buttons';
      const up=document.createElement('button');up.type='button';up.textContent='Up';up.disabled=i===0;up.onclick=()=>intent('moveCrystalBallOrder',[i+':up']);
      const down=document.createElement('button');down.type='button';down.textContent='Down';down.disabled=i===(p.selected_order||[]).length-1;down.onclick=()=>intent('moveCrystalBallOrder',[i+':down']);
      buttons.append(up,down);article.append(pb,buttons);grid.appendChild(article);
    });confirm.textContent='Confirm Order';confirm.disabled=false;
  }
  confirm.onclick=()=>intent('handleChoiceConfirm',[]);
}
function autoSpecialChoices(s){const p=s.pending;if(!p||pendingOwner(p)!=='PLAYER')return;/* Scouting no longer has a pre-payment EXP-choice state in New UX. */}
function renderRacialTokens(s){const set=(sel,n)=>{const row=document.querySelector(sel);if(!row)return;row.innerHTML='';for(let i=0;i<2;i++){const im=document.createElement('img');im.className='racial-token';im.src=i<n?'assets/ui/Racial-Token-Head.webp':'assets/ui/Racial-Token-Tail.webp';row.appendChild(im)}};set('.player-right-rail .racial-row',Number(s.racial||0));set('.opponent-left-rail .racial-row',Number(s.aiRacial||0))}
function renderRegenCounter(side,value){
  const zone=zoneEl(side,'Shard Deck');if(!zone)return;let badge=zone.querySelector(':scope > .ob-regen-counter');if(!badge){badge=document.createElement('span');badge.className='ob-regen-counter';const im=document.createElement('img');badge.appendChild(im);zone.appendChild(badge)}
  const n=Math.max(1,Math.min(6,Number(value||1))),im=badge.querySelector('img');im.src='engine/assets/counters/Counter-'+n+'.png';im.alt='Mana Regen '+n;badge.title='Mana Regen +'+n;
}
function renderRails(s){
  configureStaticZones();
  const playerZones=document.querySelectorAll('.player-field .zone'),oppZones=document.querySelectorAll('.opponent-field .zone');
  if(playerZones[0])playerZones[0].querySelector('.count').textContent=(s.playerLegacy||[]).length;
  if(playerZones[1])playerZones[1].querySelector('.count').textContent=(s.playerManaDeck||[]).length;
  if(document.querySelector('.player-right-rail .zone:nth-child(1) .count'))document.querySelector('.player-right-rail .zone:nth-child(1) .count').textContent=(s.playerDiscard||[]).length;
  if(document.querySelector('.player-right-rail .zone:nth-child(2) .count'))document.querySelector('.player-right-rail .zone:nth-child(2) .count').textContent=(s.playerDeck||[]).length;
  if(oppZones[0])oppZones[0].querySelector('.count').textContent=(s.aiDeck||[]).length;
  if(oppZones[1])oppZones[1].querySelector('.count').textContent=(s.aiDiscard||[]).length;
  if(document.querySelector('.opponent-right-rail .zone:nth-child(1) .count'))document.querySelector('.opponent-right-rail .zone:nth-child(1) .count').textContent=(s.aiManaDeck||[]).length;
  if(document.querySelector('.opponent-right-rail .zone:nth-child(2) .count'))document.querySelector('.opponent-right-rail .zone:nth-child(2) .count').textContent=(s.aiLegacy||[]).length;
  const setTop=(selector,arr,back,{emptyBlank=false}={})=>{const zone=document.querySelector(selector),im=zone?.querySelector('img.zoneCard, img');if(!im)return;const id=arr?.[arr.length-1];if(!id&&emptyBlank){im.removeAttribute('src');im.style.visibility='hidden';zone?.classList.add('ob-empty-discard');return}im.style.visibility='';zone?.classList.remove('ob-empty-discard');im.src=id?art(id):back;};
  setTop('.player-right-rail .zone:nth-child(1)',s.playerDiscard,'assets/ui/back-main.webp',{emptyBlank:true});
  setTop('.opponent-left-rail .zone:nth-child(3)',s.aiDiscard,'assets/ui/back-main.webp',{emptyBlank:true});
  renderRegenCounter('PLAYER',s.manaRegen);renderRegenCounter('AI',s.aiManaRegen);renderRacialTokens(s);
}
function repairBlockingStateIfNeeded(s){
  const p=s?.pending,rw=s?.responseWindow;
  const orphanResponse=p?.type==='response_window'&&!rw;
  const ownerlessResponse=!!(rw&&!rw.response_owner&&rw.target_side);
  const missingResponsePending=!!(rw&&!p);
  if(!orphanResponse&&!ownerlessResponse&&!missingResponsePending)return false;
  if(window.GL_PVP_CLIENT_MODE)return false;
  const rv=E()?.intent?.('repairOrphanBlockingState',[]);
  return !!rv?.ok;
}
function clearResultTimer(){if(resultCleanupTimer){clearTimeout(resultCleanupTimer);resultCleanupTimer=null;}}
function returnToLobbyAfterResult(){clearResultTimer();resultOverlay.classList.remove('open');if(window.GL_PVP_CLIENT_MODE&&window.GL_PVP_NETWORK?.resetRoom){window.GL_PVP_NETWORK.resetRoom();return}try{window.location.reload()}catch{location.href=location.href}}
function showGameResult(s){
  if(!s?.gameOver||resultShown)return;
  resultShown=true;clearResultTimer();
  const localName=String(window.GL_PVP_LOCAL_NAME||'YOU'),opponentName=String(window.GL_PVP_OPPONENT_NAME||'OPPONENT');
  const winner=s.winner==='PLAYER'?(window.GL_PVP_CLIENT_MODE?localName:'YOU'):(s.winner==='AI'?(window.GL_PVP_CLIENT_MODE?opponentName:'LOCAL AI'):String(s.winner||'UNKNOWN'));
  const reason=String(s.gameEndReason||'Game ended.');
  const phase=phaseName(s.phase)||'Unknown';
  const body=resultOverlay.querySelector('.ob-result-body');
  resultOverlay.querySelector('#obResultTitle').textContent='Game Result';
  body.innerHTML='<div class="ob-result-summary"><section class="ob-result-winner"><span>Winner</span><strong>'+esc(winner)+'</strong></section><section class="ob-result-reason"><span>Reason</span><strong>'+esc(reason)+'</strong></section><section class="ob-result-round"><span>Round</span><strong>'+Number(s.round||1)+'</strong><small>'+esc((s.turn==='PLAYER'?(window.GL_PVP_CLIENT_MODE?localName:'Player'):s.turn==='AI'?(window.GL_PVP_CLIENT_MODE?opponentName:'Local AI'):String(s.turn||''))+' · '+phase+' Phase')+'</small></section></div><div class="ob-result-actions"><div class="ob-result-buttons"><button type="button" class="ob-result-close">CLOSE</button><button type="button" class="ob-result-back">BACK TO LOBBY</button></div><small>Returns to the lobby automatically after 1 minute.</small></div>';
  body.querySelector('.ob-result-close').onclick=()=>resultOverlay.classList.remove('open');
  body.querySelector('.ob-result-back').onclick=returnToLobbyAfterResult;
  resultOverlay.classList.add('open');
  resultCleanupTimer=setTimeout(()=>{resultCleanupTimer=null;if(st()?.gameOver)returnToLobbyAfterResult()},60000);
}
function renderNow(){
  const s=st();if(!s)return;
  // Only normalize objectively inconsistent Response state. Mandatory gameplay choices are never force-cleared.
  if(repairBlockingStateIfNeeded(s)){setTimeout(renderNow,0);return;}
  const presentationPlan=buildPresentationPlan(s);
  if(uiResponseSourceChoice&&s.responseWindow?.response_owner!=='PLAYER')uiResponseSourceChoice=null;
  if(responseRollbackSnapshot&&s.pending?.type!=='response_payment_choice'&&!uiResponseSourceChoice&&s.responseWindow?.response_owner!=='PLAYER')responseRollbackSnapshot=null;
  autoSpecialChoices(s);const chain=renderCombatStacks(s);
  for(const side of ['PLAYER','AI'])for(const lane of laneOrder)renderHero(side,lane,sideHeroes(s,side)?.[lane],s);
  renderHand(s);renderOpponentHand(s);renderMana();renderPhase(s);renderPay(s);renderDeckActions(s);renderAttackLine(s,chain);renderSidebar(s,chain);renderAllowedModal(s);renderRails(s);syncSoundButton();preparePresentationTargets(presentationPlan);showGameResult(s);
  requestAnimationFrame(()=>{syncPlayerManaPoolToHeroLeft();syncPlayerHandToHeroCenter();syncOpponentHand();syncPlayerNameBox();layoutManaPoolCards(playerManaHost);layoutManaPoolCards(aiManaHost);runPresentationPlan(presentationPlan,s)});
}
function clearAuthoredDummyState(){
  document.querySelectorAll('.hand-track').forEach(x=>x.innerHTML='');
  document.querySelectorAll('.hero-lane').forEach(lane=>{lane.querySelectorAll('.hero-card').forEach(x=>x.innerHTML='');lane.querySelectorAll('.attachment-card,.trait,.ob-combat-stack,.ob-status-stack,.ob-hero-actions,.ob-hp-overlay').forEach(x=>x.remove())});
  document.querySelectorAll('.mana-cards').forEach(x=>x.innerHTML='');
  document.querySelector('.played')?.replaceChildren();
  document.querySelector('.history-grid')?.replaceChildren();
  document.querySelector('.active-card-visual')?.replaceChildren();
  document.querySelectorAll('.battlelog-panel .logline').forEach(x=>x.remove());
  const feedback=document.getElementById('actionFeedback');if(feedback)feedback.textContent='';
}
function invalidateHandRender(side){if(side==='AI')opponentHandRenderKey='';else handRenderKey='';}
function markReservedDrawEventHandled(reservation){
  const snap=st(),events=snap?.presentationEvents||[];
  for(let i=events.length-1;i>=0;i--){const e=events[i];if(e?.type==='CARD_DRAWN'&&e.side===reservation.side&&Number(e.hand_index)===Number(reservation.hand_index)&&String(e.card_id)===String(reservation.card_id)){if(e.id)seenPresentationEvents.add(e.id);break}}
}
function queueOptionBReservedDraw(reservation,commit){
  if(!reservation||typeof commit!=='function')return false;
  const side=reservation.side==='AI'?'AI':'PLAYER',list=obPendingDrawReservations[side];list.push(reservation);invalidateHandRender(side);renderNow();
  const run=()=>new Promise(resolve=>{requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const from=zoneEl(side,'Main Deck'),hand=side==='PLAYER'?playerHandTrack:oppHandTrack,to=hand?.querySelector('.ob-draw-reservation-slot[data-draw-reservation-id="'+CSS.escape(String(reservation.id||''))+'"]');
    const finish=()=>{try{commit()}finally{markReservedDrawEventHandled(reservation);const at=list.findIndex(x=>String(x.id)===String(reservation.id));if(at>=0)list.splice(at,1);invalidateHandRender(side);renderNow();resolve()}};
    if(!flyBetween('assets/ui/back-main.webp',from?.querySelector('.zoneCard')||from,to,360,finish))finish();
  }))});
  obExternalDrawSequence=obExternalDrawSequence.then(run,run);return true;
}
window.GL_OPTION_B_PRESENTATION={queueReservedMainDeckDraw:queueOptionBReservedDraw,isBusy:optionBPresentationBusy};

function initStableBattlefieldReviewGestures(){
  if(!BF||BF.dataset.obStableReviewBound==='1')return;BF.dataset.obStableReviewBound='1';
  // Attachment nodes are intentionally recreated by the 120 ms renderer. Browser `dblclick`
  // depends on the same DOM target surviving both complete click cycles, so Firefox can lose it.
  // Count stable delegated pointer-downs instead: pointerdown fires before a polling rerender can
  // remove the pressed node, and the logical attachment key survives node replacement.
  BF.addEventListener('pointerdown',e=>{
    if(e.button!=null&&e.button!==0)return;
    const card=e.target?.closest?.('.attachment-card[data-ob-card-id]');
    if(!card||!BF.contains(card)){obAttachmentLastPress={key:'',at:0};return}
    const id=card.dataset.obCardId;if(!id)return;
    const key=[card.dataset.obAttachmentSide||'',card.dataset.obAttachmentLane||'',card.dataset.obAttachmentSlot||'',id].join('|'),now=performance.now();
    if(obAttachmentLastPress.key===key&&now-obAttachmentLastPress.at<=650){
      e.preventDefault();e.stopPropagation();obAttachmentLastPress={key:'',at:0};openCardReview(id);return;
    }
    obAttachmentLastPress={key,at:now};
  },true);
}


function initSidebarControls(){document.getElementById('fullHistoryBtn').onclick=()=>{hideSidebarHoverPreview();sidebar.classList.add('history-open');sidebar.classList.remove('battlelog-open')};document.getElementById('historyClose').onclick=()=>{hideSidebarHoverPreview();sidebar.classList.remove('history-open')};document.getElementById('battleLogBtn').onclick=()=>{hideSidebarHoverPreview();sidebar.classList.add('battlelog-open');sidebar.classList.remove('history-open')};document.getElementById('battleLogClose').onclick=()=>{hideSidebarHoverPreview();sidebar.classList.remove('battlelog-open')};if(soundBtn)soundBtn.onclick=()=>{E().toggleSound?.();syncSoundButton()};document.querySelector('.bottom-actions .danger').onclick=()=>{if(confirm('Surrender this match?'))intent('executeConfirmedSurrender',[])};syncSoundButton();}
function boot(){if(!E()||!B()){setTimeout(boot,50);return}B().setExternalHumanUi?.(true);E().setExternalHumanUi?.(true);B().setRenderSuppressed(true);document.getElementById('glPendingAttackDirectionLayer')?.remove();clearAuthoredDummyState();configureStaticZones();initStableBattlefieldReviewGestures();initSidebarControls();lockPrimaryActionWidth();renderLobby();setInterval(()=>{if(!lobbyIsOpen)renderNow()},120);window.addEventListener('resize',()=>requestAnimationFrame(()=>{if(lobbyIsOpen)return;syncPlayerManaPoolToHeroLeft();syncPlayerHandToHeroCenter();syncOpponentHand();syncPlayerNameBox();layoutManaPoolCards(playerManaHost);layoutManaPoolCards(aiManaHost);renderAttackLine(st(),chainActions(st()))}),{passive:true});window.GL_OPTION_B_UI={render:renderNow,state:st,intent,openLobby:()=>{lobbyIsOpen=true;renderLobby()},setPvpLobbyOpen:(open)=>{lobbyIsOpen=!!open;if(lobbyIsOpen){renderLobby()}else{lobbyOverlay.classList.remove('open');coinOverlay.classList.remove('open');appRoot?.classList.remove('ob-lobby-hidden');renderNow()}},closeInspect:closeInspectModal};}
boot();
})();
