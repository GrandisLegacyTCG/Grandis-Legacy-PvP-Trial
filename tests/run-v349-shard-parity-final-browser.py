#!/usr/bin/env python3
from pathlib import Path
from playwright.sync_api import sync_playwright
import importlib.util, json, mimetypes, os, random, subprocess, sys, time, traceback, urllib.request

ROOT=Path(__file__).resolve().parents[1]
PART1_PATH=ROOT/'tests/run-v349-shard-parity-browser.py'
spec=importlib.util.spec_from_file_location('v349_part1',PART1_PATH)
p1=importlib.util.module_from_spec(spec); spec.loader.exec_module(p1)
FIXTURES=ROOT/'tests/fixtures/v349-artwork'
OUT=ROOT/'tests/artifacts/v349-shard-parity-final'
OUT.mkdir(parents=True,exist_ok=True)

MAIN_BACK='Back-of-Card-Main-Deck.webp'
SHARD_BACK='Back-of-Card-Legacy-Deck.webp'

def shared_asset_route(route):
    url=route.request.url
    marker='https://grandislegacytcg.github.io/'
    if marker not in url:
        route.continue_(); return
    rel=url.split(marker,1)[1].split('?',1)[0]
    name=Path(rel).name
    f=FIXTURES/name if name in (MAIN_BACK,SHARD_BACK) else None
    if f and f.is_file():
        route.fulfill(status=200,content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream',body=f.read_bytes())
    else:
        route.abort()

def setup(page,port,w=1366,h=768):
    page.route('https://grandislegacytcg.github.io/**',shared_asset_route)
    p1.setup_page(page,port,w,h)
    page.evaluate("""()=>{
      window.__v349Flights=[]; window.__v349Timing={};
      const recordNode=(node,action)=>{if(node&&node.nodeType===1&&node.classList&&node.classList.contains('gl-flying-card'))window.__v349Flights.push({t:performance.now(),action,src:node.src||'',id:node.dataset.animationId||''});};
      const obs=new MutationObserver(ms=>{for(const m of ms){for(const n of m.addedNodes)recordNode(n,'add');for(const n of m.removedNodes)recordNode(n,'remove');}});
      obs.observe(document.body,{childList:true,subtree:true}); window.__v349FlightObserver=obs;
      const b=window.GL_LOCAL_AI_BRIDGE;
      if(b&&!b.__v349TelemetryWrapped){
        b.__v349TelemetryWrapped=true;
        const od=b.queueAuthoritativeDrawThenShardMotions;
        if(od)b.queueAuthoritativeDrawThenShardMotions=function(draw,shards){window.__v349Timing.t0=performance.now();window.__v349Timing.drawSpecs=JSON.parse(JSON.stringify(draw||[]));window.__v349Timing.shardEntries=JSON.parse(JSON.stringify(shards||[]));return od.apply(this,arguments);};
        const oo=b.queueAuthoritativeOpeningSequence;
        if(oo)b.queueAuthoritativeOpeningSequence=function(a,s,d,p){window.__v349Timing.openingT0=performance.now();window.__v349Timing.openingCounts={openingDraws:(a||[]).length,startingShards:(s||[]).length,postDraws:(d||[]).length,postShards:(p||[]).length};return oo.apply(this,arguments);};
        const os=b.queueAuthoritativeShardGainMotions;
        if(os)b.queueAuthoritativeShardGainMotions=function(entries){window.__v349Timing.lastShardGainT0=performance.now();window.__v349Timing.lastShardEntries=JSON.parse(JSON.stringify(entries||[]));return os.apply(this,arguments);};
      }
      const old=window.GL_PVP_NOTIFY_DRAW_COMPLETE;
      window.GL_PVP_NOTIFY_DRAW_COMPLETE=function(){window.__v349Timing.t4=performance.now();window.__v349Timing.drawCompleteIndex=arguments[0];if(typeof old==='function')return old.apply(this,arguments);};
    }""")

def reset_telemetry(page):
    page.evaluate("()=>{window.__v349Flights=[];window.__v349Timing={};}")

def wait_idle(page,timeout=15000):
    elapsed=0
    while elapsed<timeout:
        if page.locator('.gl-flying-card').count()==0:
            page.wait_for_timeout(120)
            if page.locator('.gl-flying-card').count()==0:return
        page.wait_for_timeout(80);elapsed+=80
    raise AssertionError('animation queue did not visually settle')

def flights(page,kind='add'):
    return page.evaluate("k=>window.__v349Flights.filter(x=>x.action===k)",kind)

def classify(entries):
    return ['main' if MAIN_BACK in e['src'] else ('shard' if SHARD_BACK in e['src'] else 'other') for e in entries]

def draw_patch(host,regen=1,pool_count=4,deck_count=8,tag='DRAW'):
    s=p1.base_patch(host)
    pool=[p1.shard(f'{tag}-P{i}',side='PLAYER') for i in range(pool_count)]
    mana_deck=[p1.shard(f'{tag}-D{i}',side='PLAYER') for i in range(deck_count)]
    # canonical Main Deck IDs only need to be valid runtime cards for mandatory draw
    main=['S1-WAR-001','S1-WAR-002','S1-WAR-003','S1-WAR-004','S1-WAR-005']
    s.update({'turn':'PLAYER','phase':'Draw','drawPhaseResolvedFor':None,'pvpTurnReady':False,
              'playerHand':[],'playerDeck':main,'playerManaPoolCards':pool,'playerManaDeck':mana_deck,
              'manaRegen':regen,'mana':len(pool),'cardsDrawnThisTurn':{'PLAYER':1,'AI':1}})
    return s

def run_draw(page_host,page_guest,viewport,regen,pool_count,deck_count,tag):
    w,h=viewport
    page_host.set_viewport_size({'width':w,'height':h}); page_guest.set_viewport_size({'width':w,'height':h})
    page_host.wait_for_timeout(180); page_guest.wait_for_timeout(180); wait_idle(page_host);wait_idle(page_guest)
    p1.qa_patch(page_host,page_guest,draw_patch(page_host,regen,pool_count,deck_count,tag))
    reset_telemetry(page_host); reset_telemetry(page_guest)
    before=p1.app(page_host); before_hand=len(before['playerHand']);before_pool=len(before['playerManaPoolCards']);before_deck=len(before['playerManaDeck'])
    p1.intent(page_host,'advancePhase',[])
    page_host.wait_for_function("()=>window.__v349Timing&&Number.isFinite(window.__v349Timing.t4)",timeout=12000)
    wait_idle(page_host,20000); wait_idle(page_guest,20000)
    after=p1.app(page_host)
    expected_gain=min(regen,max(0,12-before_pool),before_deck)
    assert len(after['playerHand'])==before_hand+1,(before_hand,len(after['playerHand']))
    assert len(after['playerManaPoolCards'])==before_pool+expected_gain,(before_pool,expected_gain,len(after['playerManaPoolCards']))
    adds=flights(page_host)
    kinds=classify(adds)
    assert kinds.count('main')==1,(tag,kinds)
    assert kinds.count('shard')==expected_gain,(tag,kinds)
    tm=page_host.evaluate('window.__v349Timing')
    main_add=next(x for x in adds if MAIN_BACK in x['src'])
    rems=page_host.evaluate('window.__v349Flights.filter(x=>x.action===\'remove\')')
    main_remove=next((x for x in rems if x['id']==main_add['id']),None)
    assert main_remove,(tag,'main draw removal missing')
    t0=float(tm['t0']);t2=float(main_add['t']);t3=float(main_remove['t']);t4=float(tm['t4'])
    metrics={'T0_T2':round(t2-t0,1),'T2_T3':round(t3-t2,1),'T3_T4':round(max(0,t4-t3),1),'T0_T4':round(t4-t0,1)}
    return {'viewport':f'{w}x{h}','regen':regen,'canonicalGain':expected_gain,'flightKinds':kinds,'metrics':metrics,
            'event':page_host.evaluate('GL_PVP_NETWORK.getSnapshot().match.lastAnimationEvents')}

def main():
    port=random.randint(41000,47999)
    proc=subprocess.Popen(['node',p1.SERVER_TMP.name],cwd=p1.ROOT,env={**os.environ,'HOST':'127.0.0.1','PORT':str(port),'GL_PVP_QA':'1'},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    try:
        for _ in range(160):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.2) as r:
                    if r.status==200:break
            except Exception:time.sleep(.05)
        else:
            out,err=proc.communicate(timeout=1);raise RuntimeError('server health timeout\n'+out+'\n'+err)
        result={'ok':False,'realBrowser':True,'twoClientServer':True,'sharedAssets':'packaged canonical card-back fixtures'}
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-web-security'])
            c1=browser.new_context(viewport={'width':1366,'height':768});c2=browser.new_context(viewport={'width':1366,'height':768})
            a=c1.new_page();b=c2.new_page();setup(a,port);setup(b,port)
            assert a.evaluate('GL_PVP_NETWORK.getSnapshot().local.seat')==1 and b.evaluate('GL_PVP_NETWORK.getSnapshot().local.seat')==2
            reset_telemetry(a);reset_telemetry(b)
            p1.start_match(a,b)
            # The complete opening sequence includes 6+6 opening Main Deck cards, 3+3 Starting Shards,
            # then first-player mandatory draw + Regen 1.
            a.wait_for_function("()=>window.__v349Flights.filter(x=>x.action==='add').length>=20",timeout=22000)
            b.wait_for_function("()=>window.__v349Flights.filter(x=>x.action==='add').length>=20",timeout=22000)
            wait_idle(a,22000);wait_idle(b,22000)
            oa=flights(a);ob=flights(b);ka=classify(oa);kb=classify(ob)
            assert ka.count('main')==13 and ka.count('shard')==7,ka
            assert kb.count('main')==13 and kb.count('shard')==7,kb
            assert ka[:12]==['main']*12 and ka[12:18]==['shard']*6 and ka[18:]==['main','shard'],ka
            assert kb[:12]==['main']*12 and kb[12:18]==['shard']*6 and kb[18:]==['main','shard'],kb
            ca=p1.app(a);cb=p1.app(b)
            assert sorted([len(ca['playerManaPoolCards']),len(ca['aiManaPoolCards'])])==[3,4]
            assert sorted([len(cb['playerManaPoolCards']),len(cb['aiManaPoolCards'])])==[3,4]
            result['opening']={'seat1Kinds':ka,'seat2Kinds':kb,'seat1Pools':[len(ca['playerManaPoolCards']),len(ca['aiManaPoolCards'])],'seat2Pools':[len(cb['playerManaPoolCards']),len(cb['aiManaPoolCards'])]}

            # Main Deck timing authority comparison using actual authoritative Draw Phase mutations.
            timings={}
            for name,vp in [('desktop',(1366,768)),('tablet-landscape',(1024,768)),('tablet-portrait',(768,1024)),('phone',(390,844))]:
                run=run_draw(a,b,vp,1,4,8,'TIM-'+name)
                timings[name]=run['metrics']
            desktop=timings['desktop']['T0_T2']
            for name in ('tablet-landscape','tablet-portrait','phone'):
                # No unexplained hundreds-of-ms mobile-only pre-flight delay.
                assert timings[name]['T0_T2'] <= desktop+180,(name,timings[name],timings['desktop'])
            result['mainDeckTiming']=timings

            # Regen multiple and pool-cap are semantic Shard-gain transitions from the real server.
            multi=run_draw(a,b,(1366,768),3,7,5,'REGEN3')
            assert multi['canonicalGain']==3 and multi['flightKinds'].count('shard')==3
            cap=run_draw(a,b,(1366,768),3,11,5,'CAP')
            assert cap['canonicalGain']==1 and cap['flightKinds'].count('shard')==1
            result['regenMultiple']=multi;result['poolCap']=cap

            # Real Season 1 opponent-Shard effect also gains one own Shard. Confirm a semantic Shard flight.
            a.set_viewport_size({'width':1366,'height':768});b.set_viewport_size({'width':1366,'height':768})
            wait_idle(a);wait_idle(b);reset_telemetry(a);reset_telemetry(b)
            p1.start_steal(a,b,a,'PLAYER','FINALGAIN1');before=len(p1.app(a)['playerManaPoolCards']);p1.commit_steal(a,b);wait_idle(a,15000);wait_idle(b,15000)
            after=len(p1.app(a)['playerManaPoolCards']);gain_kinds=classify(flights(a));
            assert after==before+1,(before,after);assert gain_kinds.count('shard')==1,gain_kinds
            result['effectBasedGainSeat1']={'before':before,'after':after,'flightKinds':gain_kinds}
            reset_telemetry(a);reset_telemetry(b)
            p1.start_steal(a,b,b,'AI','FINALGAIN2');before2=len(p1.app(b)['playerManaPoolCards']);p1.commit_steal(b,a);wait_idle(a,15000);wait_idle(b,15000)
            after2=len(p1.app(b)['playerManaPoolCards']);gain_kinds2=classify(flights(b));assert after2==before2+1;assert gain_kinds2.count('shard')==1,gain_kinds2
            result['effectBasedGainSeat2']={'before':before2,'after':after2,'flightKinds':gain_kinds2}

            # Viewer-safe state remains identity-free for the remote pool.
            remote=p1.app(a)['aiManaPoolCards'];assert remote and all(not x.get('hidden') and x.get('kind') in ('GENERIC','CLASS') for x in remote),remote
            result['battlefieldShardInfoPublic']=True
            a.screenshot(path=str(OUT/'desktop-final.png'));b.screenshot(path=str(OUT/'seat2-final.png'))
            browser.close()
        result['ok']=True
        (OUT/'results.json').write_text(json.dumps(result,indent=2)+'\n')
        print(json.dumps(result,indent=2));return 0
    finally:
        proc.terminate()
        try:proc.wait(timeout=3)
        except Exception:proc.kill()
        try:p1.SERVER_TMP.unlink()
        except Exception:pass

if __name__=='__main__':
    try:sys.exit(main())
    except Exception:
        traceback.print_exc()
        try:p1.SERVER_TMP.unlink()
        except Exception:pass
        sys.exit(1)
