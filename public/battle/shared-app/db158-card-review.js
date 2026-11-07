/* Card Review UI: Deck Builder v1.58 layout/typography/keyword explanations.
   Read-only presentation. Source of ALL card values is active OSA S0 DEV45 consumer.
   Kept isolated in an iframe to avoid changing the v6.91.9 battlefield CSS. */
(function(g){'use strict';
  var files=['app.css','s0-enhancements-v1.32.2.css','s0-shared-header-review.css','s0-part7-revision-v1.36.css','s0-part7-revision-v1.38.css','s0-part7-revision-v1.39.css','s0-review-v1.41.css','s0-review-v1.42.css','s0-review-v1.43.css','s0-review-v1.44.css','s0-ui-v1.49.css','s0-hotfix-v1.49.1.css','s0-layout-v1.50.css','s0-modal-parity-v1.52.css','s0-review-v1.54.css','s0-review-v1.56.css','s0-review-v1.57.css','s0-launch-v1.58.css','s0-rulebook-v2.9-review-v1.58.css'];
  function escape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function source(id){var d=g.GL_CARD_DEFINITIONS||{};return(d.cards||[]).find(function(c){return c.card_id===id;})||null;}
  function rankRoman(v){var m=String(v||'').match(/(?:Rank\s*)?(I{1,3}|[123])\b/i);return m?({1:'I',2:'II',3:'III'}[m[1]]||m[1].toUpperCase()):'I';}
  // Translate OSA S0 canonical printed records to the v1.58 review view-model.
  // No card values are copied from Deck Builder/S1 data. Differences must be
  // recorded as OSA discrepancies, not silently patched in a read-only UI.
  function getCard(id){
    var c=source(id);if(!c)return null;
    var ident=c.identity||{},original=(c.printed||{}).rows||[];
    var rows=original.map(function(r,i){return {
      row_id:r.row_id||String(i+1),label:r.label||'Effect',
      damage_text:String(r.damage!=null?r.damage:(r.damage_text||'')),
      effect_text:r.effect||r.effect_text||r.text||'',
      text:r.text||r.effect||r.effect_text||''};});
    if((c.family==='Item'||c.family==='Event')&&rows.length&&!rows.some(function(r){return r.text||r.effect_text;})){
      rows[0].effect_text=c.card_text||c.printed?.text||'';rows[0].text=rows[0].effect_text;
    }
    if(c.family==='Legacy'){
      var ab=rows.find(function(r){return /LEGACY_ABILITY/i.test(r.label);});
      var replace=rows.find(function(r){return /LEGACY_REPLACEMENT/i.test(r.label);});
      rows=ab?[{label:'Legacy Ability',text:ab.text,effect_text:ab.effect_text}]:rows;
    }
    // Designer-approved local front (pending synchronization into a later OSA):
    // Card Review must reflect the latest supplied print, not the older OSA
    // consumer's cached Item effect. This does not modify gameplay legality.
    var reviewedText=c.card_text||c.printed?.text||'';
    var reviewedClasses=((c.requirement||{}).legal_base_classes||[]);
    if(c.card_id==='S0-ITM-011'){
      reviewedText="This turn, attach this card to the Hero that used it. When that Hero's Skill card deals Physical damage, inflict Poison for 2 turns.";
      reviewedClasses=['Archer','Thief','Warrior'];
      rows=[{row_id:'1',label:'Item Effect',damage_text:'',effect_text:reviewedText,text:reviewedText}];
    }
    var roman=rankRoman(ident.rank||c.class_rank||c.rank_numeric);
    var rank=({I:1,II:2,III:3})[roman]||1;
    var cost=c.cost_display||((c.cost||{}).mana!=null?String(c.cost.mana)+' Mana':'No Mana cost');
    var ult=((c.requirement||{}).ultimate||{});
    var code=c.class_group||c.card_id.split('-')[1]||'';
    var baseClass={WAR:'Warrior',MAG:'Mage',ARC:'Archer',CLE:'Cleric',THF:'Thief'}[code]||'';
    return {id:c.card_id,name:c.name,family:c.family==='Legacy'?'LegacyModeDefinition':c.family,
      classification:c.classification||c.action_category||'',classGroup:ident.class||c.display_class||c.class_family||baseClass||'',
      rank:rank,rankNumeric:rank,race:c.race||ident.race||'',hp:c.hp,
      image:'card-art/'+c.card_id+'.webp',cost:cost,text:reviewedText,rows:rows,
      ultimate:{isUltimate:!!c.is_ultimate,owner:c.card_id==='S0-CLE-031'
        ?'Only Melody can use this card or tribute it with a White Mana Shard for EXP.'
        :(ult.owner||'')},
      requiredBaseClasses:reviewedClasses,
      rules:c.family==='Legacy'?((replace||{}).text||''):(c.printed?.rules||''),sourceCardId:c.card_id};
  }
  function documentHtml(c,progressionIds){
    var base=escape(new URL('./',g.document.baseURI).href);
    var styles=files.map(function(f){return '<link rel="stylesheet" href="assets/review-db158/css/'+f+'">';}).join('');
    var lineage=Array.isArray(progressionIds)&&c.family==='Hero'?progressionIds.map(function(id){return getCard(id);}).filter(Boolean):[];
    var serializedLineage=JSON.stringify(lineage.map(function(x){return {id:x.id,name:x.name,image:x.image};})).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
    var serialized=JSON.stringify(c).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="'+base+'">'+styles+
      '<style>html,body{color-scheme:light!important;padding:0!important;margin:0!important;width:100%;height:auto!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;background:transparent!important;background-image:none!important;color:#f4f4f4;font-family:"Noto Sans",Arial,sans-serif;--gold:#e6c474}body::before{display:none!important}#cardReviewDialog{box-sizing:border-box;position:static!important;display:flex!important;align-items:center!important;justify-content:center!important;inset:auto!important;transform:none!important;padding:0!important;margin:0!important;background:transparent!important;border:0!important;box-shadow:none!important;width:100%!important;height:auto!important;min-height:0!important;max-width:none!important;max-height:none!important;overflow:visible!important}#cardReviewDialog::backdrop{display:none!important}#cardReviewDialog .review-card,#cardReviewDialog[data-review-kind="hero"] .review-card{box-sizing:border-box!important;width:100%!important;max-width:100%!important;border:0!important;border-radius:14px!important;outline:none!important;box-shadow:none!important;margin:0!important;min-height:0!important;height:auto!important;max-height:none!important;background:#242630!important}#cardReviewDialog .review-layout,#cardReviewDialog[data-review-kind="hero"] .review-layout{grid-template-columns:var(--gl-review-art-w) minmax(0,1fr)!important;gap:clamp(12px,2vw,26px)!important;align-items:start!important;flex:0 0 auto!important;height:auto!important;max-height:none!important;overflow:visible!important}#cardReviewDialog .review-art,#cardReviewDialog[data-review-kind="hero"] .review-art{box-sizing:border-box!important;width:var(--gl-review-art-w)!important;height:calc(var(--gl-review-art-w)*1.4)!important;max-width:100%!important;max-height:none!important;object-fit:contain!important}#cardReviewDialog{--gl-review-art-w:clamp(175px,22vw,310px)}#reviewProgression[hidden]{display:none!important}html{height:100%!important;min-height:100%!important;overflow-y:auto!important}body{height:auto!important;min-height:100%!important}/* RC22: allow wheel/trackpad scrolling through the Deck Builder review internals, not just programmatic scrolling of the iframe document. */#cardReviewDialog .review-card,#cardReviewDialog .review-rows{overflow:visible!important;overscroll-behavior:auto!important}#cardReviewDialog .review-layout,#cardReviewDialog .review-detail-column{overscroll-behavior:auto!important}@media(max-width:760px){#cardReviewDialog{--gl-review-art-w:clamp(125px,34vw,210px);align-items:center!important}.review-card{max-width:100vw!important}.review-layout{grid-template-columns:minmax(0,1fr)!important;overflow:auto!important}.review-art-column{justify-content:center!important}}</style>'+ 
      '</head><body><div id="cardReviewDialog" class="app-dialog review-dialog"><div class="dialog-card review-card">'+
      '<div class="review-header"><div><span id="reviewEyebrow" class="dialog-eyebrow"></span><h2 id="reviewTitle"></h2></div><button id="reviewClose" class="dialog-close review-close" type="button" aria-label="Close">×</button></div>'+
      '<div class="review-layout"><div class="review-art-column"><img id="reviewArt" class="review-art" alt="Card review"></div><div class="review-detail-column"><div id="reviewStats" class="review-stats"></div><div id="reviewRows" class="review-rows"></div></div></div>'+
      '<div id="reviewProgression" class="review-progression" hidden><span>HERO LINEAGES</span><div id="reviewProgressionCards" class="review-progression-cards"></div></div></div></div>'+
      '<script src="assets/review-db158/js/s0-review-clarity.js"><\/script><script src="assets/review-db158/js/review-renderer-v158.js"><\/script>'+
      '<script>(function(){const card='+serialized+';const lineage='+serializedLineage+';window.GL_S0_REVIEW_RENDER(card);if(lineage.length){const panel=document.getElementById("reviewProgression"),host=document.getElementById("reviewProgressionCards");panel.hidden=false;lineage.forEach(function(x){const b=document.createElement("button");b.type="button";b.className="review-progression-card"+(x.id===card.id?" active":"");b.dataset.reviewRankId=x.id;b.setAttribute("aria-label","Review "+x.name);const img=document.createElement("img");img.src=x.image;img.alt=x.name;img.draggable=false;b.appendChild(img);b.addEventListener("click",function(){parent.postMessage({kind:"GL_S0_REVIEW_RANK",cardId:x.id},"*")});host.appendChild(b);});}function close(){parent.postMessage({kind:"GL_S0_REVIEW_CLOSE"},"*")}document.getElementById("reviewClose").addEventListener("click",close);document.addEventListener("keydown",function(e){if(e.key==="Escape"){e.preventDefault();close();}});function reportHeight(){var card=document.querySelector("#cardReviewDialog .review-card");if(!card)return;parent.postMessage({kind:"GL_S0_REVIEW_FIT",height:Math.ceil(card.getBoundingClientRect().bottom)},"*");}requestAnimationFrame(reportHeight);setTimeout(reportHeight,80);setTimeout(reportHeight,350);document.fonts.ready.then(reportHeight);var img=document.getElementById("reviewArt");if(img&&!img.complete)img.addEventListener("load",reportHeight,{once:true});if(window.ResizeObserver)new ResizeObserver(reportHeight).observe(document.querySelector(".review-card"));window.addEventListener("resize",reportHeight);})();<\/script></body></html>';
  }
  function mount(el,cardId,progressionIds){var c=getCard(cardId);if(!el||!c)return false;el.innerHTML='';var frame=g.document.createElement('iframe');frame.className='gl-db158-review-frame';frame.style.colorScheme='light';frame.setAttribute('title',c.name+' — Deck Builder v1.58 card review');frame.setAttribute('loading','eager');frame.setAttribute('scrolling',Array.isArray(progressionIds)&&progressionIds.length?'auto':'no');frame.setAttribute('aria-label',c.name+' card review');frame.srcdoc=documentHtml(c,progressionIds);el.appendChild(frame);return true;}
  g.GL_DB158_REVIEW={mount:mount,getCard:getCard,documentHtml:documentHtml,source:'OSA Season 0 DEV45',view:'Deck Builder v1.58',heroFooter:'lobby-only'};
})(window);
