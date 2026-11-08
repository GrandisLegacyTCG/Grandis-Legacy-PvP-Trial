(()=>{
'use strict';
// The Season 0 battlefield is a scaled/rotated desktop canvas. At phone sizes
// its in-canvas controls can become 8-13 CSS pixels tall. This supplemental
// dock lives OUTSIDE that scaled canvas and forwards clicks to the real engine
// buttons, keeping game rules and the original UI callbacks unchanged.
if(window.GL_APP_MODE!=='PVP')return;
const root=document.documentElement;
const dock=document.createElement('nav');dock.id='glPvPTouchDock';
dock.setAttribute('aria-label','Touch gameplay actions');
dock.innerHTML='<span class="gl-pvp-touch-help" id="glPvPTouchHelp">Tap a card to select</span><div class="gl-pvp-touch-buttons" id="glPvPTouchButtons"></div>';
document.body.appendChild(dock);
let selectedIndex=-1,selectedCardId='',scheduled=false;
const buttons=dock.querySelector('#glPvPTouchButtons'),help=dock.querySelector('#glPvPTouchHelp');
const isTouch=()=>{try{return navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches}catch{return false}};
const isVisible=el=>!!(el&&el.isConnected&&!el.disabled&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
function nextFrame(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})}
function sync(){
 if(!isTouch()){dock.hidden=true;return}
 const net=window.GL_S0_PVP_NETWORK?.state;
 if(!net?.connected||net.role!=='player'||net.status!=='started'||window.GL_GAME_UI?.openingBusy?.()){
   dock.hidden=true;return;
 }
 const sources=[];const seen=new Set();
 const add=(el,label)=>{
   if(!isVisible(el))return;
   const text=String(label||el.textContent||'ACTION').trim();
   if(!text||seen.has(el))return;seen.add(el);
   sources.push({el,text});
 };
 const stage=document.querySelector('.gl-center-choice-stage.open');
 if(stage?.classList.contains('is-busy')){dock.hidden=true;return}
 if(stage){
   // Preserve server-authoritative pending choices, especially PAY/CONFIRM and CANCEL.
   for(const el of stage.querySelectorAll('.gl-center-choice-actions button')){
     if(sources.length>=3)break;
     add(el);
   }
 }else{
   const selected=[...document.querySelectorAll('.hand.bottom .hand-card')].find(c=>Number(c.dataset.handIndex)===selectedIndex);
   if(selected){
     const image=selected.querySelector('.hand-art');
     if(image?.getAttribute('src')===selectedCardId){
       selected.classList.add('gl-pvp-touch-selected');
       for(const el of selected.querySelectorAll('.card-actions button'))add(el);
     }else selectedIndex=-1;
   }
   const main=document.getElementById('phasePrimaryAction');
   const next=document.querySelector('.phase-action.next');
   if(main&&main.textContent.trim()!=='REPOSITION')add(main);
   if(next)add(next);
   if(sources.length<3&&main&&main.textContent.trim()==='REPOSITION')add(main);
 }
 // Do not rebuild the dock on each render if its controls are unchanged.
 const sig=[net.revision,selectedIndex,selectedCardId,stage?.className||'',...sources.map(a=>a.text+'|'+(a.el.disabled?'0':'1'))].join('::');
 if(dock.dataset.signature!==sig){
   dock.dataset.signature=sig;buttons.replaceChildren();
   for(const {el,text} of sources){
     const btn=document.createElement('button');btn.type='button';btn.textContent=text;btn.className='gl-pvp-touch-button';
     if(/^(PASS|PAY|PLAY|CONFIRM|NEXT PHASE|END TURN|START)$/i.test(text))btn.classList.add('is-primary');
     // Store a resolver rather than an old DOM node: a fresh authoritative
     // snapshot may rebuild the Hand while the player is touching the dock.
     btn.addEventListener('click',()=>{
       if(!el.isConnected||el.disabled){window.dispatchEvent(new CustomEvent('gl-pvp-touch-stale'));nextFrame();return}
       el.click();nextFrame();
     });
     buttons.appendChild(btn);
   }
 }
 help.textContent=sources.length?'TOUCH ACTIONS':'Tap a card or choose a Hero';
 dock.hidden=!sources.length;
}
document.addEventListener('pointerup',e=>{
 if(!isTouch()||e.target?.closest?.('#glPvPTouchDock'))return;
 const card=e.target?.closest?.('.hand.bottom .hand-card');
 if(!card||e.target?.closest?.('.card-actions button'))return;
 const i=Number(card.dataset.handIndex);
 if(!Number.isInteger(i))return;
 selectedIndex=i;selectedCardId=card.querySelector('.hand-art')?.getAttribute('src')||'';
 for(const c of document.querySelectorAll('.hand.bottom .hand-card'))c.classList.toggle('gl-pvp-touch-selected',c===card);
 nextFrame();
},true);
window.addEventListener('gl-pvp-touch-stale',()=>nextFrame());
window.addEventListener('gl-pvp-intent-error',()=>nextFrame());
window.GL_PVP_TOUCH_SYNC=nextFrame;
window.addEventListener('resize',nextFrame,{passive:true});
document.addEventListener('visibilitychange',nextFrame);
// Low-frequency state reconciliation, not battlefield rendering or network polling.
setInterval(nextFrame,850);
nextFrame();
})();
