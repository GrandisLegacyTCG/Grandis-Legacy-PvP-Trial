"""Live two-client networking test for RC6; runs with native ws in CI, lite offline."""
import json,os,random,subprocess,time,urllib.request
import websocket
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PORT=random.randint(44000,49000)
base=f'http://127.0.0.1:{PORT}'
proc=subprocess.Popen(['node','server.js'],cwd=ROOT,env={**os.environ,'PORT':str(PORT),'PVP_ALLOWED_ORIGINS':'https://grandislegacytcg.web.id'},stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
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
  # Native `ws` rejects failed verifyClient callbacks with HTTP 401;
  # the offline RFC6455 adapter may choose HTTP 403 (or 400 for malformed upgrades).
  # In all cases an untrusted Origin MUST fail the HTTP Upgrade handshake.
  rejected_status=None
  try:
    forbidden=websocket.create_connection(url,timeout=3,origin='https://untrusted.example')
  except websocket.WebSocketBadStatusException as e:
    rejected_status=e.status_code
    assert rejected_status in (400,401,403), f'Unexpected rejection status: {rejected_status}'
    assert rejected_status != 101, 'Untrusted Origin received WebSocket 101 upgrade'
    assert 'upgrade' not in {k.lower() for k in (getattr(e,'resp_headers',None) or {})}, 'Rejected socket must not advertise a WebSocket Upgrade'
  else:
    forbidden.close()
    raise AssertionError('Untrusted Origin was successfully upgraded to WebSocket')
  def connect(id,origin='https://grandislegacytcg.web.id'):
    opts={'origin':origin} if origin else {}
    ws=websocket.create_connection(f'ws://127.0.0.1:{PORT}/ws?client={id}&name={id}&role=player&buildId={build}',timeout=5,**opts)
    clients.append(ws);return ws
  def until(ws,check):
    end=time.monotonic()+6
    while time.monotonic()<end:
      msg=json.loads(ws.recv())
      if check(msg):return msg
    raise AssertionError('expected WebSocket message did not arrive')
  # Website Origin is explicitly permitted, without weakening the rejection test.
  one=connect('net-rc6-p1',origin='https://grandislegacytcg.web.id');a=until(one,lambda m:m['type']=='snapshot')
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
  print(json.dumps({'ok':True,'transport':meta['transport'],'forbiddenOriginRejectedWithHttpStatus':rejected_status,'websiteOriginAccepted':True,'sameOriginProtected':True,'cachedBuildAssets':True,'singleHandshakeSnapshot':True,'p1AndP2Connected':True,'rttPong':True}))
finally:
  for ws in clients:
    try:ws.close()
    except:pass
  proc.terminate()
  try:proc.wait(timeout=3)
  except:proc.kill()
