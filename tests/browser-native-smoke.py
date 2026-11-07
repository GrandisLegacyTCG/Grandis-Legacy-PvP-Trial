"""Two real Chromium browsers using native HTTP and WebSocket (no test relay).

Local: python tests/browser-native-smoke.py   (starts/disposes own Node test server)
Hosted: PVP_PUBLIC_URL=https://<dedicated-staging-host> python tests/browser-native-smoke.py

Designed for GitHub Actions / Northflank staging acceptance, not a complete
three-Hero match or comprehensive coverage of RC32 card interactions.
"""
import json
import os
import pathlib
import socket
import subprocess
import time
import urllib.request
import uuid
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
REMOTE=os.environ.get('PVP_PUBLIC_URL','').strip()
server=None

def allocate_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1',0))
        return s.getsockname()[1]

def wait_for_health(base, seconds=20):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        try:
            with urllib.request.urlopen(base+'/health',timeout=2) as response:
                info=json.load(response)
                if info.get('ok') and 's0-rc32-pvp' in info.get('build',''):
                    return info
        except Exception:
            pass
        if server and server.poll() is not None:
            raise RuntimeError('Local server stopped before health check passed')
        time.sleep(.15)
    raise RuntimeError('Staging /health not reachable')

if REMOTE:
    from urllib.parse import urlsplit
    u=urlsplit(REMOTE)
    if u.scheme!='https' or not u.netloc or u.path not in ('','/') or u.query or u.fragment or u.username or u.password:
        raise RuntimeError('Hosted browser test requires a bare staging HTTPS origin in PVP_PUBLIC_URL')
    base=REMOTE.rstrip('/')
else:
    port=allocate_port()
    base=f'http://127.0.0.1:{port}'
    env={**os.environ,'PORT':str(port),'HOST':'127.0.0.1'}
    server=subprocess.Popen(['node','server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)

try:
    wait_for_health(base)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],executable_path=(os.environ.get('PVP_CHROMIUM_PATH') or ('/usr/bin/chromium' if pathlib.Path('/usr/bin/chromium').is_file() else None)))
        contexts=[];pages=[];errors=[]
        try:
            for i in range(2):
                context=browser.new_context(viewport={'width':1440,'height':900})
                page=context.new_page()
                page.on('pageerror',lambda err,i=i:errors.append((i+1,str(err))))
                page.goto(base+'/',wait_until='domcontentloaded',timeout=60000)
                page.wait_for_function('!!window.GL_S0_PVP_NETWORK && !!window.GL_GAME_UI',timeout=25000)
                contexts.append(context);pages.append(page)
            room='native_'+uuid.uuid4().hex[:12]
            for i,page in enumerate(pages):
                page.locator('#s0PvpName').fill('NativeQA'+str(i+1))
                page.locator('#s0PvpRoom').fill(room)
                page.locator('#s0PvpJoin').click()
                page.wait_for_function('(seat) => window.GL_S0_PVP_NETWORK.state.seat===seat',arg=i+1,timeout=30000)
            for page in pages:
                page.locator('#s0PvpSelect').click()
                page.locator('#s0PvpReady').wait_for(state='visible')
                page.locator('#s0PvpReady').click()
            pages[0].locator('#s0PvpStart').wait_for(state='visible')
            pages[0].wait_for_function("document.querySelector('#s0PvpStart') && !document.querySelector('#s0PvpStart').disabled",timeout=30000)
            pages[0].locator('#s0PvpStart').click()
            pages[1].locator('[data-coin="HEADS"]').click()
            for page in pages:
                page.wait_for_function("window.GL_S0_PVP_NETWORK.state.status==='playing'",timeout=30000)
                page.wait_for_function("document.querySelectorAll('.hand-card').length>=6",timeout=30000)
            snapshots=[p.evaluate('''() => {const s=window.GL_S0_PVP_NETWORK.state;return {revision:s.revision,status:s.status,privateMasked:s.snapshot?.pvpPrivateStateMasked,turn:s.snapshot?.appState?.turn,opponentHand:s.snapshot?.appState?.aiHand}}''') for p in pages]
            assert all(s['privateMasked'] is True for s in snapshots)
            assert all(len(s['opponentHand']) >= 6 for s in snapshots)
            assert all(all(x=='__HIDDEN_CARD_BACK__' for x in s['opponentHand']) for s in snapshots)
            assert snapshots[0]['revision']==snapshots[1]['revision']==2
            actor=pages[0] if snapshots[0]['turn']=='PLAYER' else pages[1]
            previous=actor.evaluate('window.GL_S0_PVP_NETWORK.state.revision')
            action=actor.evaluate("window.GL_S0_PVP_NETWORK.state.snapshot.appState.pvpTurnReady?'acknowledgePvpTurnStart':'advancePhase'")
            assert actor.evaluate('(a) => window.GL_S0_PVP_NETWORK.sendIntent(a,[])',action)['ok']
            for page in pages:
                page.wait_for_function('(revision) => window.GL_S0_PVP_NETWORK.state.revision===revision',arg=previous+1,timeout=30000)
            assert not errors, f'Chromium JS exceptions: {errors}'
            print('PASS native Chromium/HTTP/WebSocket: 2 browser contexts, lobby, select, ready, coin, 2 private views, rendered hands, synchronized authoritative gameplay action.')
            print('NOT VERIFIED by this test: complete three-Hero combat victory, every card/status, mobile/Firefox, real external Northflank if run locally.')
        finally:
            for context in contexts:
                context.close()
            browser.close()
finally:
    if server:
        server.terminate()
        try:server.wait(timeout=5)
        except subprocess.TimeoutExpired:server.kill()
