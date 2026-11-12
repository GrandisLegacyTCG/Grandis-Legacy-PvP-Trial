"""RC3: real WebSocket post-match cleanup; no client tab drives the timeout."""
import json,os,random,subprocess,time,urllib.request
from pathlib import Path
import websocket
root=Path(__file__).resolve().parents[1];port=random.randrange(49000,55000)
env={**os.environ,'PORT':str(port),'POST_MATCH_CLEANUP_MS':'1200','IDLE_SWEEP_MS':'200','COIN_ACK_GRACE_MS':'600'}
proc=subprocess.Popen(['node','server.js'],cwd=root,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
conns=[]
try:
 for _ in range(150):
  try:build=json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/health',timeout=.3))['buildId'];break
  except Exception:time.sleep(.06)
 else:raise AssertionError('RC3 server failed startup')
 def conn(name):
  ws=websocket.create_connection(f'ws://127.0.0.1:{port}/ws?client={name}&name={name}&role=player&buildId={build}',timeout=.35);conns.append(ws);return ws
 def send(ws,t,**data):ws.send(json.dumps({'type':t,'clientBuildId':build,**data}))
 def until(ws,pred,label,timeout=8):
  end=time.monotonic()+timeout
  while time.monotonic()<end:
   try:m=json.loads(ws.recv())
   except websocket.WebSocketTimeoutException:continue
   if m.get('type')=='error':raise AssertionError(label+': '+str(m.get('message')))
   if pred(m):return m
  raise AssertionError('timeout '+label)
 a,b=conn('rc3a'),conn('rc3b')
 until(a,lambda m:m['type']=='snapshot','join1');until(b,lambda m:m['type']=='snapshot','join2')
 for ws,key in [(a,'s0_starter_01_red_white'),(b,'s0_starter_02_blue_red')]:
  send(ws,'set-deck',deckKey=key);until(ws,lambda x:x['type']=='snapshot' and x['local'].get('deckKey')==key,'deck')
  send(ws,'ready',ready=True);until(ws,lambda x:x['type']=='snapshot' and x['local']['ready'],'ready')
 send(a,'start-match');until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-flip','coin flip')
 send(b,'choose-coin-flip',choice='TAILS');result=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='coin-result','result')
 send(a,'coin-presented');send(b,'coin-presented')
 send(a if result['match']['winnerSeat']==1 else b,'choose-turn-order',order='SECOND')
 start=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='started','started')
 send(a,'surrender-match',clientActionId='rc3concede',baseRevision=start['match']['revision'])
 end=until(a,lambda x:x['type']=='intent-result' and x['clientActionId']=='rc3concede','surrender')
 assert end['ok'] and end['snapshot']['match']['status']=='finished'
 exp=end['snapshot']['match']['postMatchCleanupAt'];assert exp
 until(b,lambda x:x['type']=='snapshot' and x['match']['status']=='finished','opponent sees result')
 # Neither player does anything; the server must expire and broadcast setup.
 restored=until(a,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','cleanup',timeout=6)
 assert restored['match']['board'] is None and not restored['local']['ready']
 assert restored['local']['deckKey']=='s0_starter_01_red_white','Deck must persist after cleanup'
 assert restored['local']['formation'],'Formation must persist after cleanup'
 restored2=until(b,lambda x:x['type']=='snapshot' and x['match']['status']=='setup','other cleanup',timeout=5)
 assert restored2['local']['deckKey']=='s0_starter_02_blue_red'
 assert not restored2['local']['ready']
 print('PASS RC3 60-second server-owned cleanup (test accelerated 1.2 sec): both players return, deck/formation preserved, ready cleared')
finally:
 for ws in conns:
  try:ws.close()
  except:pass
 proc.terminate()
 try:proc.wait(timeout=4)
 except subprocess.TimeoutExpired:proc.kill()
