/* ============================================================================
 * Grandis Legacy PvP v3.75.5 — Option-B Animation Player
 *
 * Menerjemahkan authoritative server animation events menjadi gerakan kartu
 * (flyBetween) yang VISIBLE di Option-B battlefield DOM.
 *
 * Menggantikan jalur lama via GL_LOCAL_AI_BRIDGE (fungsi capture dan queue), yang:
 *  - memakai selector DOM old-engine yang tidak ada di Option-B DOM, dan
 *  - me-render ke #glAnimationLayer di dalam .ob-engine-host{display:none},
 * sehingga semua animasi card_play/tribute/discard tertelan diam-diam.
 *
 * Pola pakai (two-phase, mengikuti net layer):
 *   const plans = GL_PVP_ANIMATOR.prepareAll(events); // SEBELUM import snapshot
 *   ... importViewerSafeSnapshot(...) + render ...
 *   GL_PVP_ANIMATOR.playAll(plans);                    // SESUDAH render
 * ========================================================================== */
(function(){
'use strict';

var LANE_ORDER = ['LEFT','CENTER','RIGHT'];

/* ---------- anchor helpers (mirror option-b-runtime zone mapping) ---------- */

function zoneEl(side, type){
  var map = {
    'PLAYER|Legacy Deck':'.player-field > .rail-pair:first-child .zone:nth-child(1)',
    'PLAYER|Shard Deck':'.player-field > .rail-pair:first-child .zone:nth-child(2)',
    'PLAYER|Discard Pile':'.player-right-rail .zone:nth-child(1)',
    'PLAYER|Main Deck':'.player-right-rail .zone:nth-child(2)',
    'AI|Main Deck':'.opponent-left-rail .zone:nth-child(2)',
    'AI|Discard Pile':'.opponent-left-rail .zone:nth-child(3)',
    'AI|Shard Deck':'.opponent-right-rail .zone:nth-child(1)',
    'AI|Legacy Deck':'.opponent-right-rail .zone:nth-child(2)'
  };
  var el = document.querySelector(map[side+'|'+type]||'');
  return el || null;
}
function zoneCardEl(side, type){
  var z = zoneEl(side, type);
  return (z && z.querySelector('.zoneCard, img')) || z;
}
function handCardEl(side, handIndex){
  if(!Number.isInteger(Number(handIndex))) return null;
  var track = side==='AI' ? document.querySelector('.hand.top .hand-track')
                          : document.querySelector('.hand.bottom .hand-track');
  if(!track) return null;
  var card = track.querySelector('.hand-card[data-hand-index="'+Number(handIndex)+'"]');
  return (card && (card.querySelector('.hand-art, img') || card)) || null;
}
function heroCardEl(side, lane){
  var idx = LANE_ORDER.indexOf(String(lane||'').toUpperCase());
  if(idx < 0) return null;
  var lanes = document.querySelectorAll(
    (side==='AI' ? '.opponent-field' : '.player-field') + ' .hero-grid .hero-lane');
  var laneEl = lanes[idx];
  return (laneEl && laneEl.querySelector('.hero-card')) || null;
}
function activeCardEl(){
  return document.querySelector('.active-card-visual img') ||
         document.querySelector('.active-card-visual');
}
function battlefieldCenter(){
  return document.querySelector('.battlefield') || document.body;
}

/* ---------- animation layer (visible, own) ---------- */

var layer = null;
function animLayer(){
  if(layer && document.contains(layer)) return layer;
  layer = document.createElement('div');
  layer.className = 'pvp-anim-layer';
  layer.setAttribute('aria-hidden','true');
  layer.style.cssText = 'position:fixed;inset:0;z-index:30000;pointer-events:none;overflow:hidden;';
  document.body.appendChild(layer);
  return layer;
}
function rectOf(el){
  if(!el || typeof el.getBoundingClientRect !== 'function') return null;
  try{
    var r = el.getBoundingClientRect();
    if(!r || !isFinite(r.left) || !isFinite(r.top) || r.width < 1 || r.height < 1) return null;
    return {left:r.left, top:r.top, width:r.width, height:r.height};
  }catch(e){ return null; }
}
function playSound(){
  try{
    var b = window.GL_LOCAL_AI_BRIDGE;
    if(b && typeof b.playAuthoritativeCardSound === 'function'){ b.playAuthoritativeCardSound(); return; }
    var e = window.GL_OPTION_B_ENGINE;
    if(e && typeof e.playCardMotionSound === 'function') e.playCardMotionSound();
  }catch(err){}
}
function fly(src, fromRect, toEl, duration, onFinish){
  if(!src || !fromRect) { if(typeof onFinish==='function') onFinish(false); return false; }
  var toRect = rectOf(toEl);
  if(!toRect){ if(typeof onFinish==='function') onFinish(false); return false; }
  var im = document.createElement('img');
  im.src = src;
  im.style.cssText = 'position:fixed;left:'+fromRect.left+'px;top:'+fromRect.top+'px;'
    + 'width:'+fromRect.width+'px;height:'+fromRect.height+'px;'
    + 'object-fit:cover;border-radius:5px;pointer-events:none;'
    + 'filter:drop-shadow(0 5px 9px rgba(0,0,0,.55));z-index:30001;';
  animLayer().appendChild(im);
  playSound();
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    im.style.transition = 'transform '+duration+'ms cubic-bezier(.2,.75,.2,1),'
      + 'opacity '+duration+'ms ease,width '+duration+'ms ease,height '+duration+'ms ease';
    im.style.transform = 'translate('+(toRect.left-fromRect.left)+'px,'+(toRect.top-fromRect.top)+'px)';
    im.style.width = toRect.width+'px';
    im.style.height = toRect.height+'px';
    im.style.opacity = '.8';
  });});
  setTimeout(function(){
    if(im.parentNode) im.parentNode.removeChild(im);
    if(typeof onFinish==='function') onFinish(true);
  }, duration + 30);
  return true;
}
function art(cardId){
  return cardId ? 'card-art/'+encodeURIComponent(cardId)+'.webp' : '';
}

/* ---------- destination resolution ---------- */

function destinationEl(evt){
  var d = evt.destination || {type:'target'};
  var side = d.side || evt.actor_side || 'PLAYER';
  if(d.type === 'discard') return zoneCardEl(side, 'Discard Pile');
  if(d.type === 'hand'){
    var track = side==='AI' ? document.querySelector('.hand.top .hand-track')
                            : document.querySelector('.hand.bottom .hand-track');
    return track || battlefieldCenter();
  }
  if(d.type === 'hero' || d.type === 'attachment' || d.type === 'target'){
    var lane = d.lane || evt.target_lane || evt.source_lane;
    var tside = d.side || evt.target_side || evt.source_side || side;
    var hero = lane ? heroCardEl(tside, lane) : null;
    if(hero) return hero;
  }
  // 'target' tanpa lane jelas (mis. Event ke tengah) -> Active Card slot
  var ac = activeCardEl();
  return ac || battlefieldCenter();
}

/* ---------- two-phase API ---------- */

// Phase 1 (SEBELUM snapshot di-import): capture rect asal dari DOM saat ini.
function prepare(evt){
  if(!evt || !evt.kind) return null;
  var kind = evt.kind, side, from = null, src = '';
  if(kind === 'card_play' || kind === 'tribute'){
    side = evt.actor_side === 'AI' ? 'AI' : 'PLAYER';
    from = handCardEl(side, evt.hand_index);
    // fallback: area hand (kartu mungkin sudah tidak di index itu)
    if(!from){
      var track = side==='AI' ? document.querySelector('.hand.top .hand-track')
                              : document.querySelector('.hand.bottom .hand-track');
      from = track || battlefieldCenter();
    }
    src = art(evt.card_id);
  }else if(kind === 'hand_to_discard'){
    side = evt.actor_side === 'AI' ? 'AI' : 'PLAYER';
    from = handCardEl(side, evt.hand_index)
        || (side==='AI' ? document.querySelector('.hand.top .hand-track')
                        : document.querySelector('.hand.bottom .hand-track'));
    src = art(evt.card_id);
  }else if(kind === 'attachment_to_discard'){
    side = evt.actor_side === 'AI' ? 'AI' : 'PLAYER';
    from = heroCardEl(side, evt.lane);
    src = art(evt.card_id);
  }else if(kind === 'legacy_to_deck'){
    side = evt.actor_side === 'AI' ? 'AI' : 'PLAYER';
    from = heroCardEl(side, evt.lane);
    src = art(evt.card_id);
  }else if(kind === 'held_card_release'){
    // Option-B tidak punya visual held-card; terbangkan art ke destinasi.
    from = activeCardEl() || battlefieldCenter();
    src = art(evt.card_id);
  }else{
    return null; // kind lain ditangani jalur diff (renderNow) atau opening sequence
  }
  var fromRect = rectOf(from);
  if(!fromRect || !src) return null;
  return {evt:evt, fromRect:fromRect, src:src};
}

// Phase 2 (SESUDAH import + render): terbangkan ke anchor tujuan saat ini.
function play(plan, duration){
  if(!plan || !plan.evt) return false;
  var to = destinationEl(plan.evt);
  return fly(plan.src, plan.fromRect, to, duration || 420);
}

function prepareAll(events){
  var out = [];
  (events || []).forEach(function(evt){
    try{
      var p = prepare(evt);
      if(p) out.push(p);
    }catch(e){}
  });
  return out;
}
function playAll(plans, duration){
  var ok = false;
  (plans || []).forEach(function(p){
    try{ if(play(p, duration)) ok = true; }catch(e){}
  });
  return ok;
}

window.GL_PVP_ANIMATOR = {
  version: 'pvp-v3.75.5-1.0',
  prepare: prepare,
  prepareAll: prepareAll,
  play: play,
  playAll: playAll,
  // diekspos untuk debug
  _zoneEl: zoneEl, _handCardEl: handCardEl, _heroCardEl: heroCardEl
};
})();
