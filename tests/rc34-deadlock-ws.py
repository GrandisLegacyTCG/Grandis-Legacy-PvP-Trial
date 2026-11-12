"""PvP RC34 RC2 coin recovery, idempotency, surrender and idle ownership (real WS)."""
import json,os,random,subprocess,time,urllib.request
from pathlib import Path
import websocket

ROOT=Path(__file__).resolve().parents[1]
PORT=random.randrange(42000,47000)
env={**os.environ,'PORT':str(PORT),'IDLE_SWEEP_MS':'200',
     'COIN_ACK_GRACE_MS':'800','COIN_CHOICE_TIMEOUT_MS':'4000',
     'COIN_RESULT_TIMEOUT_MS':'4000','COIN_DISCONNECT_GRACE_MS':'1000',
     'MATCH_IDLE_MS':'1800','MATCH_DISCONNECT_GRACE_MS':'1100'}
p=subprocess.Popen(['node','server.js'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
sockets=[]
try:
 for _ in range(100):
  try: meta=json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/health',timeout=.4));break
  except Exception:time.sleep(.08)
 else:raise AssertionError('Server not ready')
 bid=meta['buildId']
 def connect(label,seat_token=''):
  ws=websocket.create_connection(f'ws://127.0.0.1:{PORT}/ws?client={label}&name={label}&role=player&buildId={bid}'+('&seatToken='+seat_token if seat_token else ''),timeout=.55)
  sockets.append(ws);return ws
 def send(ws,t,**data):ws.send(json.dumps(dict(type=t,clientBuildId=bid,**data)))
 def until(ws,check,label,timeout=6):
  limit=time.monotonic()+timeout
  while time.monotonic()<limit:
   try:v=json.loads(ws.recv())
   except websocket.WebSocketTimeoutException:continue
   if v.get('type')=='error':
    if check(v):return v
    raise AssertionError(f'{label} got error: {v.get("message")}')
   if check(v):return v
  raise AssertionError(f'Timeout: {label}')
 def start(a,b):
  for ws,deck in [(a,'s0_starter_01_red_white'),(b,'s0_starter_02_blue_red')]:
   send(ws,'set-deck',deckKey=deck);until(ws,lambda x:x['type']=='snapshot' and x['local']['deckKey']==deck,'deck')
   send(ws,'ready',ready=True);until(ws,lambda x:x['type']=='snapshot' and x['local']['ready'],'ready')
  # Stale snapshots from prior rounds may remain unread on either WebSocket.
  # Drain until a fresh, ordered PONG barrier from EACH connection, then
  # explicitly resync and confirm BOTH seats are READY at the server now.
  for ws in (a,b):
   nonce=int(time.monotonic_ns()%1000000000000)
   send(ws,'ping',clientTime=nonce)
   until(ws,lambda x:x['type']=='pong' and x.get('clientTime')==nonce,'ready-barrier')
  send(a,'resync')
  both_ready=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup' and
    len(x['players'])==2 and all(p['ready'] and p['connected'] and p['hasDeck'] for p in x['players']),'both-seats-ready')
  assert all(p['seat'] in (1,2) for p in both_ready['players'])
  send(a,'start-match');until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-flip','coin-flip')
 def start_game(a,b):
  send(b,'choose-coin-flip',choice='HEADS');result=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-result','coin-result')
  face=result['match']['outcome'];winner=result['match']['winnerSeat'];assert result['match']['firstSeat'] is None
  send(b,'choose-coin-flip',choice='HEADS');same=until(b,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-result','repeat-coin')
  assert same['match']['outcome']==face and same['match']['winnerSeat']==winner, 'Duplicate coin choice changed outcome'
  send(a,'coin-presented');until(a,lambda x:x['type']=='snapshot' and 1 in x['match']['coinPresented'],'coin-ack-p1')
  grace=until(a,lambda x:x['type']=='snapshot' and x['match']['presentationGraceOpen'],'coin-grace',timeout=5)
  assert grace['match']['firstSeat'] is None, 'Grace must not pick an order for the winner'
  send(a if winner==1 else b,'choose-turn-order',order='FIRST')
  started=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='started','game-start')
  assert started['match']['board']['appState']['phase']=='Deploy','Draw deadlock returned'
  return started

 # 1: Host can cancel from coin-flip, no server restart needed.
 a,b=connect('p1'),connect('p2');until(a,lambda x:x['type']=='snapshot','join1');join2=until(b,lambda x:x['type']=='snapshot','join2');p2_token=join2['local']['seatToken']
 start(a,b)
 send(a,'reset-room');reset=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','manual-coin-abort')
 assert not reset['local']['ready'] and reset['match']['board'] is None
 assert 'canceled' in (reset['match']['lastError'] or '').lower()

 # 2: Missing one visual ACK is recoverable, result is idempotent;
 # non-turn player can surrender despite stale revision.
 start(a,b)
 match=start_game(a,b)
 first=match['match']['firstSeat']
 conceder=b if first==1 else a
 send(conceder,'surrender-match',clientActionId='qa-remote-surrender',baseRevision=-1)
 result=until(conceder,lambda x:x['type']=='intent-result' and x['clientActionId']=='qa-remote-surrender','surrender-on-opponent-turn')
 assert result['ok'] and result['snapshot']['match']['status']=='finished', 'Surrender must bypass opponent turn and stale base revision'
 send(a,'return-to-lobby');until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','finished-return')

 # 3: Missing acknowledgement without Start eventually aborts to setup.
 start(a,b)
 send(b,'choose-coin-flip',choice='HEADS');until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-result','coin-before-timeout')
 recovered=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','coin-result-timeout',timeout=6)
 assert 'timed out' in (recovered['match']['lastError'] or '').lower()

 # 4: A disconnect at coin flip is recovered without a server restart.
 start(a,b)
 b.close()
 disc=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','coin-disconnect-abort',timeout=5)
 assert 'disconnected' in (disc['match']['lastError'] or '').lower()

 # 5: Waiting for an opponent for longer than their timeout must never
 # surrender the waiting seat. The active owner reports real user activity.
 b=connect('p2',seat_token=p2_token)
 until(b,lambda x:x['type']=='snapshot' and x['local']['seat']==2 and x['match']['status']=='setup','reconnect-after-abort')
 start(a,b)
 match=start_game(a,b)
 first=match['match']['firstSeat']
 actor=a if first==1 else b
 observer=b if first==1 else a
 for _ in range(7):
  send(actor,'activity')
  time.sleep(.38)
 send(actor,'resync')
 alive=until(actor,lambda x:x['type']=='snapshot' and x['match']['status']=='started','idle-waiting-player-not-conceded')
 assert alive['match']['status']=='started'
 # The player with the live decision then disconnects; the waiting player
 # remains in the room and wins only after the disconnect grace expires.
 actor.close()
 finished=until(observer,lambda x:x['type']=='snapshot' and x['match']['status']=='finished','active-owner-disconnect-concede',timeout=6)
 assert 'disconnected' in (finished['match']['lastError'] or '').lower(),finished['match']['lastError']
 print(json.dumps({'ok':True,'manualCoinAbort':True,'coinOutcomeIdempotent':True,
                   'missingAckGrace':True,'coinResultTimeoutRecovery':True,
                   'coinDisconnectRecovery':True,'surrenderByNonActingSeatWithStaleRevision':True,
                   'idleWaitingSeatNotConceded':True,'disconnectGraceForDecisionOwner':True},indent=2))
finally:
 for ws in sockets:
  try:ws.close()
  except Exception:pass
 p.terminate()
 try:p.wait(timeout=4)
 except subprocess.TimeoutExpired:p.kill()
