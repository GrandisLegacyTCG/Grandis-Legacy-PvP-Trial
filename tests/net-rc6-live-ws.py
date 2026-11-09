"""Live two-client networking test for RC6; runs with native ws in CI, lite offline."""
import json,os,random,subprocess,time,urllib.request
import websocket
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PORT=random.randint(44000,49000)
base=f'http://127.0.0.1:{PORT}'
proc=subprocess.Popen(['node','server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT)},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
clients=[]
try:
  for _ in range(100):
    try:
      with urllib.request.urlopen(base+'/health',timeout=.7) as r:meta=json.load(r)
      break
    except Exception:time.sleep(.09)
  else:raise AssertionError('server did not start')
  assert meta['transport'] in ('ws','lite')
  if os.environ.get('PVP_REQUIRE_WS')=='1':assert meta['transport']=='ws'
  build=meta['buildId']
  versioned='/battle/engine/js/static-data.js?v='+build
  with urllib.request.urlopen(base+versioned,timeout=8) as r:
    assert r.headers.get('Cache-Control')=='public, max-age=86400, immutable'
    assert r.status==200
  with urllib.request.urlopen(base+'/battle/engine/js/static-data.js',timeout=8) as r:
    assert 'max-age=0' in r.headers.get('Cache-Control','')
  url=f'ws://127.0.0.1:{PORT}/ws?client=net-rc6-bad&role=spectator&buildId={build}'
  try:
    forbidden=websocket.create_connection(url,timeout=3,origin='https://untrusted.example')
    forbidden.close();raise AssertionError('Cross-origin socket unexpectedly accepted')
  except websocket.WebSocketBadStatusException as e:
    assert e.status_code in (400,403)
  def connect(id):
    ws=websocket.create_connection(f'ws://127.0.0.1:{PORT}/ws?client={id}&name={id}&role=player&buildId={build}',timeout=5)
    clients.append(ws);return ws
  def until(ws,check):
    end=time.monotonic()+6
    while time.monotonic()<end:
      msg=json.loads(ws.recv())
      if check(msg):return msg
    raise AssertionError('expected WebSocket message did not arrive')
  one=connect('net-rc6-p1');a=until(one,lambda m:m['type']=='snapshot')
  assert a['forceImport'] is True and a['local']['seat']==1
  two=connect('net-rc6-p2');b=until(two,lambda m:m['type']=='snapshot')
  assert b['forceImport'] is True and b['local']['seat']==2
  until(one,lambda m:m['type']=='snapshot' and len(m['players'])==2)
  now=int(time.time()*1000)
  one.send(json.dumps({'type':'ping','clientBuildId':build,'clientTime':now,'reportedRtt':37}))
  pong=until(one,lambda m:m['type']=='pong')
  assert pong['clientTime']==now
  assert any(row['seat']==1 and row['rttMs']==37 for row in pong['connections'])
  # One 304-capable resource can be warmed without loading the full donor JS.
  with urllib.request.urlopen(base+'/battle/',timeout=8) as r:
    html=r.read().decode()
  assert 'static-data.js?v='+build in html
  print(json.dumps({'ok':True,'transport':meta['transport'],'sameOriginProtected':True,'cachedBuildAssets':True,'singleHandshakeSnapshot':True,'p1AndP2Connected':True,'rttPong':True}))
finally:
  for ws in clients:
    try:ws.close()
    except:pass
  proc.terminate()
  try:proc.wait(timeout=3)
  except:proc.kill()
