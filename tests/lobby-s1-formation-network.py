import re,base64,pathlib,time,threading,queue,json,uuid
from playwright.sync_api import sync_playwright
import websocket
# Optional Chromium UI integration test. Requires playwright + websocket-client.
# Browser native HTTP/WS navigation is blocked by this environment; the
# test-only bridge relays WebSocket messages to the actual local Node server.
import os
root=pathlib.Path(__file__).resolve().parent.parent/'client'
port=int(os.environ.get('PVP_TEST_PORT','3000'))
html=(root/'index.html').read_text()
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script src="data:text/javascript;base64,'+base64.b64encode((root/m.group(1)).read_bytes()).decode()+'"></script>',html)
shim=r'''<script>
Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const data={};return{getItem(k){return data[k]||null},setItem(k,v){data[k]=v},removeItem(k){delete data[k]}}})()});
window.__wsConnections={};let __wsSequence=0;
window.WebSocket=class WebSocketBridge {
 static OPEN=1;static CLOSED=3;
 constructor(url){this.url=url;this.readyState=0;this._key=String(++__wsSequence);window.__wsConnections[this._key]=this;
  window.__bridgeConnect(this._key,url).then(()=>{this.readyState=1;this.onopen?.({})}).catch(e=>{this.onerror?.({message:String(e)});this.readyState=3;this.onclose?.({})}); }
 send(message){if(this.readyState!==1)throw Error('Not open');window.__bridgeSend(this._key,message)}
 close(){if(this.readyState===3)return;this.readyState=3;window.__bridgeClose(this._key);this.onclose?.({})}
};
window.__wsDeliver=(id,packet)=>{const sock=window.__wsConnections[id];if(sock&&sock.readyState===1)sock.onmessage?.({data:packet})};
window.__wsClosed=(id)=>{const sock=window.__wsConnections[id];if(sock){sock.readyState=3;sock.onclose?.({})}};
</script>'''
html=html.replace('<script>window.GL_APP_MODE="PVP";',shim+'<script>window.GL_APP_MODE="PVP";')
html=html.replace('<link rel="stylesheet" href="shared-ui/battlefield-ui.css">','<style>'+(root/'shared-ui/battlefield-ui.css').read_text()+'</style>')
class Bridge:
 def __init__(self,page):
  self.page=page;self.sockets={};self.messages=queue.Queue();self.errors=[]
  page.expose_binding('__bridgeConnect',self.connect)
  page.expose_binding('__bridgeSend',self.send)
  page.expose_binding('__bridgeClose',self.close)
 def connect(self,source,key,url):
  ws=websocket.create_connection(f'ws://127.0.0.1:{port}/ws',timeout=5)
  ws.settimeout(None)
  self.sockets[key]=ws
  def reader():
   try:
    while True:
     data=ws.recv()
     if not data:break
     self.messages.put((key,data))
   except Exception as e:self.errors.append(str(e))
   self.messages.put((key,None))
  threading.Thread(target=reader,daemon=True).start()
 def send(self,source,key,payload):self.sockets[key].send(payload)
 def close(self,source,key):
  if key in self.sockets:self.sockets[key].close()
 def pump(self):
  n=0
  while n<100:
   try:key,msg=self.messages.get_nowait()
   except queue.Empty:break
   self.page.evaluate('([id,msg]) => msg===null?window.__wsClosed(id):window.__wsDeliver(id,msg)',[key,msg]);n+=1
  return n
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 room_code="s0browser"+str(int(time.time()))[-7:]
 pages=[];bridges=[];errors=[]
 def pump():
  for br in bridges:br.pump()
 def until(cond,label,limit=12):
  start=time.time()
  while time.time()-start<limit:
   pump()
   if cond():return
   time.sleep(.08)
  raise AssertionError('timeout '+label+' '+str([x.evaluate('({status:window.GL_S0_PVP_NETWORK?.state.status,revision:window.GL_S0_PVP_NETWORK?.state.revision,message:document.getElementById("s0PvpMessage")?.textContent})') for x in pages]))
 try:
  for i in range(2):
   ctx=browser.new_context(viewport={'width':1440,'height':900})
   page=ctx.new_page();page.on('pageerror',lambda err,i=i:errors.append((i,str(err))))
   br=Bridge(page);pages.append(page);bridges.append(br)
   page.set_content(html,wait_until='domcontentloaded',timeout=40000)
   assert page.evaluate('!!window.GL_S0_PVP_NETWORK && !!window.GL_GAME_UI')
  for i,page in enumerate(pages):
   page.locator('#s0PvpName').fill(f'Tester{i+1}')
   page.locator('#s0PvpRoom').fill(room_code)
   page.locator('#s0PvpJoin').click()
   until(lambda page=page:page.evaluate('window.GL_S0_PVP_NETWORK.state.seat')==i+1,f'seat {i+1}')
  print('JOINED',[(page.evaluate('window.GL_S0_PVP_NETWORK.state.seat'),page.evaluate('window.GL_S0_PVP_NETWORK.state.status')) for page in pages])
  # Season 1 lobby formation swap persists as a validated custom S0 deck.
  before=pages[0].evaluate('window.GL_ACTIVE_STARTER_DECKS.s0_starter_01_red_white.deck.default_formation')
  pages[0].locator('[data-swap="0"]').click()
  for page in pages:
   page.locator('#s0PvpSelect').click()
   until(lambda page=page:page.evaluate('window.GL_S0_PVP_NETWORK.state.ready')==False and page.evaluate('window.GL_S0_PVP_NETWORK.state.status')=='lobby','deck select')
  until(lambda: pages[0].evaluate('window.GL_S0_PVP_NETWORK.state.deckKey')=='CUSTOM','swapped formation server accepted')
  for page in pages:
   until(lambda page=page:page.locator('#s0PvpReady').is_enabled(),'ready enabled')
   page.locator('#s0PvpReady').click()
  until(lambda:pages[0].locator('#s0PvpStart').is_enabled(),'both ready')
  pages[0].locator('#s0PvpStart').click()
  until(lambda:pages[1].locator('[data-coin="HEADS"]').count()>0,'coin')
  pages[1].locator('[data-coin="HEADS"]').click()
  until(lambda:all(page.evaluate('window.GL_S0_PVP_NETWORK.state.status')=='playing' for page in pages),'playing')
  new_hero=pages[0].evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.playerHeroes.LEFT.card_id')
  assert new_hero==before['CENTER'],(new_hero,before)
  print('SWAP VALIDATED',new_hero)
  print('LIVE',[(page.evaluate('window.GL_S0_PVP_NETWORK.state.revision'),page.evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.turn'),page.evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.playerHand.length')) for page in pages])
  until(lambda:all(page.locator('.hand-card').count()>=6 for page in pages),'hand rendered')
  print('HAND CARDS',[page.locator('.hand-card').count() for page in pages])
  print('PHASE BTN',[page.locator('[id*=Phase],.phase').count() for page in pages])
  # Exercise network->client->runtime UI for an authoritative phase advance.
  first=pages[0] if pages[0].evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.turn')=='PLAYER' else pages[1]
  old=first.evaluate('window.GL_S0_PVP_NETWORK.state.revision')
  out=first.evaluate('window.GL_S0_PVP_NETWORK.sendIntent("advancePhase",[])')
  print('INTENT',out)
  until(lambda:all(page.evaluate('window.GL_S0_PVP_NETWORK.state.revision')==old+1 for page in pages),'phase synced')
  print('PHASE',[(page.evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.phase'),page.evaluate('window.GL_S0_PVP_NETWORK.state.revision')) for page in pages])
  # RC32 composite event handlers issue two sequential intents (select + confirm).
  # The PvP transport must queue the second until the server commits the first.
  older=first.evaluate('window.GL_S0_PVP_NETWORK.state.revision')
  seq=first.evaluate('([a,b])=>[window.GL_S0_PVP_NETWORK.sendIntent(a,[]),window.GL_S0_PVP_NETWORK.sendIntent(b,[])]',['advancePhase','advancePhase'])
  until(lambda:all(page.evaluate('window.GL_S0_PVP_NETWORK.state.revision')==older+2 for page in pages),'sequenced UI intents')
  print('QUEUE',seq,'revisions',[page.evaluate('window.GL_S0_PVP_NETWORK.state.revision') for page in pages])
  # Exercise the actual RC32 battlefield NEXT PHASE button (not only the JS intent API).
  actor=pages[0] if pages[0].evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.turn')=='PLAYER' else pages[1]
  print('BEFORE UI',actor.evaluate('({phase:window.GL_S0_PVP_NETWORK.state.snapshot?.appState?.phase,turn:window.GL_S0_PVP_NETWORK.state.snapshot?.appState?.turn,button:document.querySelector(".phase-action.next")?.outerHTML})'))
  until(lambda:actor.locator('.phase-action.next').is_enabled(),'real UI next-phase button')
  before_click=actor.evaluate('window.GL_S0_PVP_NETWORK.state.revision')
  actor.locator('.phase-action.next').click()
  until(lambda:all(page.evaluate('window.GL_S0_PVP_NETWORK.state.revision')==before_click+1 for page in pages),'real UI phase button synced')
  print('UI_CLICK_NEXT_PHASE', [page.evaluate('window.GL_S0_PVP_NETWORK.state.snapshot.appState.phase') for page in pages])
  print('JS ERRORS',errors)
  # Omit screenshot: inline document does not have assets loaded by the browser.
  assert not errors,errors
  print('PASS: two real Chromium renderers and RC32 UI against a real Node authoritative server using a test-only WebSocket relay: lobby, decks, ready, coin, hand, phase and serial intents.')
 finally:
  for br in bridges:
   for ws in br.sockets.values():
    try:ws.close()
    except:pass
  browser.close()
