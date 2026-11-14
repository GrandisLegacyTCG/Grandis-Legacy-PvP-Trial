/* Historical RC9 Card Played tests only. NOT loaded by the PvP browser.
   PvP RC40 P3.1 uses the VS AI source renderer exclusively. */
function pvpPlayedHeroName(e,role){
  const direct=role==='source'?e.source_hero_card_id:
    role==='defended'?e.defended_hero_card_id:e.target_hero_card_id;
  if(direct&&cv(direct)?.name)return cv(direct).name;
  const side=role==='source'?e.source_side:role==='defended'?e.source_side:e.target_side;
  const lane=role==='source'?e.source_lane:role==='defended'?e.source_lane:e.target_lane;
  const snapshot=st();
  const hero=snapshot&&side&&lane?sideHeroes(snapshot,side)?.[lane]:null;
  // Only use an unambiguous public Hero identity; never print "AI LEFT" or
  // use a card's current position as a precise historical target if absent.
  if(hero&&cv(heroImageId(hero))?.name)return cv(heroImageId(hero)).name;
  return lane?lane.charAt(0)+lane.slice(1).toLowerCase()+' position':'';
}
function pvpPlayedActionName(e){
  const label=String(e.label||'').toUpperCase(),subtype=String(e.attack_type||cv(e.card_id)?.subtype||'');
  if(label==='TRIBUTE')return 'Tribute';
  // Use the server's actual Attack subtype, not artwork text/damage element.
  if(label==='ATK')return /casting attack/i.test(subtype)?'Casting Attack':
    /area attack/i.test(subtype)?'Area Attack':
    /magical attack/i.test(subtype)?'Magical Attack':
    /physical attack/i.test(subtype)?'Physical Attack':'Attack';
  return ({DEF:'Defense',REACTION:'Reaction',ITEM:'Item',EVENT:'Event',
    CAST:'Casting',SUPPORT:'Support',SUP:'Support',TACTICAL:'Tactical',
    ABILITY:'Class Ability',LEGACY:'Legacy Ability'}[label]||
    label.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,ch=>ch.toUpperCase()));
}
// RC9 S2: structured, server-committed per-Hero damage is the only source of
// Card Played damage math (VS AI Part5 duplicate-result fix). Do not add the
// same total from raw result_lines after drawing these rows. Keep Burn as a
// contribution, never sum it into actual HP damage a second time.
function pvpPlayedDamageResults(e){
  const entries=(Array.isArray(e.damage_by_hero)&&e.damage_by_hero.length)?e.damage_by_hero:
    e.damage_summary?[{name:'Target Hero',side:e.target_side||'',lane:e.target_lane||'',summary:e.damage_summary}]:[];
  const groups=new Map();
  for(const h of entries){
    const ds=h?.summary||{};
    if(!Object.hasOwn(ds,'actual_hp_damage'))continue;
    const name=String(h?.name||'Target Hero'),key=(h?.side||'')+'|'+(h?.lane||'')+'|'+name;
    const row=groups.get(key)||{name,hits:0,damage:0,base:0,modified:0,
      prevention:0,burn:0,followUp:0,hpBefore:null,hpAfter:null,
      hasBase:false,hasModified:false};
    const safe=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
    row.hits++;
    row.damage+=safe(ds.actual_hp_damage);
    if(Object.hasOwn(ds,'base_damage')){row.hasBase=true;row.base+=safe(ds.base_damage);}
    if(Object.hasOwn(ds,'damage_after_modifiers')){row.hasModified=true;row.modified+=safe(ds.damage_after_modifiers);}
    row.prevention+=safe(ds.response_block)+safe(ds.passive_reduction)+safe(ds.active_reduction);
    row.burn+=safe(ds.burn_damage);
    row.followUp+=safe(ds.follow_up_damage);
    if(row.hpBefore===null&&Object.hasOwn(ds,'target_hp_before'))row.hpBefore=Number(ds.target_hp_before);
    if(Object.hasOwn(ds,'target_hp_after'))row.hpAfter=Number(ds.target_hp_after);
    groups.set(key,row);
  }
  if(!groups.size)return [];
  const many=groups.size>1,rows=[];
  const damageType=/magical/i.test(e.damage_type||'')?'Magical':
    /physical/i.test(e.damage_type||'')?'Physical':'HP';
  const suffix=damageType==='HP'?' HP':' '+damageType+' Damage';
  const variable=new Set(['S0-ARC-010','S0-MAG-027','S0-ARC-030','S0-ARC-025','S0-MAG-025']);
  for(const x of groups.values()){
    const prefix=many?x.name+' — ':'';
    if(x.hasBase&&x.hasModified&&x.base>0&&x.base!==x.modified&&!variable.has(e.card_id))
      rows.push({title:prefix+'Damage',value:x.base+suffix+' → '+x.modified+suffix});
    if(x.prevention>0)rows.push({title:prefix+'Damage Prevention',value:x.prevention+' Damage'});
    if(x.burn>0)rows.push({title:prefix+'Burn Added',value:'+'+x.burn+' Damage'});
    if(x.followUp>0)rows.push({title:prefix+'Follow-up Damage',value:x.followUp+' Damage'});
    rows.push({title:prefix+'Damage Dealt',value:x.damage+suffix+(x.hits>1?' ('+x.hits+' hits)':'')});
    if(x.hpBefore!==null&&x.hpAfter!==null&&Number.isFinite(x.hpBefore)&&Number.isFinite(x.hpAfter))
      rows.push({title:prefix+'HP',value:x.hpBefore+' → '+x.hpAfter});
  }
  return rows;
}
function pvpPlayedEffectRows(e){
  const rows=[];
  for(const result of e.effect_results||[]){
    if(result.kind==='MANA_REMOVAL'){
      const title=e.mana_result?.mode==='STEAL'?'Mana Steal':'Mana Burn';
      const count=Math.max(0,Math.trunc(Number(result.count)||0));
      rows.push({title,value:'Removed '+(describeResolvedManaShards(result.removed_shards)||
        count+' Mana Shard'+(count===1?'':'s'))+'.'});
    }else if(result.kind==='DISCARD'){
      const source={HAND:'Hand',MAIN_DECK:'Main Deck',FIELD:'Field',EXP:'Hero EXP',UNKNOWN:'Unknown origin'}[result.origin]||'Unknown origin';
      const names=(result.card_ids||[]).map(id=>cv(id)?.name||id);
      const hero=result.origin==='EXP'&&result.target_hero_card_id?(cv(result.target_hero_card_id)?.name||result.target_hero_card_id):'';
      rows.push({title:'Cards Discarded ('+source+(hero?' · '+hero:'')+')',value:names.join(', ')||Number(result.count||0)+' cards'});
    }
  }
  const mana=e.mana_result;
  if(mana&&['BURN','STEAL'].includes(mana.mode)){
    // The attacker may know the COUNT but not a blind-picked shard's color.
    // Exact Regular/Color identities enter this action ONLY via the
    // recipient-only committed MANA_REMOVAL effect above.
    const title=mana.mode==='STEAL'?'Mana Steal':'Mana Burn';
    if(!rows.some(x=>x.title===title)){
      const count=Math.max(0,Math.trunc(Number(mana.removed_count)||0));
      if(count)rows.push({title,value:'Removed '+count+' Mana Shard'+(count===1?'':'s')+' (type hidden).'});
    }
    if(mana.mode==='STEAL')rows.push({title:'Mana Gained',value:'+'+Math.max(0,Number(mana.gained_count)||0)+' Mana Shards'});
  }
  for(const move of e.card_movements||[]){
    const zone=({Hand:'HAND','Main Deck':'MAIN_DECK',Field:'FIELD',EXP:'EXP'})[move.from];
    const duplicateDiscard=move.to==='Discard'&&zone&&
      (e.effect_results||[]).some(r=>r.kind==='DISCARD'&&r.origin===zone&&
        (move.card_ids||[]).length>0&&
        (move.card_ids||[]).every(id=>(r.card_ids||[]).includes(id)));
    if(duplicateDiscard)continue;
    const names=(move.card_ids||[]).map(id=>cv(id)?.name||id);
    rows.push({title:move.from+' → '+move.to,value:names.length?names.join(', '):
      (Math.max(0,Number(move.count)||0)+' card'+(Number(move.count)===1?'':'s')+' (identity hidden)')});
  }
  return rows;
}
// Response chains and cards discarded by the same committed action are
// navigable locally from the existing viewer-masked journal. This never asks
// the server for a card identity or scans canonical private state.
function pvpPlayedRelatedCards(e){
  const ordinary=resolvedHistory.filter(x=>!x.card_movement_only&&x.card_id&&x.id);
  if(e.card_movement_only){
    const parent=ordinary.find(x=>x.id===e.source_action_id&&x.side===e.source_action_side);
    if(!parent)return '';
    return '<section class="gl-played-related"><h4>Caused By</h4><div class="gl-played-related-list">'+
      '<button type="button" class="gl-played-related-card" data-gl-related-id="'+esc(parent.id)+'" data-gl-related-side="'+esc(parent.side)+'" aria-label="View '+esc(cv(parent.card_id)?.name||parent.card_id)+'"><img src="'+esc(art(parent.card_id))+'" alt="'+esc(cv(parent.card_id)?.name||parent.card_id)+'"><span>'+esc(parent.side==='PLAYER'?'YOU':'OPPONENT')+'</span></button>'+ 
      '</div></section>';
  }
  const ids=new Set([e.id]);
  // Explicit chain IDs and parent-to-response edges remain public only for
  // already-played actions. Repeated copies have different committed event IDs.
  for(const a of ordinary)if(e.card_played_chain_id&&a.card_played_chain_id===e.card_played_chain_id)ids.add(a.id);
  for(let j=0;j<6;j++){
    let changed=false;
    for(const a of ordinary){
      if(a.response_to_event_id&&ids.has(a.response_to_event_id)&&!ids.has(a.id)){ids.add(a.id);changed=true;}
      if(a.response_to_event_id&&ids.has(a.id)&&!ids.has(a.response_to_event_id)){ids.add(a.response_to_event_id);changed=true;}
      // Optional public card-ID relation only when an identical repeated play
      // cannot confuse the response with another action. Never guess by round.
      if(!a.response_to_event_id&&a.response_to_card_id&&a.response_to_side){
        const candidates=ordinary.filter(x=>x.card_id===a.response_to_card_id&&x.side===a.response_to_side);
        if(candidates.length===1){const parent=candidates[0];
          if(ids.has(parent.id)&&!ids.has(a.id)){ids.add(a.id);changed=true;}
          if(ids.has(a.id)&&!ids.has(parent.id)){ids.add(parent.id);changed=true;}
        }
      }
    }
    if(!changed)break;
  }
  const chain=ordinary.filter(x=>x.id!==e.id&&ids.has(x.id)).sort(playedChronology);
  const discarded=resolvedHistory.filter(x=>x.card_movement_only&&x.source_action_id===e.id&&
    x.source_action_side===e.side).sort(playedChronology);
  if(!chain.length&&!discarded.length)return '';
  const sections=[];
  for(const [title,cards] of [['Related Cards · Response Chain',chain],['Discarded Cards',discarded]]){
    if(!cards.length)continue;
    sections.push('<section class="gl-played-related"><h4>'+esc(title)+'</h4><div class="gl-played-related-list">'+
      cards.slice(0,12).map(x=>'<button type="button" class="gl-played-related-card" data-gl-related-id="'+esc(x.id)+'" data-gl-related-side="'+esc(x.side)+'" aria-label="View '+esc(cv(x.card_id)?.name||x.card_id)+'"><img src="'+esc(art(x.card_id))+'" alt="'+esc(cv(x.card_id)?.name||x.card_id)+'"><span>'+esc(x.card_movement_only?'DISCARDED':x.side==='PLAYER'?'YOU':'OPPONENT')+'</span></button>').join('')+
      '</div></section>');
  }
  return sections.join('');
}
function pvpPlayedAdditionalLines(e,fields){
  const hasDamage=!!(e.damage_by_hero?.length||e.damage_summary?.actual_hp_damage!==undefined);
  const hasHeal=!!e.healing_by_hero?.length;
  const hasStatus=!!e.status_by_hero?.some(x=>x.after!==x.before);
  const hasMana=!!(e.mana_result||(e.effect_results||[]).some(x=>x.kind==='MANA_REMOVAL'));
  const hasDiscard=!!(e.effect_results||[]).some(x=>x.kind==='DISCARD');
  const hasBurn=!!(e.damage_by_hero||[]).some(h=>Number(h.summary?.burn_damage||0)>0)||
    Number(e.damage_summary?.burn_damage||0)>0;
  const outcomes=fields.some(x=>x.title==='Outcome');
  const seen=new Set(),out=[];
  for(const raw of e.result_lines||[]){
    const line=String(raw||'').trim();if(!line)continue;
    if(/resolved by|\bruntime\b|committed by|before response|final zone|mana cost|source:|target lane/i.test(line))continue;
    const damageMath=/^(?:printed\/base damage|base damage|damage after modifiers(?: at release)?|primary damage after modifiers|defense\s*\/\s*prevention|primary defense\s*\/\s*prevention|response block|passive reduction|active reduction|calculated final damage|final hp damage|actual hp damage|damage dealt|follow-up damage|separate conditional follow-up|separate follow-up incoming damage|separate follow-up applied damage)\s*:/i.test(line)||
      /^(?:.+\s+)?HP:\s*-?\d+\s*(?:->|→)\s*-?\d+\.?$/i.test(line)||
      /\b(?:took|dealt)\s+\d+\s+(?:physical|magical)\s+damage\.?$/i.test(line);
    if(hasDamage&&damageMath)continue;
    if(hasBurn&&/^burn added \+\d+ damage\.?$/i.test(line))continue;
    if(hasHeal&&/\b(heal(?:ed|ing)?|restor(?:ed|es|ing))\b/i.test(line))continue;
    if(hasStatus&&/\b(status (?:result|effect|applied)|inflict(?:ed|s|ing)?\s+(?:Poison|Burn|Bleed|Freeze|Stun|Sleep))\b/i.test(line))continue;
    if(hasMana&&/\b(mana burn|mana steal|mana shards removed|mana shards? (?:gained|lost|removed))\b/i.test(line))continue;
    if(hasDiscard&&/\bdiscard(?:ed|s|ing)?\b/i.test(line))continue;
    if(outcomes&&/\b(countered|negated|dodged|blocked)\b/i.test(line))continue;
    if(!/\b(status result|status applied|heal(?:ed|ing)?|restor(?:ed|es|ing)|invincible|reflect(?:ed|s|ing)?|defeated|countered|negated|dodged|burn added)\b/i.test(line))continue;
    const key=line.replace(/\s+/g,' ').toLowerCase();
    if(!seen.has(key)){seen.add(key);out.push(line);}
    if(out.length>=4)break;
  }
  return out;
}
// RC39 Part5 Batch2 donor: per-Hero resolved data is grouped into exactly
// one visual box per affected Hero. Input is the already viewer-safe PvP
// action projection; never look up private Hand or Deck state.
function pvpPlayedHeroOutcomeHtml(e){
  // The same committed attack can hit a Hero multiple times. One Hero box,
  // one coherent breakdown; never repeat Damage/HP in a flat Result panel.
  const groups=new Map();
  const get=h=>{
    const key=[h.side||'',h.lane||'',h.name||'Hero'].join('|');
    if(!groups.has(key))groups.set(key,{name:String(h.name||'Hero'),lane:h.lane||'',
      hits:0,base:0,modified:0,block:0,passive:0,active:0,burn:0,followUp:0,modifiers:[],
      actual:0,hpBefore:null,hpAfter:null,hasBase:false,hasModified:false,heal:0,status:[]});
    return groups.get(key);
  };
  const safe=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
  const damage=Array.isArray(e.damage_by_hero)&&e.damage_by_hero.length?e.damage_by_hero:
    (e.damage_summary&&Object.hasOwn(e.damage_summary,'actual_hp_damage')?
      [{name:pvpPlayedHeroName(e,'target')||'Target Hero',side:e.target_side,lane:e.target_lane,summary:e.damage_summary}]:[]);
  for(const h of damage){
    const ds=h?.summary;if(!ds||!Object.hasOwn(ds,'actual_hp_damage'))continue;
    const g=get(h);g.hits++;g.actual+=safe(ds.actual_hp_damage);
    if(Object.hasOwn(ds,'base_damage')){g.hasBase=true;g.base+=safe(ds.base_damage);}
    if(Object.hasOwn(ds,'damage_after_modifiers')){g.hasModified=true;g.modified+=safe(ds.damage_after_modifiers);}
    g.block+=safe(ds.response_block);g.passive+=safe(ds.passive_reduction);
    g.active+=safe(ds.active_reduction);g.burn+=safe(ds.burn_damage);
    g.followUp+=safe(ds.follow_up_damage);
    for(const m of h.modifiers||[])if(m&&Number.isFinite(Number(m.amount)))
      g.modifiers.push({name:String(m.source_name||m.source_type||'Modifier'),amount:Number(m.amount)});
    if(g.hpBefore===null&&Object.hasOwn(ds,'target_hp_before'))g.hpBefore=Number(ds.target_hp_before);
    if(Object.hasOwn(ds,'target_hp_after'))g.hpAfter=Number(ds.target_hp_after);
  }
  for(const h of e.healing_by_hero||[]){const heal=safe(h?.healed);if(heal>0)get(h).heal+=heal;}
  for(const h of e.status_by_hero||[]){const before=Number(h?.before),after=Number(h?.after);
    if(h?.status&&Number.isFinite(before)&&Number.isFinite(after)&&before!==after)
      get(h).status.push({name:String(h.status),before,after});
  }
  const dtype=/Magical/i.test(e.damage_type||'')?'Magical':
    /Physical/i.test(e.damage_type||'')?'Physical':'HP';
  const sections=[];
  for(const g of groups.values()){
    const lines=[];const put=x=>lines.push('<li>'+esc(x)+'</li>');
    if(g.hasBase&&g.base>0)put('Base Damage: '+g.base);
    if(g.modifiers.length){
      const tally=new Map();
      for(const m of g.modifiers){const key=m.name;tally.set(key,(tally.get(key)||0)+m.amount)}
      for(const [name,amount] of tally)if(amount)put(name+': '+(amount>0?'+':'')+amount+' Damage');
    }
    if(g.hasModified&&g.hasBase&&g.modified!==g.base)put('After Modifiers: '+g.modified);
    if(g.block>0)put('Block: -'+g.block+' Damage');
    if(g.passive>0)put('Passive Reduction: -'+g.passive+' Damage');
    if(g.active>0)put('Active Reduction: -'+g.active+' Damage');
    if(g.burn>0)put('Burn Bonus: +'+g.burn+' Damage');
    if(g.followUp>0)put('Follow-up Damage: +'+g.followUp+' Damage');
    // Even a full BLOCK deserves an explicit zero actual-HP result.
    if(g.actual>0)put('Final '+dtype+' Damage: '+g.actual+(g.hits>1?' ('+g.hits+' hits)':''));
    else if(g.hits>0&&(g.base>0||g.modified>0||g.block>0||g.passive>0||g.active>0))put('Actual HP Damage: 0');
    if(g.hpBefore!==null&&g.hpAfter!==null&&Number.isFinite(g.hpBefore)&&
       Number.isFinite(g.hpAfter)&&g.hpBefore!==g.hpAfter)put('HP: '+g.hpBefore+' → '+g.hpAfter);
    if(g.heal>0)put('HP Restored: +'+g.heal+' HP');
    for(const x of g.status)put(x.name+': '+x.before+' → '+x.after+' turns');
    if(lines.length)sections.push('<article class="gl-played-hero-group"><h4>'+esc(g.name)+
      '</h4>'+(g.lane?'<span class="gl-played-hero-lane">'+esc(g.lane)+'</span>':'')+'<ul>'+lines.join('')+'</ul></article>');
  }
  const headline=[...groups.values()].some(g=>g.hits>0)?'Damage Resolution — by Hero':'Effect Resolution — by Hero';
  return sections.length?'<section class="gl-played-hero-groups"><h4>'+headline+'</h4>'+
    sections.join('')+'</section>':'';
}
function pvpPlayedResponseDetail(e){
  // Use ONLY other publicly committed Card Played actions. Neither private
  // Response options nor an opponent's Hand is available to this renderer.
  const events=resolvedHistory.filter(x=>x?.id&&!x.card_movement_only&&x.id!==e.id);
  const uniqueTarget=resolvedHistory.filter(x=>!x.card_movement_only&&x.card_id===e.card_id&&x.side===e.side).length===1;
  const linked=events.filter(x=>
    (x.response_to_event_id&&x.response_to_event_id===e.id)||
    (uniqueTarget&&!x.response_to_event_id&&x.response_to_card_id===e.card_id&&
      x.response_to_side===e.side)||
    (e.card_played_chain_id&&x.card_played_chain_id===e.card_played_chain_id&&
      ['DEF','REACTION','RESPONSE','COUNTER'].includes(String(x.label||'').toUpperCase())));
  const lines=[],seen=new Set();
  for(const x of linked.sort(playedChronology)){
    const actor=x.side==='PLAYER'?'You':'Opponent',card=cv(x.card_id)?.name||x.card_id;
    const hero=x.source_hero_card_id?cv(x.source_hero_card_id)?.name||x.source_hero_card_id:'';
    const detail=String(x.defense_text||(x.response_lines||[]).find(t=>/block|dodge|negat|counter|reflect|prevent/i.test(t))||'').trim();
    const action=String(x.label||'').toUpperCase()==='DEF'?'used':'responded with';
    const line=actor+' '+action+' '+card+(hero?' from '+hero:'')+(detail?' — '+detail.replace(/[.]+$/,'')+'.':'.');
    if(!seen.has(x.id)){seen.add(x.id);lines.push(line);}
  }
  return lines;
}

function pvpPlayedDetailHtml(e){
  const name=cv(e.card_id)?.name||e.title||e.card_id;
  const field=({title,value})=>'<div class="gl-played-gameplay-row"><strong>'+esc(title)+
    '</strong><p>'+esc(value)+'</p></div>';
  const head='<div class="played-detail-layout"><div class="played-detail-card"><img src="'+
    esc(art(e.card_id))+'" alt="'+esc(name)+'"></div><section class="played-detail-copy gl-played-gameplay-copy"><h3>'+esc(name)+'</h3>';
  if(e.card_movement_only){
    const source=e.source_effect_card_id?(cv(e.source_effect_card_id)?.name||e.source_effect_card_id):'';
    const origin=({HAND:'Hand',MAIN_DECK:'Main Deck',FIELD:'Field',EXP:'Hero EXP'})[e.discard_origin];
    // No anonymous 'Unknown origin / Opponent Effect' entries: a discard is
    // displayed only when the source and real initial zone are authoritative.
    if(!source||!origin)return head+field({title:'Action',value:'Discarded'})+'</section></div>';
    const fields=[{title:'Action',value:'Discarded by effect'},
      {title:'From',value:origin},{title:'Caused By',value:source}];
    if(e.discard_hero_card_id)fields.push({title:'Hero',value:cv(e.discard_hero_card_id)?.name||e.discard_hero_card_id});
    return head+fields.map(field).join('')+pvpPlayedRelatedCards(e)+'</section></div>';
  }
  const label=String(e.label||'').toUpperCase();
  const fields=[{title:'Action',value:pvpPlayedActionName(e)}];
  const usedBy=pvpPlayedHeroName(e,label==='TRIBUTE'?'target':'source');
  if(usedBy)fields.push({title:label==='TRIBUTE'?'Hero':'Used By',value:usedBy});
  if(label==='DEF'){
    const protectedHero=pvpPlayedHeroName(e,'defended');
    if(protectedHero&&protectedHero!==usedBy)fields.push({title:'Protected Hero',value:protectedHero});
    if(e.response_to_card_id)fields.push({title:'Responded To',value:cv(e.response_to_card_id)?.name||e.response_to_card_id});
  }else if(label!=='TRIBUTE'&&!(e.damage_by_hero?.length||e.healing_by_hero?.length||e.status_by_hero?.length||
      (e.damage_summary&&Object.hasOwn(e.damage_summary,'actual_hp_damage')))){
    const target=pvpPlayedHeroName(e,'target')||'';
    if(target&&target!==usedBy)fields.push({title:'Target',value:target});
  }
  if(label==='TRIBUTE'&&Number.isFinite(Number(e.exp_gained)))
    fields.push({title:'EXP Gained',value:'+'+Number(e.exp_gained)+' EXP'});
  const resolution=String(e.resolution_state||'').toUpperCase();
  if(['NEGATED','COUNTERED','CANCELED'].includes(resolution))fields.push({title:'Outcome',value:resolution});
  if(label==='DEF'&&!['NEGATED','COUNTERED','CANCELED'].includes(resolution)){
    const kind=String(e.response_kind||'').toLowerCase(),line=(e.result_lines||[]).join(' ');
    const value=kind==='dodge'||kind==='second_chance'||/\bdodg(?:e|ed|es|ing)\b/i.test(line)?'DODGED':
      ['block','dragon_scale','area_reduce','legacy_reduce'].includes(kind)||/\bblock(?:ed|s|ing)?\b/i.test(line)?'BLOCKED':'';
    if(value)fields.push({title:'Outcome',value});
  }
  fields.push(...pvpPlayedEffectRows(e));
  const response=pvpPlayedResponseDetail(e);
  if(response.length)fields.push({title:'Response Detail',value:response.join(' · ')});
  const additional=pvpPlayedAdditionalLines(e,fields);
  if(additional.length)fields.push({title:'Additional Effects',value:additional.join(' · ')});
  return head+fields.map(field).join('')+pvpPlayedHeroOutcomeHtml(e)+pvpPlayedRelatedCards(e)+'</section></div>';
}


function __legacyCardPlayedEnd(){}
