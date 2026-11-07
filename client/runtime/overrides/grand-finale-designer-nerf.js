/* Grandis Legacy VS AI Season 0 — temporary designer-authorized Grand Finale patch.
 * ONLY local app runtime values and card art change. OSA DEV45 is READ-ONLY.
 * Current designer card front: S0-CLE-031 Grand Finale, Bard 60 / Maestro 90.
 * Other effects, Mana, CONDITION, timing, class legality are unchanged.
 * Remove/reevaluate this layer once a later OSA release officially includes this art.
 */
(function (g) {
  'use strict';
  var ID='S0-CLE-031', NEW_HASH='1d05629b76b52da42cbb384ece2ea37e505432aa580ad9cdb12dc44ca69d9489';
  var PREVIOUS={Bard:80,Maestro:120}, REVISED={Bard:60,Maestro:90};
  var SRC='Designer-approved VS AI local Grand Finale revision (OSA DEV45 unchanged)';
  var changed=0,seen=[];
  function replacePrintedLine(s){return String(s==null?'':s).replace(/80\s*\|\s*120\s*$/, '60 | 90');}
  function damageRow(row){
    if(!row)return;
    var label=String(row.label||row.variant||row.requiredPrintedClass||row.class||'');
    var cls=/Maestro/i.test(label)?'Maestro':/Bard/i.test(label)?'Bard':null;
    if(!cls)return;
    var old=PREVIOUS[cls],amount=REVISED[cls];
    if(row.damage!=null && Number(row.damage)===old)row.damage=typeof row.damage==='string'?String(amount):amount;
    if(row.damage_text!=null && Number(row.damage_text)===old)row.damage_text=String(amount);
    if(row.text!=null && String(row.text).trim()===String(old))row.text=String(amount);
    if(row.effect_text!=null && String(row.effect_text).trim()===String(old))row.effect_text=String(amount);
    if(row.printedDamageOrBlock===old)row.printedDamageOrBlock=amount;
    if(row.semantics && row.semantics.printedDamageOrBlock===old)row.semantics.printedDamageOrBlock=amount;
  }
  function patchCard(c) {
    if(!c || c.card_id!==ID || seen.indexOf(c)>=0)return;
    seen.push(c);
    var atk=c.attack&&c.attack.damage_by_class;
    if(!atk || !Object.prototype.hasOwnProperty.call(atk,'Bard') || !Object.prototype.hasOwnProperty.call(atk,'Maestro'))
      throw new Error('Grand Finale local patch: expected class-specific damage map missing');
    if(![PREVIOUS.Bard,REVISED.Bard].includes(Number(atk.Bard)) ||
       ![PREVIOUS.Maestro,REVISED.Maestro].includes(Number(atk.Maestro)))
      throw new Error('Grand Finale local patch: unexpected OSA damage change; review override before use');
    Object.keys(REVISED).forEach(function(cls){
      atk[cls]=REVISED[cls];
      if(c.effect_strings_by_class) c.effect_strings_by_class[cls]=String(REVISED[cls]);
    });
    [c.printed&&c.printed.rows,c.printed&&c.printed.blocks,
     c.requirement&&c.requirement.printed_class_rank_requirements,
     c.printed_class_rank_requirements].forEach(function(rows){if(Array.isArray(rows))rows.forEach(damageRow);});
    if(c.printed){
      c.printed.text=replacePrintedLine(c.printed.text);
      c.printed.source=SRC;
    }
    if(c.card_text)c.card_text=replacePrintedLine(c.card_text);
    if(c.effect_text)c.effect_text=replacePrintedLine(c.effect_text);
    if(c.asset){c.asset.original_osa_sha256=c.asset.original_osa_sha256||c.asset.sha256;c.asset.sha256=NEW_HASH;}
    c.local_design_override={card_id:ID,dated:'2026-11-06',
      source:SRC,printed_damage_by_class:REVISED,previous_osa_damage_by_class:PREVIOUS,
      note:'App-facing values only. The s0_authority / canonical_execution source records still reflect unchanged OSA DEV45.'};
    changed++;
  }
  function patchCollection(d){
    if(!d)return;
    (d.cards||[]).forEach(patchCard);
    Object.keys(d.families||{}).forEach(function(f){((d.families[f]||{}).cards||[]).forEach(patchCard);});
  }
  patchCollection(g.GL_CARD_DEFINITIONS);
  patchCollection(g.GRANDIS_LEGACY_RUNTIME_DATA);
  var previews=g.GRANDIS_LEGACY_CARD_PREVIEW;
  if(previews && Array.isArray(previews.cards)) previews.cards.forEach(function(c){
    if(!c || c.card_id!==ID)return;
    if(c.printed){c.printed.text=replacePrintedLine(c.printed.text);c.printed.source=SRC;
      [c.printed.rows,c.printed.blocks].forEach(function(rows){if(Array.isArray(rows))rows.forEach(damageRow);});}
    if(c.asset){c.asset.original_osa_sha256=c.asset.original_osa_sha256||c.asset.sha256;c.asset.sha256=NEW_HASH;}
  });
  var art=g.GL_ASSET_MANIFEST && g.GL_ASSET_MANIFEST.cards && g.GL_ASSET_MANIFEST.cards[ID];
  if(art){art.original_osa_sha256=art.original_osa_sha256||art.sha256;
    art.sha256=NEW_HASH;art.status='DESIGNER_APP_LOCAL_ART_PENDING_OSA';}
  if(changed===0)throw new Error('Grand Finale local override: target card not found');
  g.GL_S0_LOCAL_DESIGN_OVERRIDES=g.GL_S0_LOCAL_DESIGN_OVERRIDES||{};
  g.GL_S0_LOCAL_DESIGN_OVERRIDES[ID]={damage_by_class:REVISED,artwork_sha256:NEW_HASH,
    source:SRC,osa_modified:false};
})(typeof window!=='undefined'?window:globalThis);
