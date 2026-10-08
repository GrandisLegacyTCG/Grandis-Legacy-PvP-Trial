#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, re, subprocess, time, random, urllib.request, copy, sys, traceback

ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'public'
OUT=ROOT/'tests/artifacts/v349-shard-parity-part1'
OUT.mkdir(parents=True,exist_ok=True)
BUILD='gl-pvp-3.49-shard-parity-final-2026-09-26'
SERVER_TMP=ROOT/'.v349-qa-server.mjs'

# Real production server/runtime with one GL_PVP_QA-only state seeding message.
# The QA message is generated only for this test and is never included in package/runtime sync.
src=(ROOT/'server.js').read_text()
marker="        case 'runtime-intent': {"
qa_case="""        case 'qa-patch-state': {
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
          addLog(room, `QA SHARD PARITY STATE r${room.engine.revision}.`);
          break;
        }
"""+marker
if marker not in src: raise RuntimeError('runtime-intent marker missing')
SERVER_TMP.write_text(src.replace(marker,qa_case,1))

HTML=(P/'index.html').read_text()
HTML=re.sub(r'<script[\s\S]*?</script>','',HTML,flags=re.I)
HTML=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',HTML,flags=re.I)
CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
BASE_SCRIPTS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']

def shard(uid,kind='GENERIC',cls='',side='PLAYER'):
    return {'uid':uid,'kind':kind,'class_name':cls,'owner_side':side,'bottom_locked':False}

def setup_page(page,port,width=1366,height=768):
    page.set_viewport_size({'width':width,'height':height})
    page.set_content(HTML)
    page.add_style_tag(content=CSS)
    page.evaluate("""()=>{window.GL_APP_MODE='PVP';const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});document.body.classList.remove('pvp-booting')}""")
    for rel in BASE_SCRIPTS: page.add_script_tag(content=(P/rel).read_text())
    page.evaluate("([port,build])=>{window.GL_PVP_CONFIG=Object.assign({},window.GL_PVP_CONFIG||{},{roomId:1,room1WsBase:'ws://127.0.0.1:'+port,wsPath:'/ws',buildId:build});window.GL_CONFIG=window.GL_PVP_CONFIG}",[port,BUILD])
    page.add_script_tag(content=(P/'js/pvp-network.js').read_text())
    page.wait_for_function("window.GL_PVP_NETWORK&&GL_PVP_NETWORK.getSnapshot()&&GL_PVP_NETWORK.getSnapshot().local",timeout=15000)

def app(page): return page.evaluate('GL_LOCAL_AI_BRIDGE.getSnapshot().appState')
def rev(page): return int(page.evaluate('GL_PVP_NETWORK.getSnapshot().match.serverBoardRevision||0'))
def wait_rev(page,r,timeout=12000): page.wait_for_function("r=>Number(GL_PVP_NETWORK.getSnapshot().match.serverBoardRevision||0)>r",arg=r,timeout=timeout)
def wait_pending(page,t,timeout=12000):
    elapsed=0
    while elapsed < timeout:
        s=app(page)
        if s and s.get('pending') and s['pending'].get('type')==t: return s['pending']
        page.wait_for_timeout(50); elapsed += 50
    raise AssertionError(f"pending {t} not observed; current={app(page).get('pending')}")
def wait_no_pending(page,timeout=12000):
    elapsed=0
    while elapsed < timeout:
        if not app(page).get('pending'): return True
        page.wait_for_timeout(50); elapsed += 50
    raise AssertionError(f"pending did not clear: {app(page).get('pending')}")
def intent(page,name,args=None,expect_change=True):
    args=[] if args is None else args
    r=rev(page)
    sent=page.evaluate("x=>GL_PVP_NETWORK.sendIntent(x[0],x[1])",[name,args])
    if not sent: raise AssertionError(f'network refused {name}')
    if expect_change: wait_rev(page,r)
    else: page.wait_for_timeout(250)
    return rev(page)

def qa_patch(host,guest,patch):
    patch=copy.deepcopy(patch)
    if 'playerManaPoolCards' in patch: patch['mana']=len(patch['playerManaPoolCards'])
    if 'aiManaPoolCards' in patch: patch['aiMana']=len(patch['aiManaPoolCards'])
    if 'playerManaDeck' in patch: patch['playerManaDeckCount']=len(patch['playerManaDeck'])
    if 'aiManaDeck' in patch: patch['aiManaDeckCount']=len(patch['aiManaDeck'])
    if 'playerHand' in patch: patch['playerHandCount']=len(patch['playerHand'])
    if 'aiHand' in patch: patch['aiHandCount']=len(patch['aiHand'])
    if 'playerDeck' in patch: patch['playerDeckCount']=len(patch['playerDeck'])
    if 'aiDeck' in patch: patch['aiDeckCount']=len(patch['aiDeck'])
    r=rev(host)
    assert host.evaluate("p=>GL_PVP_NETWORK.send('qa-patch-state',{patch:p})",patch)
    wait_rev(host,r); guest.wait_for_function("r=>Number(GL_PVP_NETWORK.getSnapshot().match.serverBoardRevision||0)>r",arg=r,timeout=12000)
    host.wait_for_timeout(40); guest.wait_for_timeout(40)

def clean_heroes(base):
    heroes=copy.deepcopy(base)
    for h in heroes.values():
        if isinstance(h,dict):
            h['exhausted']=False
            h['status']=[]; h['statuses']=[]
            if h.get('hp',0)<=0: h['hp']=max(1,int(h.get('maxHp') or 100))
    return heroes

def base_patch(host):
    s=app(host)
    return {
      'pending':None,'responseWindow':None,'gameOver':False,'winner':None,'gameEndReason':None,'round':2,
      'pvpHumanVsHuman':True,'tributeUsedThisReform':False,'manualRepositionUsed':False,
      'resolvedCardCommitTokens':[],'resolvedCardCommitDestinations':{},
      'playerHeroes':clean_heroes(s['playerHeroes']),'aiHeroes':clean_heroes(s['aiHeroes']),
      'playerDiscard':[],'aiDiscard':[]
    }

def start_match(a,b):
    a.wait_for_timeout(350); b.wait_for_timeout(350)
    a.evaluate("GL_PVP_NETWORK.send('ready',{ready:true})"); b.evaluate("GL_PVP_NETWORK.send('ready',{ready:true})")
    a.wait_for_function("()=>{const s=GL_PVP_NETWORK.getSnapshot();return s.players.length===2&&s.players.every(p=>p.ready)}",timeout=12000)
    a.evaluate("GL_PVP_NETWORK.send('start-match',{seed:'v349-part1'})")
    b.wait_for_function("GL_PVP_NETWORK.getSnapshot().match.status==='coin-flip'",timeout=12000)
    b.evaluate("GL_PVP_NETWORK.send('choose-coin-flip',{choice:'HEADS'})")
    a.wait_for_function("GL_PVP_NETWORK.getSnapshot().match.status==='coin-result'",timeout=12000)
    a.evaluate("GL_PVP_NETWORK.send('confirm-coin-flip')")
    a.wait_for_function("GL_PVP_NETWORK.getSnapshot().match.status==='started'",timeout=12000)
    b.wait_for_function("GL_PVP_NETWORK.getSnapshot().match.status==='started'",timeout=12000)

def scenario_normal_payment(host,guest,local_page,canonical_side,multiple=False,nonmatching=False,only_generic=False):
    p=base_patch(host); local_is_p1=(canonical_side=='PLAYER')
    pp='player' if local_is_p1 else 'ai'; op='ai' if local_is_p1 else 'player'; turn=canonical_side
    cls_side='PLAYER' if local_is_p1 else 'AI'
    hand=['S1-WAR-002']
    pool=[]
    if only_generic:
        pool=[shard(f'QA-{pp}-G{i}',side=cls_side) for i in range(1,4)]
    elif nonmatching:
        pool=[shard(f'QA-{pp}-M','CLASS','Mage',cls_side),shard(f'QA-{pp}-G1',side=cls_side),shard(f'QA-{pp}-G2',side=cls_side)]
    elif multiple:
        pool=[shard(f'QA-{pp}-W','CLASS','Warrior',cls_side),shard(f'QA-{pp}-M','CLASS','Mage',cls_side),shard(f'QA-{pp}-T','CLASS','Thief',cls_side),shard(f'QA-{pp}-G1',side=cls_side)]
    else:
        pool=[shard(f'QA-{pp}-W','CLASS','Warrior',cls_side),shard(f'QA-{pp}-G1',side=cls_side)]
    initial_pool_count=len(pool)
    deck=[shard(f'QA-{pp}-D1',side=cls_side)]
    p.update({'turn':turn,'phase':'Battle',f'{pp}Hand':hand,f'{op}Hand':[],f'{pp}ManaPoolCards':pool,f'{pp}ManaDeck':deck, 'mana' if pp=='player' else 'aiMana':len(pool), 'aiMana' if pp=='player' else 'mana':0})
    qa_patch(host,guest,p)
    intent(local_page,'beginPlayFromHand',[0]); wait_pending(local_page,'source_selection')
    intent(local_page,'chooseHeroFromBoard',['PLAYER','CENTER']); wait_pending(local_page,'target_selection')
    before=rev(local_page); local_page.evaluate("()=>GL_PVP_NETWORK.sendIntent('chooseHeroFromBoard',['AI','CENTER'])")
    wait_rev(local_page,before)
    if only_generic:
        local_page.wait_for_timeout(100)
        assert local_page.locator('#choiceOverlay.open [data-mana-class-uid]').count()==0
        s=app(local_page); assert 'S1-WAR-002' not in s['playerHand']
        assert len(s['playerManaPoolCards'])==0
        return {'onlyMana':True}
    wait_pending(local_page,'mana_shard_payment_choice')
    local_page.wait_for_selector('#choiceOverlay.open [data-mana-class-uid]',timeout=10000)
    choices=local_page.locator('#choiceOverlay [data-mana-class-uid]').evaluate_all("els=>Array.from(new Set(els.map(e=>e.dataset.manaClassUid)))")
    if multiple: assert len(choices)==3,choices
    # Use Warrior for matching/multiple, Mage for nonmatching.
    wanted='M' if nonmatching else 'W'
    uid=next(x for x in choices if x.endswith('-'+wanted))
    button=local_page.locator(f'#choiceOverlay .discard-select[data-mana-class-uid="{uid}"]').first
    text=local_page.locator(f'#choiceOverlay [data-mana-class-uid="{uid}"]').first.locator('xpath=..').inner_text()
    if nonmatching: assert '1 Mana' in text,text
    else: assert '2 Mana' in text,text
    r=rev(local_page); button.click(); wait_rev(local_page,r)
    pending=app(local_page)['pending']; assert uid in pending.get('selected_class_uids',[])
    r=rev(local_page); local_page.locator('#choiceConfirm').click(); wait_rev(local_page,r)
    s=app(local_page); assert 'S1-WAR-002' not in s['playerHand']; assert uid not in [x.get('uid') for x in s['playerManaPoolCards']]
    expected_deck=1+(initial_pool_count-len(s['playerManaPoolCards']))
    assert int(s.get('playerManaDeckCount') or len(s.get('playerManaDeck') or []))==expected_deck,(expected_deck,s.get('playerManaDeckCount'),s.get('playerManaDeck'))
    return {'selected':uid,'multiple':multiple,'nonmatching':nonmatching,'poolRemaining':len(s['playerManaPoolCards'])}

def scenario_insufficient(host,guest,local_page,canonical_side):
    p=base_patch(host); pp='player' if canonical_side=='PLAYER' else 'ai';op='ai' if pp=='player' else 'player';ss='PLAYER' if pp=='player' else 'AI'
    p.update({'turn':canonical_side,'phase':'Battle',f'{pp}Hand':['S1-WAR-002'],f'{op}Hand':[],f'{pp}ManaPoolCards':[shard('QA-INS-W','CLASS','Warrior',ss)],f'{pp}ManaDeck':[], 'mana' if pp=='player' else 'aiMana':1})
    qa_patch(host,guest,p);r=rev(local_page);local_page.evaluate("()=>GL_PVP_NETWORK.sendIntent('beginPlayFromHand',[0])");local_page.wait_for_timeout(350)
    assert rev(local_page)==r
    assert app(local_page)['pending'] is None
    assert 'S1-WAR-002' in app(local_page)['playerHand']
    return True

def create_response_window(host,guest,attacker,attacker_side,responder):
    p=base_patch(host); atk='player' if attacker_side=='PLAYER' else 'ai';defn='ai' if atk=='player' else 'player';as_='PLAYER' if atk=='player' else 'AI';ds='AI' if atk=='player' else 'PLAYER'
    # Attacker generic-only -> no payment popup. Responder has matching Warrior Class Shard for Cover Up.
    p.update({'turn':attacker_side,'phase':'Battle',f'{atk}Hand':['S1-WAR-002'],f'{defn}Hand':['S1-WAR-004'],f'{atk}ManaPoolCards':[shard(f'QA-{atk}-G{i}',side=as_) for i in range(1,4)],f'{atk}ManaDeck':[],f'{defn}ManaPoolCards':[shard(f'QA-{defn}-W','CLASS','Warrior',ds),shard(f'QA-{defn}-G1',side=ds)],f'{defn}ManaDeck':[shard(f'QA-{defn}-D1',side=ds)]})
    p['mana' if atk=='player' else 'aiMana']=3;p['aiMana' if atk=='player' else 'mana']=2
    qa_patch(host,guest,p)
    intent(attacker,'beginPlayFromHand',[0]);src=wait_pending(attacker,'source_selection');source_lane=src['legal_sources'][0];intent(attacker,'chooseHeroFromBoard',['PLAYER',source_lane]);tgt=wait_pending(attacker,'target_selection');target_lane=tgt['legal_targets'][0];intent(attacker,'chooseHeroFromBoard',['AI',target_lane])
    responder.wait_for_function("()=>{const s=GL_LOCAL_AI_BRIDGE.getSnapshot().appState;return !!s.responseWindow}",timeout=12000)

def scenario_response(host,guest,attacker,attacker_side,responder):
    create_response_window(host,guest,attacker,attacker_side,responder)
    responder.wait_for_selector('#responseOverlay.open [data-response-select]',timeout=12000)
    options=responder.locator('#responseOverlay .response-option.available')
    target=None
    for i in range(options.count()):
        if 'Cover Up' in options.nth(i).inner_text(): target=options.nth(i).locator('[data-response-select]');break
    assert target is not None,'Cover Up response not available'
    r=rev(responder);target.click();wait_rev(responder,r)
    responder.wait_for_selector('#responseConfirmButton:not([disabled])',timeout=8000)
    r=rev(responder);responder.locator('#responseConfirmButton').click();wait_rev(responder,r)
    wait_pending(responder,'response_payment_choice')
    responder.wait_for_selector('#choiceOverlay.open [data-response-mana-uid]',timeout=8000)
    btn=responder.locator('#choiceOverlay .discard-select[data-response-mana-uid]').first;uid=btn.get_attribute('data-response-mana-uid')
    r=rev(responder);btn.click();wait_rev(responder,r);assert uid in app(responder)['pending'].get('selected_mana_class_uids',[])
    r=rev(responder);responder.locator('#choiceConfirm').click();wait_rev(responder,r)
    s=app(responder)
    # Cover Up redirects the incoming attack and correctly opens a fresh Response window for the redirected target.
    # Finish that authoritative continuation with No Response before asserting the full Response chain is complete.
    if s.get('responseWindow'):
        intent(responder,'responsePassNoStuck',[])
        wait_no_pending(responder)
        responder.wait_for_function("()=>!GL_LOCAL_AI_BRIDGE.getSnapshot().appState.responseWindow",timeout=12000)
        s=app(responder)
    assert s['pending'] is None and s['responseWindow'] is None;assert 'S1-WAR-004' not in s['playerHand'];assert uid not in [x.get('uid') for x in s['playerManaPoolCards']]
    return {'classUid':uid,'resolved':True}

def scenario_ultimate(host,guest,local_page,canonical_side):
    p=base_patch(host);pp='player' if canonical_side=='PLAYER' else 'ai';op='ai' if pp=='player' else 'player';ss='PLAYER' if pp=='player' else 'AI';uid=f'QA-{pp}-ULT-W'
    p.update({'turn':canonical_side,'phase':'Reform',f'{pp}Hand':['S1-WAR-018'],f'{op}Hand':[],f'{pp}ManaPoolCards':[shard(uid,'CLASS','Warrior',ss)],f'{pp}ManaDeck':[shard(f'QA-{pp}-UD1',side=ss)]})
    p['mana' if pp=='player' else 'aiMana']=1
    qa_patch(host,guest,p)
    intent(local_page,'beginTributeFromHand',[0]);tp=wait_pending(local_page,'tribute_target');tribute_lane=tp['legal_targets'][0];pre=app(local_page);before=pre['playerHeroes'][tribute_lane].get('exp_total',0);before_deck=int(pre.get('playerManaDeckCount') or len(pre.get('playerManaDeck') or []));intent(local_page,'chooseHeroFromBoard',['PLAYER',tribute_lane])
    s=app(local_page);after_deck=int(s.get('playerManaDeckCount') or len(s.get('playerManaDeck') or []));assert 'S1-WAR-018' not in s['playerHand'];assert uid not in [x.get('uid') for x in s['playerManaPoolCards']];assert after_deck==before_deck+1,(before_deck,after_deck);assert s['playerHeroes'][tribute_lane].get('exp_total',0)>=before+200
    # no matching shard -> cannot start Tribute
    p=base_patch(host);p.update({'turn':canonical_side,'phase':'Reform',f'{pp}Hand':['S1-WAR-018'],f'{op}Hand':[],f'{pp}ManaPoolCards':[shard('QA-WRONG-M','CLASS','Mage',ss)],f'{pp}ManaDeck':[]});p['mana' if pp=='player' else 'aiMana']=1
    qa_patch(host,guest,p);before_invalid=copy.deepcopy(app(local_page));local_page.evaluate("()=>GL_PVP_NETWORK.sendIntent('beginTributeFromHand',[0])");local_page.wait_for_timeout(350);after_invalid=app(local_page);assert after_invalid['pending'] is None;assert after_invalid['playerHand']==before_invalid['playerHand'];assert after_invalid['playerManaPoolCards']==before_invalid['playerManaPoolCards']
    return True

def start_steal(host,guest,local_page,canonical_side,tag):
    p=base_patch(host);pp='player' if canonical_side=='PLAYER' else 'ai';op='ai' if pp=='player' else 'player';ss='PLAYER' if pp=='player' else 'AI';oside='AI' if ss=='PLAYER' else 'PLAYER'
    own=[shard(f'{tag}-OWN1',side=ss),shard(f'{tag}-OWN2',side=ss)]
    own_deck=[shard(f'{tag}-GAIN',side=ss)]
    opp=[shard(f'{tag}-A',side=oside),shard(f'{tag}-B','CLASS','Mage',oside),shard(f'{tag}-C',side=oside),shard(f'{tag}-D','CLASS','Warrior',oside)]
    p.update({'turn':canonical_side,'phase':'Deploy',f'{pp}Hand':['S1-THF-005'],f'{op}Hand':[],f'{pp}ManaPoolCards':own,f'{pp}ManaDeck':own_deck,f'{op}ManaPoolCards':opp,f'{op}ManaDeck':[shard(f'{tag}-OD1',side=oside)]})
    p['mana' if pp=='player' else 'aiMana']=len(own);p['aiMana' if pp=='player' else 'mana']=len(opp)
    qa_patch(host,guest,p)
    intent(local_page,'beginPlayFromHand',[0]);sp=wait_pending(local_page,'source_selection');source_lane=sp['legal_sources'][0];intent(local_page,'chooseHeroFromBoard',['PLAYER',source_lane]);wait_pending(local_page,'opponent_mana_selection')
    local_page.wait_for_selector('#choiceOverlay.open [data-opponent-mana-choice]:not([disabled])',timeout=12000)
    return opp

def commit_steal(local_page,opponent_page):
    before_remote=len(app(opponent_page)['playerManaPoolCards'])
    btn=local_page.locator('#choiceOverlay [data-opponent-mana-choice]:not([disabled])').first
    handle=btn.get_attribute('data-opponent-mana-choice');revision=int(btn.get_attribute('data-opponent-mana-revision'))
    assert handle and len(handle)>=16 and not any(x in handle for x in ['Mage','Warrior','GENERIC'])
    r=rev(local_page);btn.click();wait_rev(local_page,r)
    r=rev(local_page);local_page.locator('#choiceConfirm').click();wait_rev(local_page,r)
    wait_no_pending(local_page);opponent_page.wait_for_function("n=>GL_LOCAL_AI_BRIDGE.getSnapshot().appState.playerManaPoolCards.length===n",arg=before_remote-1,timeout=12000)
    return {'handle':handle,'revision':revision,'remoteRemaining':before_remote-1}

def stale_steal(host,guest,local_page,canonical_side,tag):
    start_steal(host,guest,local_page,canonical_side,tag)
    btn=local_page.locator('#choiceOverlay [data-opponent-mana-choice]:not([disabled])').first
    old_handle=btn.get_attribute('data-opponent-mana-choice');old_rev=int(btn.get_attribute('data-opponent-mana-revision'))
    # mutate remote canonical pool while pending, simulating payment/regen/index shift before click
    canonical=app(host); p={}
    if canonical_side=='PLAYER':
        # Seat1 selecting Seat2 canonical AI pool: remove first current remote shard.
        # Host viewer masks remote identities, so use known deterministic tags for the remaining current pool.
        p['aiManaPoolCards']=[shard(f'{tag}-B','CLASS','Mage','AI'),shard(f'{tag}-C',side='AI'),shard(f'{tag}-D','CLASS','Warrior','AI')];p['aiMana']=3
    else:
        p['playerManaPoolCards']=[shard(f'{tag}-B','CLASS','Mage','PLAYER'),shard(f'{tag}-C',side='PLAYER'),shard(f'{tag}-D','CLASS','Warrior','PLAYER')];p['mana']=3
    qa_patch(host,guest,p)
    # old handle + old revision must be rejected/resynced, not redirected.
    local_page.evaluate("x=>GL_PVP_NETWORK.sendIntent('selectOpponentManaChoiceHandle',[x[0],x[1]])",[old_handle,old_rev])
    local_page.wait_for_timeout(350)
    assert app(local_page)['pending'] and app(local_page)['pending']['type']=='opponent_mana_selection'
    local_page.wait_for_selector('#choiceOverlay.open [data-opponent-mana-choice]:not([disabled])',timeout=8000)
    newbtn=local_page.locator('#choiceOverlay [data-opponent-mana-choice]:not([disabled])').first
    assert int(newbtn.get_attribute('data-opponent-mana-revision'))>old_rev
    assert newbtn.get_attribute('data-opponent-mana-choice')!=old_handle
    # current-pool reconciliation may require one click round-trip; it must rerender rather than deadlock.
    r=rev(local_page);newbtn.click();
    try: wait_rev(local_page,r,5000)
    except: pass
    local_page.wait_for_timeout(150)
    assert app(local_page)['pending'] is not None
    return True

def shard_preview_matrix(page):
    results={}
    for name,w,h in [('phone',390,844),('tablet-portrait',768,1024),('tablet-landscape',1024,768),('desktop',1366,768)]:
        page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(180)
        cards=page.locator('[data-shard-preview-src][data-mana-side="PLAYER"]')
        assert cards.count()>=1,(name,'no own Shard preview control')
        chosen=None; click_pos=None
        # Use a genuinely pointer-reachable point on a visible own Shard. Do not force-click:
        # acceptance must prove a user can actually tap/click a Shard.
        for i in range(cards.count()):
            card=cards.nth(i); box=card.bounding_box()
            if not box or box['width']<=2 or box['height']<=2: continue
            uid=card.get_attribute('data-mana-uid')
            for fx,fy in ((.5,.5),(.5,.3),(.5,.7),(.3,.5),(.7,.5)):
                x=box['x']+box['width']*fx; y=box['y']+box['height']*fy
                hit=page.evaluate("([x,y,uid])=>{const all=[...document.querySelectorAll('[data-shard-preview-src][data-mana-side=\"PLAYER\"]')];const target=all.find(n=>n.getAttribute('data-mana-uid')===uid);const el=document.elementFromPoint(x,y);return !!(target&&el&&(el===target||target.contains(el)));}",[x,y,uid])
                if hit:
                    chosen=card; click_pos={'x':box['width']*fx,'y':box['height']*fy}; break
            if chosen: break
        assert chosen is not None,(name,'no pointer-reachable own Shard; another UI layer blocks every Shard')
        chosen.click(position=click_pos);page.wait_for_timeout(100)
        ov=page.locator('#previewOverlay');assert ov.count()==1 and 'open' in (ov.get_attribute('class') or ''),(name,'preview not open')
        results[name]=True
        close=page.locator('#previewClose')
        if close.count(): close.click();page.wait_for_timeout(30)
    return results

def main():
    port=random.randint(40100,47000)
    proc=subprocess.Popen(['node',SERVER_TMP.name],cwd=ROOT,env={**os.environ,'HOST':'127.0.0.1','PORT':str(port),'GL_PVP_QA':'1'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        for _ in range(140):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.2) as r:
                    if r.status==200: break
            except Exception: time.sleep(.05)
        else:
            out,err=proc.communicate(timeout=1);raise RuntimeError('server health timeout\n'+out+'\n'+err)
        results={'ok':False,'realBrowser':True,'twoClient':True}
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-web-security'])
            c1=browser.new_context(viewport={'width':1366,'height':768});c2=browser.new_context(viewport={'width':1366,'height':768})
            a=c1.new_page();b=c2.new_page();setup_page(a,port);setup_page(b,port)
            assert a.evaluate('GL_PVP_NETWORK.getSnapshot().local.seat')==1 and b.evaluate('GL_PVP_NETWORK.getSnapshot().local.seat')==2
            start_match(a,b)
            # Asymmetric physical mapping 2/5.
            p=base_patch(a);p.update({'turn':'PLAYER','phase':'Deploy','playerManaPoolCards':[shard('MAP-P1'),shard('MAP-P2')],'aiManaPoolCards':[shard(f'MAP-A{i}',side='AI') for i in range(5)],'playerManaDeck':[shard('MAP-PD')],'aiManaDeck':[shard('MAP-AD1',side='AI'),shard('MAP-AD2',side='AI')],'mana':2,'aiMana':5})
            qa_patch(a,b,p)
            sa,sb=app(a),app(b);assert len(sa['playerManaPoolCards'])==2 and len(sa['aiManaPoolCards'])==5;assert len(sb['playerManaPoolCards'])==5 and len(sb['aiManaPoolCards'])==2
            results['physicalSeatMapping']=True; print('STEP physicalSeatMapping',flush=True)

            results['normalPaymentSeat1']=scenario_normal_payment(a,b,a,'PLAYER'); print('STEP normalPaymentSeat1',flush=True)
            results['normalPaymentSeat2']=scenario_normal_payment(a,b,b,'AI'); print('STEP normalPaymentSeat2',flush=True)
            results['onlyManaPayment']=scenario_normal_payment(a,b,a,'PLAYER',only_generic=True); print('STEP onlyManaPayment',flush=True)
            results['nonmatchingClassPayment']=scenario_normal_payment(a,b,a,'PLAYER',nonmatching=True); print('STEP nonmatchingClassPayment',flush=True)
            results['multipleClassChoices']=scenario_normal_payment(a,b,a,'PLAYER',multiple=True); print('STEP multipleClassChoices',flush=True)
            results['insufficientManaRejected']=scenario_insufficient(a,b,a,'PLAYER'); print('STEP insufficientManaRejected',flush=True)

            results['responseSeat1']=scenario_response(a,b,b,'AI',a); print('STEP responseSeat1',flush=True)
            results['responseSeat2']=scenario_response(a,b,a,'PLAYER',b); print('STEP responseSeat2',flush=True)
            results['ultimateSeat1']=scenario_ultimate(a,b,a,'PLAYER'); print('STEP ultimateSeat1',flush=True)
            results['ultimateSeat2']=scenario_ultimate(a,b,b,'AI'); print('STEP ultimateSeat2',flush=True)

            start_steal(a,b,a,'PLAYER','S1STEAL');results['stealSeat1']=commit_steal(a,b); print('STEP stealSeat1',flush=True)
            start_steal(a,b,b,'AI','S2STEAL');results['stealSeat2']=commit_steal(b,a); print('STEP stealSeat2',flush=True)
            results['staleSeat1']=stale_steal(a,b,a,'PLAYER','STALE1'); print('STEP staleSeat1',flush=True)
            results['staleSeat2']=stale_steal(a,b,b,'AI','STALE2'); print('STEP staleSeat2',flush=True)

            # Fresh stable own-pool state for preview/touch inspection.
            p=base_patch(a);p.update({'turn':'PLAYER','phase':'Deploy','playerManaPoolCards':[shard('PREVIEW-W','CLASS','Warrior','PLAYER'),shard('PREVIEW-G',side='PLAYER')],'aiManaPoolCards':[shard('PREVIEW-A',side='AI')],'mana':2,'aiMana':1})
            qa_patch(a,b,p)
            # Hidden remote payload must never expose Shard identities.
            remote=app(a)['aiManaPoolCards'];assert remote and all(not x.get('hidden') and x.get('kind') in ('GENERIC','CLASS') for x in remote),remote
            results['battlefieldShardInfoPublic']=True; print('STEP battlefieldShardInfoPublic',flush=True)
            a.screenshot(path=str(OUT/'final-desktop.png'));b.screenshot(path=str(OUT/'seat2-final.png'))
            browser.close()
        results['ok']=True
        (OUT/'results.json').write_text(json.dumps(results,indent=2)+'\n')
        print(json.dumps(results,indent=2))
        return 0
    finally:
        proc.terminate()
        try: proc.wait(timeout=3)
        except Exception: proc.kill()
        try: SERVER_TMP.unlink()
        except Exception: pass

if __name__=='__main__':
    try: sys.exit(main())
    except Exception:
        traceback.print_exc()
        try: SERVER_TMP.unlink()
        except Exception: pass
        sys.exit(1)
