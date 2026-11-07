/* Grandis Legacy Season 0 — Card Review: official Player Rulebook v2.9 EN (2026-11-01), pp.13–14.
   The card-artwork RULES footer is transcribed from the Season 0 R3.4 printed artworks.
   MANA BURN / MANA STEAL wording is intentionally unchanged, per designer instruction.
   MANA COST +1/+2 are printed card-specific labels, not Rulebook keywords.
   Display only; no changes to deck legality, card effects, gameplay or OSA. */
(function(root){'use strict';
 const EXPLANATIONS=Object.freeze({
  'MELEE':'This Attack can only target an opposing active Hero in the directly opposite position.',
  'RANGE':'This Attack can target Heroes outside its normal Area of Attack. Attacking outside that area counts as a Range Attack.',
  'PIERCING':'This Attack cannot be Blocked.',
  'SURE HIT':'This Attack cannot be Dodged.',
  'BLOCK':'Reduces incoming Attack damage as stated on the card.',
  'DODGE':'The Hero avoids the Attack.',
  'BUFF':"Using this Skill or Event does not change the Hero's Ready or Exhausted state.",
  'CONDITION':'The card can only be used when the condition stated on the card is met.',
  'REACTION':'May be used as a Response outside the Battle Phase when its stated trigger occurs.',
  'HEAL':'Restores HP as stated on the card.',
  'REVIVE':'Return the Legacy Card to the Legacy Deck. The Hero regains HP as stated on the Revive Card.',
  'INVINCIBLE':'The Hero cannot take damage from an opponent or receive new Status from an opponent. Existing Status remains active.',
  'ALL OPPONENTS':'Affects all opposing active Heroes, ignoring normal Area of Attack.',
  'REFLECT':'When this Hero is attacked, deal damage to the attacker as stated on the card.',
  'MANA BURN':"Remove the stated number of Mana cards from your opponent's Mana Pool.",
  'MANA STEAL':"Remove the stated number of Mana cards from your opponent's Mana Pool, then take the same number of Mana cards from your Mana Deck into your Mana Pool.",
  'MANA COST +1':'The required Mana is 1 higher than the printed Mana Cost.',
  'MANA COST +2':'The required Mana is 2 higher than the printed Mana Cost.'
 });
 // These 18 RULES bands are present on the printed Main Deck artwork,
 // separate from card effects and from the Legacy artwork RULES already in data-s0.
 // Explicitly transcribed, not synthesized from class names or old Shard terminology.
 const PRINTED_FOOTER_RULES=Object.freeze({
  'S0-ARC-018':'Only Korvak can use this card or tribute it with a Green Mana Shard for EXP.',
  'S0-ARC-019':'Only Sylvan can use this card or tribute it with a Green Mana Shard for EXP.',
  'S0-ARC-025':'Only Alden can use this card or tribute it with a Green Mana Shard for EXP.',
  'S0-CLE-018':'Only Elara can use this card or tribute it with a White Mana Shard for EXP.',
  'S0-CLE-019':'Only Thrain can use this card or tribute it with a White Mana Shard for EXP.',
  'S0-CLE-025':'Only Aurex can use this card or tribute it with a White Mana Shard for EXP.',
  'S0-MAG-018':'Only Vaelis can use this card or tribute it with a Blue Mana Shard for EXP.',
  'S0-MAG-019':'Only Aldric can use this card or tribute it with a Blue Mana Shard for EXP.',
  'S0-MAG-025':'Only Lucien can use this card or tribute it with a Blue Mana Shard for EXP.',
  'S0-THF-018':'Only Finnian can use this card or tribute it with a Yellow Mana Shard for EXP.',
  'S0-THF-019':'Only Akra can use this card or tribute it with a Yellow Mana Shard for EXP.',
  'S0-WAR-018':'Only Draxen can use this card or tribute it with a Red Mana Shard for EXP.',
  'S0-WAR-019':'Only Garrick can use this card or tribute it with a Red Mana Shard for EXP.',
  'S0-CLE-031':'Only Melody can use this card or tribute it with a White Mana Shard for EXP.',
  'S0-MAG-031':'Only Bromir can use this card or tribute it with a Blue Mana Shard for EXP.',
  'S0-EVT-001':'You can only have 1 of this card in your deck.',
  'S0-EVT-003':'You can only have 1 of this card in your deck.',
  'S0-EVT-008':'You can only have 1 of this card in your deck.'
 });
 const KEYS=Object.keys(EXPLANATIONS);
 // Player Rulebook v2.9 EN, p.14: verbatim status descriptions; no engine logic changes.
 const STATUSES=Object.freeze({
  'Bleed':'This Hero cannot receive Healing. Bleed does not deal damage.',
  'Burn':'This Hero takes 10 additional damage from Attacks that deal damage.',
  'Freeze':'This Hero cannot DODGE or swap positions.',
  'Poison':"This Hero takes 10 damage during its owner's End Phase.",
  'Sleep':'This Hero cannot use Skill or Event Cards, except Skills with DODGE. It wakes up when hit by another Attack.',
  'Stun':'This Hero cannot use Skill or Event Cards, activate Racial Traits, BLOCK, DODGE, or swap positions. It cannot initiate other active effects.'
 });
 const STATUS_COLORS=Object.freeze({Bleed:'#e46b6b',Burn:'#f6a24b',Freeze:'#79d7f6',Poison:'#a5d65a',Sleep:'#b895ee',Stun:'#f2d72e'});
 const STATUS_NAME_PATTERN=/\b(Bleed|Burn|Freeze|Poison|Sleep|Stun)\b/g;
 function statusTags(s){const t=String(s||'');return Object.keys(STATUSES).filter(k=>new RegExp('\\b'+k+'\\b','i').test(t));}
 function emphasizeStatus(rootNode){
  // DOM text nodes only, so keyword images, attributes, and user input never get changed.
  const walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode()){
   const t=walker.currentNode;if(!t.nodeValue || !/\b(Bleed|Burn|Freeze|Poison|Sleep|Stun)\b/i.test(t.nodeValue))continue;
   if(t.parentElement?.closest('.review-status-name,.review-keyword-description'))continue;nodes.push(t);
  }
  for(const textNode of nodes){
   const fragment=document.createDocumentFragment();const value=textNode.nodeValue;
   let last=0;for(const m of value.matchAll(/\b(Bleed|Burn|Freeze|Poison|Sleep|Stun)\b/gi)){
    if(m.index>last)fragment.append(document.createTextNode(value.slice(last,m.index)));
    const status=Object.keys(STATUSES).find(k=>k.toLowerCase()===m[0].toLowerCase());
    const n=node('strong','review-status-highlight',m[0]);n.style.color=STATUS_COLORS[status];fragment.append(n);last=m.index+m[0].length;
   }
   fragment.append(document.createTextNode(value.slice(last)));textNode.replaceWith(fragment);
  }
 }
 function renderStatuses(statusNames){
  if(!statusNames.length)return null;
  const panel=node('div','review-status-explanations');panel.setAttribute('aria-label','Status explanations');
  for(const status of statusNames){
   const line=node('p','review-status-line');
   const title=node('strong','review-status-name',status);title.style.color=STATUS_COLORS[status];
   line.append(title,document.createTextNode(' '+STATUSES[status]));panel.append(line);
  }
  return panel;
 }
 function has(s,key){return new RegExp('(^|[^A-Z])'+key.replace(/[+]/g,'\\+')+'(?![A-Z0-9])').test(String(s||''));}
 function tags(s){return KEYS.filter(k=>has(s,k));}
 // The card-level printed text is authoritative for how many CONDITION labels exist.
 // Row text is a fallback only (it may repeat the card-wide condition in every Rank).
 function conditionsIn(s){
  return [...String(s||'').matchAll(/\bCONDITION\s*:?\s*([^.!?]+[.!?])/gi)].map(m=>m[1].trim());
 }
 function conditionOf(s){return conditionsIn(s)[0]||'';}
 function stripCondition(s){return String(s||'').replace(/\bCONDITION\s*:?\s*[^.!?]+[.!?]\s*/gi,'').trim();}
 function node(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
 function keywordImg(k){
  const name=k.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const img=node('img','review-keyword-image');
  img.src=(root.GL_DECK_BUILDER_BASE||'')+'assets/keywords-review/'+name+'.png';
  img.alt=k;img.title=k;img.loading='lazy';
  return img;
 }
 function inlineKeywords(p){
  // Replace only printed uppercase Keyword tokens, not the ordinary rules description.
  const pattern=new RegExp('(^|[^A-Z0-9])('+KEYS.slice().sort((a,b)=>b.length-a.length).map(k=>k.replace(/[+]/g,'\\+')).join('|')+')(?![A-Z0-9])','g');
  const value=p.textContent||'';let from=0,match;
  const fragment=document.createDocumentFragment();
  while((match=pattern.exec(value))){
   const position=match.index+match[1].length;
   if(position>from)fragment.append(document.createTextNode(value.slice(from,position)));
   fragment.append(keywordImg(match[2]));from=position+match[2].length;
  }
  if(from===0)return;
  fragment.append(document.createTextNode(value.slice(from)));p.replaceChildren(fragment);
 }
 function printedConditions(card,rows){
  const cardConditions=conditionsIn(card.text);
  // Permafrost metadata repeats its single top-level printed CONDITION in
  // both Rank rows. Never mistake that storage duplication for two boxes
  // on the physical card. Distinct conditions remain separate.
  const stored=cardConditions.length?cardConditions:rows.flatMap(row=>conditionsIn(row.effect_text||row.text||''));
  return [...new Set(stored.map(value=>value.replace(/\s+/g,' ').trim()))];
 }
 function renderConditions(conditions){
  if(!conditions.length)return null;
  const panel=node('div','review-condition-panel');
  panel.setAttribute('aria-label','Card conditions');
  // Each line corresponds to a CONDITION printed on the physical card;
  // a shared condition must NOT be re-rendered for each rank's effect.
  for(const condition of conditions){
   const line=node('div','review-condition-line');
   const title=node('span','review-condition-label');title.append(keywordImg('CONDITION'));
   line.append(title,node('p','review-condition-text',condition));panel.append(line);
  }
  return panel;
 }
 function renderExplanation(keys){
  if(!keys.length)return null;
  const n=node('div','review-keyword-explanation');n.setAttribute('aria-label','Keyword explanations');
  for(const k of keys){
   const p=node('p','review-keyword-line');p.append(keywordImg(k),node('span','review-keyword-description',EXPLANATIONS[k]));n.append(p);
  }return n;
 }
 function enrichEffect(p,row,card){
  const printed=String(row?.effect_text||row?.text||card?.text||'');
  // Artwork-verified display override (Taunt). The stored R3.3 transcription
  // places both keyword tokens at the front, while the artwork has the second
  // token inline after the timing clause. Preserve all gameplay metadata.
  // For other cards, preserve the recorded effect order rather than guessing.
  if(card?.id==='S0-WAR-005'){
   p.textContent='BUFF Until the start of your 2nd turn, ALL OPPONENTS can only target this Hero for attacks. (During this time, they cannot use Area Attacks.)';
  }
  // Strip the printed condition only from the Effect; it is rendered once
  // per actual printed CONDITION in a separate panel above all Rank rows.
  p.textContent=stripCondition(p.textContent||'');
  const damage=String(row?.damage_text||'').trim();
  // Some printed Attack cards (Permafrost) contain only a Condition and
  // a numeric damage value per Rank. Do not leave their Effect empty after
  // moving the Condition into its independent panel.
  if(!p.textContent.trim() && /^\d+$/.test(damage) && /^(Physical|Magical) Attack$/i.test(String(card.classification||''))){
   p.textContent=`Deal ${damage} ${card.classification.split(' ')[0]} damage.`;
  }
  // REVIEW ONLY: numeric Area Attacks read "Deal 50 Area Magical damage.",
  // not "Deal Area 50 Magical damage." Preserve suffixes such as Stun/HEAL.
  if(/^\d+$/.test(damage)){
   const effect=p.textContent||'';
   if(/\bDeal\s+Area\s+(?:Physical|Magical)\s+damage\b/i.test(effect)){
    p.textContent=effect.replace(/\b(Deal)\s+Area\s+(Physical|Magical)(\s+damage)\b/i,
      (_,verb,type,suffix)=>`${verb} ${damage} Area ${type}${suffix}`);
   }else if(/\bDeal\s+(?:Physical|Magical)\s+damage\b/i.test(effect)){
    // Retain the v1.44 spelling and casing of all non-Area Attack effects.
    p.textContent=effect.replace(/\b(Deal\s+)(Physical|Magical)(\s+damage)\b/i,
      (_,prefix,type,suffix)=>prefix+damage+' '+type+suffix);
   }
  }
  inlineKeywords(p);
  return tags(printed);
 }
 function enhanceHero(card,rootNode){
  if(card?.family!=='Hero'||!rootNode)return;
  const allKeywords=new Set();
  // The Hero source transcription says "Range Attack" in text; the four
  // Marksman / Grand Ranger artworks print a RANGE badge (no extra "Attack").
  // This is a review-only presentation fix, not a card-data/rules mutation.
  for(const p of rootNode.querySelectorAll('.review-hero-block p,.review-hero-dual-section p,.rank-up-review p')){
   if(p.closest('.hero-class-section') && /\bRange Attack\b/.test(p.textContent||'')){
    p.textContent=p.textContent.replace(/\bRange Attack\b/g,'RANGE');
   }
   for(const keyword of tags(p.textContent||''))allKeywords.add(keyword);
   inlineKeywords(p);
  }
  if(allKeywords.size)rootNode.append(renderExplanation([...allKeywords]));
 }
 function syncPrintedFooterRules(card,rootNode){
  const rule=PRINTED_FOOTER_RULES[card?.id];
  if(!rule)return;
  if(card.family==='Skill'&&card.ultimate?.isUltimate){
   let panel=rootNode.querySelector('.review-ultimate-rules');
   if(!panel){panel=node('div','review-ultimate-rules');panel.append(node('span','', 'ULTIMATE RULES'),node('p'));rootNode.append(panel);}
   panel.querySelector('p').textContent=rule;
  }else if(card.family==='Event'){
   let panel=rootNode.querySelector('.review-card-printed-rules');
   if(!panel){panel=node('div','review-generic-row review-card-printed-rules');panel.append(node('span','', 'RULES'),node('p'));rootNode.append(panel);}
   panel.querySelector('p').textContent=rule;
  }
 }
 function enhance(card,rootNode){
  if(!card||!rootNode||card.family==='Hero'||card.family==='LegacyModeDefinition')return;
  const rows=Array.isArray(card.rows)&&card.rows.length?card.rows:[{effect_text:card.text||''}];
  const originalChunks=[...rootNode.children];
  const conditions=printedConditions(card,rows);
  const allKeywords=new Set(conditions.length?['CONDITION']:[]);
  let effectIndex=0;
  for(const el of originalChunks){
   if(el.classList.contains('review-ultimate-rules'))continue;
   const p=el.querySelector('.review-effect-info p')||el.querySelector('p');if(!p)continue;
   const row=card.family==='Skill'?rows[Math.min(effectIndex,rows.length-1)]:{effect_text:rows.map(x=>x.effect_text||x.text||'').join(' ')};
   effectIndex+=1;
   for(const keyword of enrichEffect(p,row,card))allKeywords.add(keyword);
  }
  // Replace stale Ultimate footer and add the RULES line of Special Events.
  // Do this after iterating effect rows so it never gets interpreted as an Effect.
  syncPrintedFooterRules(card,rootNode);
  const conditionPanel=renderConditions(conditions);
  if(conditionPanel){
   // A shared, card-level panel immediately before the first Class/Rank + Effect card.
   rootNode.prepend(conditionPanel);
  }
  for(const keyword of tags(card.text||''))allKeywords.add(keyword);
  // Printed effect, condition, and card text can each introduce a Status.
  // Explain each unique Status once, directly beneath keyword descriptions.
  const statusNames=new Set();
  for(const part of [card.text||'',...rows.flatMap(row=>[row.text||'',row.effect_text||''])]){
   for(const status of statusTags(part))statusNames.add(status);
  }
  for(const p of rootNode.querySelectorAll('.review-effect-info p,.review-generic-row p,.review-condition-text'))emphasizeStatus(p);
  const explanation=renderExplanation([...allKeywords]);
  if(explanation)rootNode.append(explanation); // After Ultimate Rules and all effect blocks.
  const statuses=renderStatuses([...statusNames]);
  if(statuses)rootNode.append(statuses);
 }
 root.GL_S0_REVIEW_CLARITY={EXPLANATIONS,STATUSES,STATUS_COLORS,PRINTED_FOOTER_RULES,KEYS,tags,conditionOf,stripCondition,enhance,enhanceHero};
})(window);
