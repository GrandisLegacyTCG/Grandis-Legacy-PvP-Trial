/* Exact Deck Builder v1.66 Review renderer logic, adapted to the isolated iframe. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function reviewEyebrow(card){
  if(card.family==='Hero')return 'HERO NAME';
  if(card.family==='Skill')return 'SKILL NAME';
  if(card.family==='Event')return 'EVENT NAME';
  if(card.family==='Item')return 'ITEM NAME';
  if(card.family==='LegacyModeDefinition')return 'LEGACY NAME';
  return 'CARD NAME';
}
function reviewType(card){return card.family==='LegacyModeDefinition'?'Legacy Card':card.family==='Skill'?card.classification:card.family}
function reviewCost(card){return card.cost&&card.cost!=='No Mana cost'?card.cost:'—'}
function reviewManaValue(card){
  const cost=String(card?.cost||'').trim();
  if(!cost||cost==='No Mana cost')return '-';
  if(cost.includes(':'))return cost.replace(/\s*[·•]\s*/g,' • ');
  const simple=cost.match(/^(\d+)\s*Mana$/i);
  return simple?simple[1]:cost;
}
function compactManaCost(card){
  const matches=String(card?.cost||'').match(/(\d+)\s*Mana/gi)||[];
  const values=matches.map(value=>Number(value.match(/\d+/)?.[0])).filter(Number.isFinite);
  return values.length?`${Math.min(...values)} Mana Cost`:'';
}
function labeledRowName(label='',prefix=''){
  const clean=String(label).replace(new RegExp(`^${prefix}\\s*[—-]?\\s*`,'i'),'').trim();
  return clean||prefix;
}
function romanRank(value){return ({1:'I',2:'II',3:'III'})[Number(value||1)]||String(value||'-')}
function rankUpBonusText(rank){
  const value=Number(rank||1);
  if(value===2)return 'After Rank Up, return 2 EXP cards to your hand and gain +1 Mana Regen.';
  if(value===3)return 'After Rank Up, return 3 EXP cards to your hand and gain +1 Mana Regen.';
  return '';
}
function heroExpValue(rank){return ({1:'—',2:'300',3:'700'})[Number(rank||1)]||'—'}
function rowClassRank(label=''){
  const match=String(label).match(/^(.+?)\s*\((Rank\s+[IVX]+)\)\s*$/i);
  return match?{className:match[1].trim(),rank:match[2].replace(/^rank/i,'Rank')}:{className:String(label).replace(/\s*[—-].*$/,'').trim(),rank:'-'};
}
function metricDamageType(card,row={},label=''){
  if(!['DAMAGE','BLOCK'].includes(label))return '';
  const primary=label==='DAMAGE'
    ? String(row.damage_text||row.text||card.classification||'')
    : String(row.effect_text||row.text||row.damage_text||'');
  const hasPhysical=/\bPhysical\b/i.test(primary);
  const hasMagical=/\bMagical\b/i.test(primary);
  if(hasPhysical&&hasMagical)return 'Physical / Magical';
  if(hasPhysical)return 'Physical';
  if(hasMagical)return 'Magical';
  return '';
}
function effectMetric(card,row={}){
  // The R3.4 artwork's right-hand numeric field is represented by damage_text.
  // A bare numeric field is NOT interchangeable with numbers embedded inside effect prose.
  const number=String(row.damage_text||'').trim();
  if(!/^[+\-]?\d+$/.test(number))return null;
  const value=String(Math.abs(Number(number)));
  const kind=String(card.classification||'');
  const source=[row.effect_text,row.text,card.text].filter(Boolean).join(' ');
  let label='';
  if(/^(?:Physical Attack|Magical Attack|Area Attack|Casting Attack)$/i.test(kind)){
   if(/^Physical Attack$/i.test(kind))label='PHYSICAL DAMAGE';
   else if(/^Magical Attack$/i.test(kind))label='MAGICAL DAMAGE';
   else if(/\bPhysical\s+damage\b/i.test(source))label='PHYSICAL DAMAGE';
   else if(/\bMagical\s+damage\b/i.test(source))label='MAGICAL DAMAGE';
   else if(/\bPhysical\b/i.test(source)&&!/\bMagical\b/i.test(source))label='PHYSICAL DAMAGE';
   else if(/\bMagical\b/i.test(source)&&!/\bPhysical\b/i.test(source))label='MAGICAL DAMAGE';
   // Do not invent a damage type for ambiguous Area/Casting cards.
  }else if(/^Defense$/i.test(kind)&&/\bBLOCK\b/i.test(source))label='DAMAGE REDUCTION';
  else if(/^Support$/i.test(kind)&&/\bHEAL\b/i.test(source))label='HEALING DONE';
  if(!label)return null;
  return {label,value};
}
function skillEffectText(row={},metric=null,card=null){
  const effect=String(row.effect_text||row.text||'').trim();
  const rawValue=String(row.damage_text||'').trim();
  const isAttack=/^(?:Physical|Magical|Area|Casting) Attack$/i.test(String(card?.classification||''));
  const type=metric&&/^(?:PHYSICAL|MAGICAL) DAMAGE$/.test(metric.label)
    ?(metric.label==='PHYSICAL DAMAGE'?'Physical':'Magical'):'';
  const damageText=(value,damageType=type)=>`Deal ${value} ${damageType} damage.`;

  // The shared CONDITION box on some attacks contains a prerequisite sentence
  // followed by the printed damage/multiplier sentence. Display the first in
  // CONDITION once, and the second under each Rank with its printed number.
  const printedCondition=String(card?.printedConditionText||'').trim();
  if(isAttack&&type&&/^\d+$/.test(rawValue)&&(!effect||/^[+-]?\d+$/.test(effect))&&printedCondition){
    const match=printedCondition.match(/^([\s\S]*?[.!?])\s+((?:Deal|Multiply)\b[\s\S]*)$/i);
    if(match){
      const mechanic=match[2].trim();
      if(/^Deal\s+(?:Area\s+)?(?:Physical|Magical)\s+damage\b/i.test(mechanic)){
        return mechanic.replace(/^Deal\s+((?:Area\s+)?(?:Physical|Magical))\s+damage\b/i,
          (_m,t)=>`Deal ${metric.value} ${t} damage`);
      }
      if(/^Multiply\b/i.test(mechanic))return `${damageText(metric.value)} ${mechanic}`;
    }
  }

  if(!metric)return effect||String(row.damage_text||'—').trim()||'—';
  if(isAttack&&type){
    const detail=/^[+-]?\d+$/.test(effect)?'':effect;
    // Add the numeric print to an existing typed damage sentence in-place.
    // Preserve the surrounding original text and damage mechanism verbatim.
    const typed=/\b(Deal(?:s)?\s+)(\d+\s+)?((?:Area\s+)?(?:Physical|Magical))(\s+damage\b)/i;
    if(typed.test(detail))return detail.replace(typed,(_m,verb,oldNumber,kind,suffix)=>
      `${verb}${oldNumber||metric.value+' '}${kind}${suffix}`);
    const prelude=detail.match(/^((?:(?:MELEE|RANGE|PIERCING|SURE HIT)\s+)+)/)?.[1]||'';
    const remaining=detail.slice(prelude.length);
    return `${prelude}${damageText(metric.value)}${remaining?' '+remaining:''}`.trim();
  }
  let remaining=effect;
  if(/DAMAGE$/.test(metric.label)&&metric.label!=='DAMAGE REDUCTION')
    remaining=remaining.replace(/^(?:Deal|Inflict)\s+[+-]?\d+[^.]*?damage\.\s*/i,'').trim();
  else if(metric.label==='DAMAGE REDUCTION')
    remaining=remaining.replace(/^Block\s+[+-]?\d+[^.]*?damage[^.]*\.\s*/i,'').trim();
  else if(metric.label==='HEALING DONE')
    remaining=remaining.replace(/^(?:Heal|Restore)[^.]*?[+-]?\d+[^.]*\.\s*/i,'').trim();
  return remaining||'—';
}
function itemClassText(card){if(card.printedClassRequirement)return card.printedClassRequirement;
  const classes=Array.isArray(card.requiredBaseClasses)?card.requiredBaseClasses.filter(Boolean):[];
  return classes.length?classes.join(' • '):'All Classes';
}
function heroReviewHtml(card){
  const rows=card.rows||[];
  const racialRow=rows.find(row=>/^Racial Trait/i.test(row.label||''));
  const dualRow=rows.find(row=>/^Dual Class/i.test(row.label||''));
  const abilityRow=rows.find(row=>/^Class Ability/i.test(row.label||''));
  const racialName=labeledRowName(racialRow?.label||'Racial Trait','Racial Trait');
  const abilityName=abilityRow?labeledRowName(abilityRow.label,'Class Ability'):'';
  const rank=Number(card.rank||card.rankNumeric||1);
  $('reviewStats').innerHTML=`<div class="review-summary hero-summary">
    <div class="review-summary-item"><span>CARD TYPE</span><strong>HERO</strong></div>
    <div class="review-summary-item"><span>HP</span><strong>${esc(card.hp??'—')}</strong></div>
    <div class="review-summary-item"><span>REQUIRED EXP</span><strong>${esc(heroExpValue(rank))}</strong></div>
  </div>`;
  const detailBlocks=[];
  // Render the Dual Class note above Racial Traits, independently of Class.
  // Other Hero Review sections keep their existing layout and typography.
  if(dualRow)detailBlocks.push(`<div class="review-hero-dual-section"><span>DUAL CLASS</span><p>${esc(dualRow.text||'—')}</p></div>`);
  detailBlocks.push(`<div class="review-hero-block hero-racial-section">
    <div class="review-hero-group"><span>RACE</span><strong>${esc(card.race||'—')}</strong></div>
    <div class="review-hero-group"><span>RACIAL TRAITS</span><strong>${esc(racialName)}</strong><p>${esc(racialRow?.text||card.text||'—')}</p>${card.printedRacialDamageReduction?`<div class="review-hero-numeric"><span>DAMAGE REDUCTION</span><strong>${esc(card.printedRacialDamageReduction)}</strong></div>`:''}</div>
  </div>`);
  detailBlocks.push(`<div class="review-hero-block hero-class-section">
    <div class="review-hero-class-summary">
      <div class="review-hero-group"><span>CLASS</span><strong>${esc(card.classGroup||'—')}</strong></div>
      <div class="review-hero-group"><span>RANK</span><strong>Rank ${esc(romanRank(rank))}</strong></div>
    </div>
    ${abilityRow?`<div class="review-hero-group"><span>CLASS ABILITY</span><strong>${esc(abilityName)}</strong><p>${esc(abilityRow.text||'—')}</p></div>`:''}
  </div>`);
  const bonus=rankUpBonusText(rank);
  if(bonus)detailBlocks.push(`<div class="review-generic-row rank-up-review"><span>BONUS</span><p>${esc(bonus)}</p></div>`);
  $('reviewRows').innerHTML=detailBlocks.join('');
}
function standardReviewHtml(card){
  // Presentation-only metadata; preserve printed card type/subtype and all gameplay data.
  const stats=[];
  if(card.family==='Skill')stats.push(
    ['CARD TYPE',card.ultimate?.isUltimate?'ULTIMATE':'SKILL'],
    ['SUBTYPE',reviewType(card)],
    ['MANA COST',reviewManaValue(card)],
    ['EXP TRIBUTE',card.ultimate?.isUltimate?'200 EXP':'100 EXP']
  );
  else if(card.family==='LegacyModeDefinition')stats.push(['CARD TYPE','LEGACY'],['CLASS',card.classGroup||'—']);
  else stats.push(['CARD TYPE',String(card.family||'CARD').toUpperCase()],['SUBTYPE',card.family==='Event'?(card.classification==='Normal Event'?'Regular':card.classification==='Special Event'?'Special':card.classification||reviewType(card)):card.classification||reviewType(card)],['MANA COST',reviewCost(card)]);
  $('reviewStats').innerHTML=`<div class="review-summary ${stats.length===4?'four-column-summary':''}">
    ${stats.map(([label,value])=>`<div class="review-summary-item"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
  </div>`;
  const rows=card.rows?.length?card.rows:[{label:'Effect',text:card.text}];
  if(card.family==='Skill'){
    const isUltimate=Boolean(card.ultimate?.isUltimate);
    const effectRows=rows.map((row,index)=>{
      const parsed=rowClassRank(row.label);
      const metric=effectMetric(card,row);
      const rankText=isUltimate&&/Rank\s+III/i.test(parsed.rank)&&index===rows.length-1?`Ultimate ${parsed.rank}`:parsed.rank;
      const effectText=skillEffectText(row,metric,card);
      const rankClass=isUltimate&&/^Ultimate\s+Rank\s+III$/i.test(rankText)?' class="ultimate-rank"':'';
      if(metric){
        return `<div class="review-effect-row has-metric"><div class="review-effect-class"><span>CLASS</span><strong>${esc(parsed.className||card.classGroup||'—')}</strong></div><div class="review-effect-rank"><span>RANK</span><strong${rankClass}>${esc(rankText)}</strong></div><div class="review-effect-metric"><span>${esc(metric.label)}</span><strong>${esc(metric.value)}</strong>${metric.damageType?`<small class="review-metric-type">${esc(metric.damageType)}</small>`:''}</div>${effectText?`<div class="review-effect-info"><span>SKILL EFFECT</span><p>${esc(effectText)}</p></div>`:''}</div>`;
      }
      return `<div class="review-effect-row no-metric"><div class="review-effect-class"><span>CLASS</span><strong>${esc(parsed.className||card.classGroup||'—')}</strong></div><div class="review-effect-rank"><span>RANK</span><strong${rankClass}>${esc(rankText)}</strong></div><div class="review-effect-info full-span"><span>SKILL EFFECT</span><p>${esc(effectText)}</p></div></div>`;
    }).join('');
    const rules=isUltimate&&card.ultimate?.owner?`<div class="review-ultimate-rules"><span>ULTIMATE RULES</span><p>${esc(/\bcan use this card\b/i.test(String(card.ultimate.owner))?card.ultimate.owner:`Only ${card.ultimate.owner} can use this card or Tribute it for EXP.`)}</p></div>`:'';
    $('reviewRows').innerHTML=effectRows+rules;
  }else if(card.family==='Item'){
    const effect=rows.map(row=>row.effect_text||row.text||row.damage_text||'').filter(Boolean).join(' ');
    $('reviewRows').innerHTML=`<div class="review-effect-row item-effect-row no-metric"><div><span>CLASS</span><strong>${esc(itemClassText(card))}</strong></div><div><span>RANK</span><strong>All Ranks</strong></div><div class="review-effect-info full-span"><span>ITEM EFFECT</span><p>${esc(effect||'—')}</p></div></div>`;
  }else if(card.family==='Event'){
    const effect=rows.map(row=>row.effect_text||row.text||row.damage_text||'').filter(Boolean).join(' ');
    $('reviewRows').innerHTML=`<div class="review-generic-row review-large-effect"><span>EVENT EFFECT</span><p>${esc(effect||'—')}</p></div>`;
  }else if(card.family==='LegacyModeDefinition'){
    const effect=rows.map(row=>row.effect_text||row.text||row.damage_text||'').filter(Boolean).join(' ');
    $('reviewRows').innerHTML=`<div class="review-generic-row"><span>LEGACY ABILITY</span><p>${esc(effect||'—')}</p></div>${card.rules?`<div class="review-generic-row legacy-rules-row"><span>RULES</span><p>${esc(card.rules)}</p></div>`:''}`;
  }else{
    $('reviewRows').innerHTML=rows.map(row=>`<div class="review-generic-row"><span>${esc(String(row.label||'CARD EFFECT').toUpperCase())}</span><p>${esc(row.text||row.effect_text||row.damage_text||'—')}</p></div>`).join('');
  }
}

window.GL_S0_REVIEW_RENDER=function(card){
 if(!card)return;
 document.getElementById('cardReviewDialog').dataset.reviewKind=card.family==='Hero'?'hero':card.family==='Skill'?'skill':card.family==='Item'?'item':card.family==='Event'?'event':card.family==='LegacyModeDefinition'?'legacy':'standard';
 $('reviewTitle').textContent=card.name;
 $('reviewEyebrow').textContent=reviewEyebrow(card);
 $('reviewArt').src=card.image;$('reviewArt').alt=card.name;
 if(card.family==='Hero'){heroReviewHtml(card);window.GL_S0_REVIEW_CLARITY?.enhanceHero(card,$('reviewRows'))}
 else {standardReviewHtml(card);window.GL_S0_REVIEW_CLARITY?.enhance(card,$('reviewRows'))}
};
})();
