#!/usr/bin/env python3
import re,json,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'

def stripped_html():
 s=(P/'index.html').read_text()
 s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I)
 s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I)
 return s
HTML=stripped_html()
CSS='\n'.join((P/f).read_text() for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css','css/gameplay-shell.css','css/gameplay-presentation.css'])
BASE=['shared-ui/battlefield-ui.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']

def prime(page):
 page.set_content(HTML)
 page.add_style_tag(content=CSS)
 page.evaluate("""()=>{window.GL_APP_MODE='PVP';window.GL_CONFIG={buildId:'qa-v3763',roomId:1,roomName:'QA Room',connectionTimeoutMs:3000};window.GL_PVP_CONFIG=window.GL_CONFIG;const mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)}});class MockWS{static CONNECTING=0;static OPEN=1;static CLOSED=3;constructor(){this.readyState=0;this.sent=[];window.__qaWs=this;setTimeout(()=>{this.readyState=1;this.onopen&&this.onopen({})},10)}send(x){this.sent.push(x)}close(){this.readyState=3;this.onclose&&this.onclose({code:1000})}}window.WebSocket=MockWS;}""")
 for f in BASE: page.add_script_tag(content=(P/f).read_text())
 page.add_script_tag(content=(P/'js/pvp-network.js').read_text())

def assert_lobby(page):
 page.wait_for_function("document.documentElement.classList.contains('gl-lobby-ready')",timeout=10000)
 page.wait_for_selector('#pvpSetupOverlay.open',state='visible',timeout=10000)
 page.wait_for_function("getComputedStyle(document.querySelector('#glBootVeil')).visibility==='hidden'",timeout=5000)
 return page.evaluate("""()=>({ready:document.documentElement.classList.contains('gl-lobby-ready'),veil:getComputedStyle(document.querySelector('#glBootVeil')).visibility,overlay:!!document.querySelector('#pvpSetupOverlay.open'),initialImgSrcs:[...document.querySelectorAll('.ob-pvp-shell img[src]')].map(x=>x.getAttribute('src'))})""")

def main():
 out={'ok':True,'browser':'Chromium','mode':'production DOM/scripts injected into about:blank because direct local HTTP navigation is blocked in this execution environment'}
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  c=b.new_context(viewport={'width':1366,'height':768}); p=c.new_page(); errors=[]; p.on('pageerror',lambda e: errors.append(str(e))); t=time.time(); prime(p); lobby=assert_lobby(p); p.add_script_tag(content=(P/'js/pvp-gameplay-presentation.js').read_text()); p.wait_for_function("document.documentElement.classList.contains('gl-runtime-ready')",timeout=10000); out['normal']={**lobby,'elapsedMs':round((time.time()-t)*1000),'runtimeReady':True,'pageErrors':errors}; assert not errors,errors; c.close()
  c=b.new_context(viewport={'width':1366,'height':768}); p=c.new_page(); errors=[]; logs=[]; p.on('pageerror',lambda e: errors.append(str(e))); p.on('console',lambda m: logs.append(m.text)); prime(p); lobby=assert_lobby(p); p.evaluate("window.__qaBridgeBackup=window.GL_LOCAL_AI_BRIDGE;window.GL_LOCAL_AI_BRIDGE=undefined"); p.add_script_tag(content=(P/'js/pvp-gameplay-presentation.js').read_text()); p.wait_for_function("document.documentElement.classList.contains('gl-presentation-degraded')",timeout=10000); degraded=p.evaluate("()=>({runtimeReady:document.documentElement.classList.contains('gl-runtime-ready'),degraded:document.documentElement.classList.contains('gl-presentation-degraded'),lobbyReady:document.documentElement.classList.contains('gl-lobby-ready')})"); assert degraded['lobbyReady'] and degraded['degraded'] and not degraded['runtimeReady']; assert any('Gameplay presentation boot timed out' in x for x in logs),logs[-10:]; p.evaluate("window.GL_LOCAL_AI_BRIDGE=window.__qaBridgeBackup;window.GL_PVP_RETRY_GAMEPLAY_PRESENTATION()"); p.wait_for_function("document.documentElement.classList.contains('gl-runtime-ready')",timeout=5000); out['presentationDependencyFailure']={**lobby,'lobbyUsableDuringFailure':True,'boundedTimeoutObserved':True,'diagnosticLogged':True,'manualRetryRecovered':True,'pageErrors':errors}; assert not errors,errors; c.close(); b.close()
 print(json.dumps(out,indent=2)); return 0
if __name__=='__main__':
 try: sys.exit(main())
 except Exception:
  import traceback; traceback.print_exc(); sys.exit(1)
