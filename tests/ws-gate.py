"""PvP S0 integration contract over real RFC6455 WebSockets (QA-only dependency)."""
import json, os, random, subprocess, time, urllib.request
from pathlib import Path
import websocket
ROOT=Path(__file__).resolve().parents[1]
PORT=random.randint(36000,42000)
BASE=f'http://127.0.0.1:{PORT}'
p=subprocess.Popen(['node','server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT)},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
  for _ in range(100):
    try:
      meta=json.load(urllib.request.urlopen(BASE+'/health',timeout=.6));break
    except Exception: time.sleep(.08)
  else: raise AssertionError('Server did not start')
  assert meta['architecture']=='s1-v38017-lobby__s0-rc32-coin-and-battle'
  build=meta['buildId']
  lobby=(ROOT/'public/pvp/pvp-host.js').read_text()
  s0ui=(ROOT/'public/battle/shared-app/app-runtime.js').read_text()
  transport=(ROOT/'public/battle/runtime/pvp-network.js').read_text()
  assert "['coin-flip','coin-result','started','finished'].includes(msg?.match?.status)" in lobby
  assert 'GL_S0_RC32_PVP_COIN={showChoice:s0PvpCoinChoice,showResult:s0PvpCoinResult,release:s0PvpCoinRelease}' in s0ui
  assert 'coin?.showChoice' in transport and 'coin?.showResult' in transport
  assert all(t not in lobby for t in ['SEASON 0 · OPENING','Preparing the Season 0 battlefield','function showS0Opening'])
  clients=[]
  def conn(id,role='player',seatToken=''):
    suffix=f'&seatToken={seatToken}' if seatToken else ''
    ws=websocket.create_connection(f'ws://127.0.0.1:{PORT}/ws?client={id}&name={id}&role={role}&buildId={build}{suffix}',timeout=5)
    clients.append(ws);return ws
  def send(ws,type,**kw):ws.send(json.dumps(dict(type=type,clientBuildId=build,**kw)))
  def until(ws,pred,where):
    end=time.monotonic()+12
    while time.monotonic()<end:
      try:d=json.loads(ws.recv())
      except websocket.WebSocketTimeoutException:continue
      if d['type']=='error':
        if pred(d):return d
        raise AssertionError(f'{where}: {d.get("message")}')
      if pred(d):return d
    raise AssertionError(f'Timeout at {where}')
  a=conn('test-p1');b=conn('test-p2');
  until(a,lambda d:d['type']=='snapshot','connect p1');until(b,lambda d:d['type']=='snapshot','connect p2')
  for ws,key,label in [(a,'s0_starter_01_red_white','p1-deck'),(b,'s0_starter_02_blue_red','p2-deck')]:
    send(ws,'set-deck',deckKey=key)
    until(ws,lambda d:d['type']=='snapshot' and d.get('local',{}).get('deckKey')==key,label)
  for ws,label in [(a,'p1-ready'),(b,'p2-ready')]:
    send(ws,'ready',ready=True)
    until(ws,lambda d:d['type']=='snapshot' and d.get('local',{}).get('ready')==True,label)
  send(a,'start-match')
  for ws,label in [(a,'p1-flip'),(b,'p2-flip')]:
    d=until(ws,lambda d:d['type']=='snapshot' and d['match']['status']=='coin-flip',label)
    assert d['match']['chooserSeat']==2 and d['match']['board'] is None
  send(b,'choose-coin-flip',choice='TAILS')
  for ws,label in [(a,'p1-result'),(b,'p2-result')]:
    d=until(ws,lambda d:d['type']=='snapshot' and d['match']['status']=='coin-result',label)
    assert d['match']['board'] is None
  send(a,'coin-presented');send(b,'coin-presented')
  for ws,label in [(a,'p1-ack'),(b,'p2-ack')]:until(ws,lambda d:d['type']=='snapshot' and d['match']['canStartOpening'],label)
  send(a,'confirm-coin-flip')
  for ws,label in [(a,'p1-start'),(b,'p2-start')]:
    d=until(ws,lambda d:d['type']=='snapshot' and d['match']['status']=='started',label)
    s=d['match']['board']['appState']
    assert s['openingFlowCompleted'] and len(s['playerHand'])>=6 and len(s['playerManaPoolCards'])>=3
    assert all(s['playerHeroes'][pos]['card_id'].startswith('S0-') for pos in ['LEFT','CENTER','RIGHT'])
    assert all(x=='__HIDDEN_CARD_BACK__' for x in s['aiHand'])
  for ws in clients:
    try:ws.close()
    except Exception:pass
  print(json.dumps({'ok':True,'S1Pregame':'Lobby through START MATCH','S0Begins':'coin-flip','RC32CoinOverlaySource':True,'serverAuthoritativeCoin':True,'bothSeatsStarted':True,'S0HeroesHandMana':True,'opponentHandMasked':True},indent=2))
finally:
  p.terminate()
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:p.kill()
