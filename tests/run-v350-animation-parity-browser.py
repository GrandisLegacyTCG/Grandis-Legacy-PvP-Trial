#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import importlib.util, json, os, subprocess, time, random, urllib.request, copy, sys, traceback

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'tests/artifacts/v350-animation-parity'
OUT.mkdir(parents=True,exist_ok=True)

# Reuse the already-proven two-client production-browser harness from v3.49 Part 1.
spec=importlib.util.spec_from_file_location('v349p1',ROOT/'tests/run-v349-shard-parity-browser.py')
p1=importlib.util.module_from_spec(spec); spec.loader.exec_module(p1)
p1.BUILD='gl-pvp-3.50-animation-parity-final-2026-09-26'
SERVER_TMP=ROOT/'.v350-animation-qa-server.mjs'

src=(ROOT/'server.js').read_text()
marker="        case 'runtime-intent': {"
qa_cases="""        case 'qa-patch-state': {
          if (process.env.GL_PVP_QA !== '1') throw new Error('QA state patch is disabled.');
          if (client.role !== 'player' || Number(client.seat) !== 1) throw new Error('QA state patch requires Player 1 test authority.');
          if (!room.engine?.board?.appState) throw new Error('QA state patch requires an active canonical board.');
          const patch = msg.patch && typeof msg.patch === 'object' ? clone(msg.patch) : {};
          Object.assign(room.engine.board.appState, patch);
          room.engine.board = normalizeServerBoard(clone(room.engine.board));
          room.engine.revision += 1;
          room.engine.bridgeSeat = null; room.engine.bridgeRevision = -1; room.engine.viewCache.clear();
          room.match.status = 'started'; room.match.serverBoard = room.engine.board; room.match.serverBoardRevision = room.engine.revision;
          room.match.lastAnimationEvents = []; room.match.lastAnimationEvent = null;
          addLog(room, `QA V350 STATE r${room.engine.revision}.`);
          break;
        }
        case 'qa-transition-state': {
          if (process.env.GL_PVP_QA !== '1') throw new Error('QA transition is disabled.');
          if (client.role !== 'player' || Number(client.seat) !== 1) throw new Error('QA transition requires Player 1 test authority.');
          if (!room.engine?.board?.appState) throw new Error('QA transition requires an active canonical board.');
          const before = clone(room.engine.board.appState);
          const patch = msg.patch && typeof msg.patch === 'object' ? clone(msg.patch) : {};
          const actorSide = msg.actorSide === 'AI' ? 'AI' : 'PLAYER';
          const intentName = safeText(msg.intentName || 'qaTransition', 80);
          Object.assign(room.engine.board.appState, patch);
          room.engine.board = normalizeServerBoard(clone(room.engine.board));
          room.engine.revision += 1;
          room.engine.bridgeSeat = null; room.engine.bridgeRevision = -1; room.engine.viewCache.clear();
          room.match.status = 'started'; room.match.serverBoard = room.engine.board; room.match.serverBoardRevision = room.engine.revision;
          const events = buildPublicAnimationEvents(before, room.engine.board.appState, actorSide, intentName, room.engine.revision);
          room.match.lastAnimationEvents = events; room.match.lastAnimationEvent = events[0] || null;
          addLog(room, `QA V350 TRANSITION r${room.engine.revision}: ${intentName}.`);
          break;
        }
"""+marker
if marker not in src: raise RuntimeError('runtime-intent marker missing')
SERVER_TMP.write_text(src.replace(marker,qa_cases,1))


def launch_server():
    port=random.randint(47100,49900)
    proc=subprocess.Popen(['node',SERVER_TMP.name],cwd=ROOT,env={**os.environ,'HOST':'127.0.0.1','PORT':str(port),'GL_PVP_QA':'1'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    for _ in range(160):
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.2) as r:
                if r.status==200: return port,proc
        except Exception: time.sleep(.05)
    out,err=proc.communicate(timeout=1); raise RuntimeError('server health timeout\n'+out+'\n'+err)


def instrument(page):
    page.evaluate("""()=>{
      window.__V350={calls:[],nodes:[],active:0,maxActive:0};
      const v=window.__V350,b=window.GL_LOCAL_AI_BRIDGE;
      const names=['beginAuthoritativeHeldPlayedCardMotion','releaseAuthoritativeHeldCardMotion','captureAuthoritativeHandDiscardMotion','queueCapturedAuthoritativeHandDiscardMotion','captureAuthoritativeAttachmentDiscardMotion','queueCapturedAuthoritativeAttachmentDiscardMotion','captureAuthoritativeLegacyToDeckMotion','queueCapturedAuthoritativeLegacyToDeckMotion','captureAuthoritativePlayedCardMotion','commitAuthoritativePlayedCardMotion'];
      for(const name of names){ const orig=b&&b[name]; if(typeof orig!=='function')continue; b[name]=function(...args){ const t=performance.now(); let ret; try{ret=orig.apply(this,args);}catch(e){v.calls.push({name,t,error:String(e)});throw e;} let safe=ret; if(ret&&typeof ret==='object')safe=JSON.parse(JSON.stringify(ret)); v.calls.push({name,t,args:JSON.parse(JSON.stringify(args)),ret:safe}); return ret; }; }
      const obs=new MutationObserver(ms=>{for(const m of ms){for(const n of m.addedNodes){if(n&&n.nodeType===1&&n.classList&&n.classList.contains('gl-flying-card')){v.active++;v.maxActive=Math.max(v.maxActive,v.active);const r=n.getBoundingClientRect();v.nodes.push({event:'add',t:performance.now(),id:n.dataset.animationId||'',held:n.classList.contains('gl-held-card'),rect:{left:r.left,top:r.top,width:r.width,height:r.height}});} } for(const n of m.removedNodes){if(n&&n.nodeType===1&&n.classList&&n.classList.contains('gl-flying-card')){v.active=Math.max(0,v.active-1);v.nodes.push({event:'remove',t:performance.now(),id:n.dataset.animationId||''});}}}});
      obs.observe(document.body,{childList:true,subtree:true}); window.__V350_OBS=obs;
    }""")


def log(page): return page.evaluate('window.__V350')
def calls(page,name): return [x for x in log(page)['calls'] if x.get('name')==name]
def reset_log(page): page.evaluate("()=>{window.__V350.calls=[];window.__V350.nodes=[];window.__V350.active=0;window.__V350.maxActive=0}")
def wait_anim(page,ms=1100): page.wait_for_timeout(ms)
def last_events(page): return page.evaluate('GL_PVP_NETWORK.getSnapshot().match.lastAnimationEvents||[]')

def qatransition(host,guest,patch,actor='PLAYER',intent_name='qaTransition'):
    r=p1.rev(host)
    ok=host.evaluate("x=>GL_PVP_NETWORK.send('qa-transition-state',{patch:x.patch,actorSide:x.actor,intentName:x.intent})",{'patch':patch,'actor':actor,'intent':intent_name})
    assert ok
    p1.wait_rev(host,r); guest.wait_for_function("r=>Number(GL_PVP_NETWORK.getSnapshot().match.serverBoardRevision||0)>r",arg=r,timeout=12000)
    host.wait_for_timeout(60); guest.wait_for_timeout(60)
    return last_events(host)

def generic(uid,side='PLAYER'): return p1.shard(uid,side=side)

def patch_thief_attack_setup(host,guest):
    p=p1.base_patch(host)
    ph=copy.deepcopy(p['playerHeroes']); ah=copy.deepcopy(p['aiHeroes'])
    ph['CENTER']['card_id']='S1-THF-H002'; ph['CENTER']['exhausted']=False; ph['CENTER']['mode']='HERO'; ph['CENTER']['legacy_mode']=False
    ah['CENTER']['exhausted']=False; ah['CENTER']['hp']=max(100,int(ah['CENTER'].get('hp') or 100));
    p.update({'turn':'PLAYER','phase':'Battle','playerHeroes':ph,'aiHeroes':ah,'playerHand':['S1-THF-009','S1-THF-007','S1-THF-008'],'aiHand':[],
              'playerManaPoolCards':[generic(f'XC-G{i}') for i in range(1,7)],'playerManaDeck':[],'mana':6,'aiMana':0})
    p1.qa_patch(host,guest,p)

def scenario_required_cost_and_held(host,guest):
    patch_thief_attack_setup(host,guest); reset_log(host); reset_log(guest)
    p1.intent(host,'beginPlayFromHand',[0]); p1.wait_pending(host,'source_selection')
    p1.intent(host,'chooseHeroFromBoard',['PLAYER','CENTER']); pend=p1.wait_pending(host,'target_selection')
    legal=pend.get('legal_targets') or ['CENTER']; lane='CENTER' if 'CENTER' in legal else legal[0]
    p1.intent(host,'chooseHeroFromBoard',['AI',lane])
    # Required-cost attack must have produced a real response window and the card must remain held visually.
    host.wait_for_function("()=>!!GL_LOCAL_AI_BRIDGE.getSnapshot().appState.responseWindow",timeout=12000)
    wait_anim(host,850)
    ev=last_events(host); kinds=[e.get('kind') for e in ev]
    assert 'card_play' in kinds,(kinds,ev)
    disc=[e for e in ev if e.get('kind')=='hand_to_discard']
    assert len(disc)==2,(disc,ev)
    cp=next(e for e in ev if e.get('kind')=='card_play')
    assert cp.get('held_until_resolution') and cp.get('hold_key'),cp
    assert len(calls(host,'queueCapturedAuthoritativeHandDiscardMotion'))>=2,log(host)
    assert len(calls(host,'beginAuthoritativeHeldPlayedCardMotion'))>=1,log(host)
    assert host.locator('.gl-held-card').count()==1,'attack card not visibly held during Response'
    # No Response finalizes the canonical attack and must release the held visual to its final destination.
    p1.intent(guest,'responsePassNoStuck',[])
    guest.wait_for_function("()=>!GL_LOCAL_AI_BRIDGE.getSnapshot().appState.responseWindow",timeout=12000)
    wait_anim(host,1000)
    release_events=last_events(host)
    assert any(e.get('kind')=='held_card_release' for e in release_events),release_events
    assert len(calls(host,'releaseAuthoritativeHeldCardMotion'))>=1,log(host)
    assert host.locator('.gl-held-card').count()==0,'held card remained after Response resolution'
    s=p1.app(host)
    assert 'S1-THF-009' in s['playerDiscard'] and 'S1-THF-007' in s['playerDiscard'] and 'S1-THF-008' in s['playerDiscard'],s['playerDiscard']
    return {'requiredCostMotions':2,'heldDuringResponse':True,'released':True}

def scenario_hand_limit(host,guest):
    p=p1.base_patch(host)
    hand=['S1-WAR-001','S1-WAR-002','S1-WAR-003','S1-MAG-002','S1-MAG-003','S1-THF-002','S1-THF-003','S1-ITM-001','S1-EVT-002','S1-ITM-002']
    p.update({'turn':'PLAYER','phase':'End','playerHand':hand,'playerDiscard':[], 'pending':{'type':'hand_limit_discard','side':'PLAYER','decision_side':'PLAYER','required':2,'selected':[]}})
    p1.qa_patch(host,guest,p); reset_log(host)
    p1.intent(host,'toggleDiscardIndex',[8]); p1.intent(host,'toggleDiscardIndex',[9]); p1.intent(host,'handleChoiceConfirm',[])
    wait_anim(host,1000)
    ev=last_events(host); disc=[e for e in ev if e.get('kind')=='hand_to_discard']
    assert len(disc)==2,(ev,p1.app(host).get('playerDiscard'))
    assert len(calls(host,'queueCapturedAuthoritativeHandDiscardMotion'))>=2,log(host)
    return {'motions':len(disc),'discardCount':len(p1.app(host)['playerDiscard'])}


def scenario_response_additional_discard(host,guest):
    p=p1.base_patch(host); ph=copy.deepcopy(p['playerHeroes']); ah=copy.deepcopy(p['aiHeroes'])
    ph['LEFT']['card_id']='S1-ARC-H001'; ph['LEFT']['exhausted']=False
    ah['LEFT']['card_id']='S1-WAR-H001'; ah['LEFT']['exhausted']=False
    p.update({'turn':'AI','phase':'Battle','playerHeroes':ph,'aiHeroes':ah,'playerHand':['S1-ARC-003','S1-WAR-002'],'aiHand':['S1-WAR-001'],
              'playerManaPoolCards':[generic(f'RESP-P{i}') for i in range(1,8)],'aiManaPoolCards':[generic(f'RESP-A{i}','AI') for i in range(1,8)],
              'playerManaDeck':[],'aiManaDeck':[],'mana':7,'aiMana':7})
    p1.qa_patch(host,guest,p); reset_log(host)
    # Seat 2 is canonical AI but sees its side as local PLAYER.
    p1.intent(guest,'beginPlayFromHand',[0]); sp=p1.wait_pending(guest,'source_selection'); lane='LEFT' if 'LEFT' in (sp.get('legal_sources') or []) else sp['legal_sources'][0]
    p1.intent(guest,'chooseHeroFromBoard',['PLAYER',lane]); tp=p1.wait_pending(guest,'target_selection'); target='LEFT' if 'LEFT' in (tp.get('legal_targets') or []) else tp['legal_targets'][0]
    p1.intent(guest,'chooseHeroFromBoard',['AI',target]); host.wait_for_function("()=>!!GL_LOCAL_AI_BRIDGE.getSnapshot().appState.responseWindow",timeout=12000)
    opts=p1.app(host)['responseWindow'].get('options') or []; idx=next((i for i,o in enumerate(opts) if o.get('card_id')=='S1-ARC-003'),-1); assert idx>=0,opts
    p1.intent(host,'responseSelectNoStuck',[idx]); p1.intent(host,'confirmSelectedResponse',[]); pend=p1.wait_pending(host,'response_payment_choice')
    cands=pend.get('candidates') or []; pick=next((i for i,x in enumerate(cands) if x.get('card_id')=='S1-WAR-002'),-1); assert pick>=0,cands
    p1.intent(host,'selectResponsePaymentChoice',[pick]); p1.intent(host,'handleChoiceConfirm',[])
    # A committed Response may open a counter-response window. Pass it from the attacker if present.
    if p1.app(guest).get('responseWindow'):
        try: p1.intent(guest,'responsePassNoStuck',[])
        except Exception: pass
    wait_anim(host,1100)
    ev=last_events(host)
    # The payment revision must have a secondary hand->discard event for the chosen additional cost.
    assert any(e.get('kind')=='hand_to_discard' and e.get('card_id')=='S1-WAR-002' for e in ev) or any(c.get('args',[None,None,None])[2]=='S1-WAR-002' for c in calls(host,'captureAuthoritativeHandDiscardMotion')), (ev,log(host))
    assert len(calls(host,'queueCapturedAuthoritativeHandDiscardMotion'))>=1,log(host)
    assert 'S1-WAR-002' in p1.app(host)['playerDiscard'],p1.app(host)['playerDiscard']
    return {'costCard':'S1-WAR-002','motion':True}

def scenario_legacy_ability_cost(host,guest):
    p=p1.base_patch(host); ph=copy.deepcopy(p['playerHeroes'])
    ph['LEFT']={'card_id':'S1-WAR-L001','side':'PLAYER','lane':'LEFT','hp':1,'maxHp':1,'exhausted':False,'exp_cards':[],'exp_total':0,'attachments':[None,None],'statuses':[],'legacy_mode':True,'mode':'LEGACY','defeated_hero_snapshot':{'card_id':'S1-WAR-H001','hp':0,'maxHp':100,'statuses':[],'attachments':[None,None]},'active_legacy_card_id':'S1-WAR-L001'}
    p.update({'turn':'PLAYER','phase':'Deploy','playerHeroes':ph,'playerHand':['S1-WAR-001'],'playerDeck':['S1-MAG-001'],'playerDiscard':[]})
    p1.qa_patch(host,guest,p); reset_log(host)
    p1.intent(host,'beginActivatedLegacyAbility',['PLAYER','LEFT','warriors_relic']); pend=p1.wait_pending(host,'legacy_cost_selection'); assert pend.get('cost_candidates'),pend
    p1.intent(host,'selectLegacyCostChoice',[0]); p1.intent(host,'handleChoiceConfirm',[])
    wait_anim(host,900)
    assert 'S1-WAR-001' in p1.app(host)['playerDiscard'],p1.app(host)['playerDiscard']
    assert any(c.get('args',[None,None,None])[2]=='S1-WAR-001' for c in calls(host,'captureAuthoritativeHandDiscardMotion')),log(host)
    assert len(calls(host,'queueCapturedAuthoritativeHandDiscardMotion'))>=1,log(host)
    return {'costCard':'S1-WAR-001','motion':True}

def scenario_actual_revive(host,guest):
    p=p1.base_patch(host); ph,defeated=legacy_state_from(host)
    p.update({'turn':'PLAYER','phase':'Deploy','playerHeroes':ph,'playerLegacy':['S1-WAR-L001','S1-THF-L001'],'playerHand':['S1-ITM-008'],'playerDiscard':[],
              'playerManaPoolCards':[generic(f'REV-G{i}') for i in range(1,5)],'playerManaDeck':[],'mana':4})
    p1.qa_patch(host,guest,p); reset_log(host)
    p1.intent(host,'beginPlayFromHand',[0]); pend=p1.wait_pending(host,'target_selection'); legal=pend.get('legal_targets') or []; assert 'LEFT' in legal,pend
    p1.intent(host,'chooseHeroFromBoard',['PLAYER','LEFT']); wait_anim(host,1100)
    s=p1.app(host); assert not s['playerHeroes']['LEFT'].get('legacy_mode'),s['playerHeroes']['LEFT']; assert 'S1-ARC-L001' in s['playerLegacy'],s['playerLegacy']
    ev=last_events(host); assert any(e.get('kind')=='legacy_to_deck' and e.get('card_id')=='S1-ARC-L001' for e in ev),ev
    assert len(calls(host,'queueCapturedAuthoritativeLegacyToDeckMotion'))>=1,log(host)
    return {'revived':True,'motion':True}


def scenario_actual_attachment_expiry(host,guest):
    p=p1.base_patch(host); ph=copy.deepcopy(p['playerHeroes']); ph['CENTER']['card_id']='S1-WAR-H001'; ph['CENTER']['exhausted']=False; ph['CENTER']['attachments']=[None,None]
    p.update({'turn':'PLAYER','phase':'Deploy','playerHeroes':ph,'playerHand':['S1-ITM-013'],'playerDiscard':[],'activeAttachments':[],
              'playerManaPoolCards':[generic(f'RING-G{i}') for i in range(1,9)],'playerManaDeck':[],'mana':8})
    p1.qa_patch(host,guest,p); reset_log(host)
    p1.intent(host,'beginPlayFromHand',[0]); pend=p1.app(host).get('pending')
    if pend and pend.get('type')=='source_selection':
        legal=pend.get('legal_sources') or []; lane='CENTER' if 'CENTER' in legal else legal[0]; p1.intent(host,'chooseHeroFromBoard',['PLAYER',lane]); pend=p1.app(host).get('pending')
    if pend and pend.get('type')=='target_selection':
        legal=pend.get('legal_targets') or []; lane='CENTER' if 'CENTER' in legal else legal[0]; p1.intent(host,'chooseHeroFromBoard',['PLAYER',lane])
    host.wait_for_function("()=>!GL_LOCAL_AI_BRIDGE.getSnapshot().appState.pending",timeout=12000); host.wait_for_timeout(120)
    s=p1.app(host); assert any(a.get('card_id')=='S1-ITM-013' for a in (s.get('activeAttachments') or [])),s.get('activeAttachments')
    reset_log(host)
    for expected in ['Battle','Reform']:
        p1.intent(host,'advancePhase',[]); host.wait_for_function("x=>GL_LOCAL_AI_BRIDGE.getSnapshot().appState.phase===x",arg=expected,timeout=12000)
    # Reform -> End triggers authoritative end cleanup and turn handoff.
    r=p1.rev(host); assert host.evaluate("()=>GL_PVP_NETWORK.sendIntent('advancePhase',[])"); p1.wait_rev(host,r); host.wait_for_timeout(1300)
    s=p1.app(host); assert 'S1-ITM-013' in s.get('playerDiscard',[]),(s.get('phase'),s.get('turn'),s.get('activeAttachments'),s.get('playerDiscard'))
    assert not any(a.get('card_id')=='S1-ITM-013' for a in (s.get('activeAttachments') or [])),s.get('activeAttachments')
    assert len(calls(host,'queueCapturedAuthoritativeAttachmentDiscardMotion'))>=1,log(host)
    return {'card':'S1-ITM-013','expired':True,'motion':True}

def scenario_attachment_transition(host,guest,two=False):
    p=p1.base_patch(host); ph=copy.deepcopy(p['playerHeroes'])
    cards=['S1-ITM-011','S1-ITM-013'] if two else ['S1-ITM-011']
    slots=[None,None]
    active=[]
    for i,cid in enumerate(cards): slots[i]=cid; active.append({'attachment_id':f'QA-ATT-{i}','side':'PLAYER','lane':'CENTER','slot':i,'card_id':cid,'remaining':1,'counters':1})
    ph['CENTER']['attachments']=slots
    p.update({'playerHeroes':ph,'activeAttachments':active,'playerDiscard':[],'turn':'PLAYER','phase':'End'})
    p1.qa_patch(host,guest,p); reset_log(host)
    ph2=copy.deepcopy(ph); ph2['CENTER']['attachments']=[None,None]
    ev=qatransition(host,guest,{'playerHeroes':ph2,'activeAttachments':[],'playerDiscard':cards},'PLAYER','attachmentExpiry')
    wait_anim(host,1200)
    rel=[e for e in ev if e.get('kind')=='attachment_to_discard']
    assert len(rel)==len(cards),(rel,ev)
    assert len(calls(host,'queueCapturedAuthoritativeAttachmentDiscardMotion'))>=len(cards),log(host)
    return {'motions':len(rel)}

def legacy_state_from(host):
    current=p1.app(host); ph=copy.deepcopy(current['playerHeroes'])
    defeated={'card_id':'S1-ARC-H001','side':'PLAYER','lane':'LEFT','hp':0,'maxHp':80,'exhausted':False,'exp_cards':[],'exp_total':0,'attachments':[None,None],'statuses':[],'status':[],'mode':'HERO','legacy_mode':False}
    ph['LEFT']={'card_id':'S1-ARC-L001','side':'PLAYER','lane':'LEFT','mode':'LEGACY','legacy_mode':True,'active_legacy_card_id':'S1-ARC-L001','defeated_hero_snapshot':copy.deepcopy(defeated),'assigned_legacy_card_id':'S1-ARC-L001','legacy_lineage_id':'ARC-RANGER','legacy_package_id':'V350-QA','hp':1,'maxHp':1,'exhausted':False,'exp_cards':[],'exp_total':0,'attachments':[None,None],'statuses':[],'status':[]}
    return ph,defeated

def scenario_legacy_revive_transition(host,guest):
    p=p1.base_patch(host); ph,defeated=legacy_state_from(host)
    p.update({'turn':'PLAYER','phase':'Deploy','playerHeroes':ph,'playerLegacy':['S1-WAR-L001','S1-THF-L001'],'playerDiscard':[]})
    p1.qa_patch(host,guest,p); reset_log(host)
    ph2=copy.deepcopy(ph); restored=copy.deepcopy(defeated); restored.update({'lane':'LEFT','side':'PLAYER','mode':'HERO','legacy_mode':False,'active_legacy_card_id':None,'hp':30,'exhausted':True,'attachments':[None,None],'statuses':[]}); ph2['LEFT']=restored
    ev=qatransition(host,guest,{'playerHeroes':ph2,'playerLegacy':['S1-WAR-L001','S1-THF-L001','S1-ARC-L001']},'PLAYER','reviveHero')
    wait_anim(host,1200)
    rel=[e for e in ev if e.get('kind')=='legacy_to_deck']
    assert len(rel)==1 and rel[0].get('card_id')=='S1-ARC-L001',(rel,ev)
    assert len(calls(host,'queueCapturedAuthoritativeLegacyToDeckMotion'))>=1,log(host)
    return {'motion':True,'heroRestored':not p1.app(host)['playerHeroes']['LEFT'].get('legacy_mode')}

def responsive_geometry(host,guest):
    out={}
    for name,w,h in [('desktop',1366,768),('tablet-landscape',1024,768),('tablet-portrait',768,1024),('phone',390,844)]:
        host.set_viewport_size({'width':w,'height':h}); host.wait_for_timeout(180)
        p=p1.base_patch(host); ph=copy.deepcopy(p['playerHeroes']); ph['CENTER']['attachments']=['S1-ITM-011',None]
        p.update({'playerHeroes':ph,'activeAttachments':[{'attachment_id':f'R-{name}','side':'PLAYER','lane':'CENTER','slot':0,'card_id':'S1-ITM-011','remaining':1}], 'playerDiscard':[]})
        p1.qa_patch(host,guest,p); reset_log(host)
        ph2=copy.deepcopy(ph); ph2['CENTER']['attachments']=[None,None]
        qatransition(host,guest,{'playerHeroes':ph2,'activeAttachments':[],'playerDiscard':['S1-ITM-011']},'PLAYER','responsiveAttachment')
        host.wait_for_timeout(120)
        cap=calls(host,'captureAuthoritativeAttachmentDiscardMotion')[-1]['ret']
        assert cap and cap.get('from') and cap.get('to'),(name,cap,log(host))
        for r in [cap['from'],cap['to']]:
            cx=r['left']+r['width']/2; cy=r['top']+r['height']/2
            assert -5<=cx<=w+5 and -5<=cy<=h+5,(name,w,h,r)
        wait_anim(host,650)
        out[name]={'source':cap['from'],'destination':cap['to']}
    host.set_viewport_size({'width':1366,'height':768}); guest.set_viewport_size({'width':1366,'height':768})
    return out

def main():
    port,proc=launch_server()
    results={'ok':False,'realBrowser':True,'twoClient':True,'serverPort':port}
    try:
      with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-web-security'])
        c1=browser.new_context(viewport={'width':1366,'height':768}); c2=browser.new_context(viewport={'width':1366,'height':768})
        fixture=str(ROOT/'tests/fixtures/v349-artwork/Back-of-Card-Main-Deck.webp')
        def fulfill_art(route): route.fulfill(path=fixture,content_type='image/webp')
        for ctx in (c1,c2): ctx.route('https://grandislegacytcg.github.io/**',fulfill_art)
        a=c1.new_page(); b=c2.new_page(); p1.setup_page(a,port); p1.setup_page(b,port)
        p1.start_match(a,b); instrument(a); instrument(b)
        results['requiredDiscardHeldAttack']=scenario_required_cost_and_held(a,b); print('STEP required-discard + held attack',flush=True)
        results['handLimit']=scenario_hand_limit(a,b); print('STEP hand-limit',flush=True)
        results['responseAdditionalDiscard']=scenario_response_additional_discard(a,b); print('STEP response additional discard',flush=True)
        results['legacyAbilityCost']=scenario_legacy_ability_cost(a,b); print('STEP legacy ability cost',flush=True)
        results['actualAttachmentExpiry']=scenario_actual_attachment_expiry(a,b); print('STEP actual attachment expiry',flush=True)
        results['attachmentExpiry']=scenario_attachment_transition(a,b,False); print('STEP attachment-expiry',flush=True)
        results['multipleAttachmentDefeatEquivalent']=scenario_attachment_transition(a,b,True); print('STEP multiple-attachment transition',flush=True)
        results['legacyRevive']=scenario_actual_revive(a,b); print('STEP actual legacy revive',flush=True)
        results['responsiveGeometry']=responsive_geometry(a,b); print('STEP responsive geometry',flush=True)
        # Both seat orientations: run the generic attachment authoritative motion on Seat 2 view as local PLAYER after perspective transform.
        reset_log(b)
        p=p1.base_patch(a); ah=copy.deepcopy(p['aiHeroes']); ah['CENTER']['attachments']=['S1-ITM-011',None]
        p.update({'aiHeroes':ah,'activeAttachments':[{'attachment_id':'AI-ATT','side':'AI','lane':'CENTER','slot':0,'card_id':'S1-ITM-011','remaining':1}], 'aiDiscard':[]})
        p1.qa_patch(a,b,p); ah2=copy.deepcopy(ah); ah2['CENTER']['attachments']=[None,None]
        ev=qatransition(a,b,{'aiHeroes':ah2,'activeAttachments':[],'aiDiscard':['S1-ITM-011']},'AI','seat2Attachment')
        wait_anim(b,850); assert any(e.get('kind')=='attachment_to_discard' for e in ev); assert len(calls(b,'queueCapturedAuthoritativeAttachmentDiscardMotion'))>=1
        results['seat2Orientation']=True
        a.screenshot(path=str(OUT/'final-seat1.png')); b.screenshot(path=str(OUT/'final-seat2.png'))
        browser.close()
      results['ok']=True
      (OUT/'results.json').write_text(json.dumps(results,indent=2)+'\n')
      print(json.dumps(results,indent=2))
      return 0
    finally:
      proc.terminate()
      try: proc.wait(timeout=3)
      except Exception: proc.kill()
      for f in [SERVER_TMP,p1.SERVER_TMP]:
        try: Path(f).unlink()
        except Exception: pass

if __name__=='__main__':
  try: sys.exit(main())
  except Exception:
    traceback.print_exc()
    for f in [SERVER_TMP,getattr(p1,'SERVER_TMP',None)]:
      try:
        if f: Path(f).unlink()
      except Exception: pass
    sys.exit(1)
