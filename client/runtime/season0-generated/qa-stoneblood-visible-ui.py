from playwright.sync_api import sync_playwright
import pathlib,mimetypes,urllib.parse,json
ROOT=pathlib.Path(__file__).resolve().parents[2]
html=(ROOT/'index.html').read_text(encoding='utf8').replace('<head>','<head><base href="https://grandis-regression.test/">',1)
errors=[]; missing=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900})
 def respond(route):
  url=urllib.parse.urlsplit(route.request.url); path=(ROOT/urllib.parse.unquote(url.path).lstrip('/')).resolve()
  if not path.is_relative_to(ROOT) or not path.is_file():missing.append(str(path));route.fulfill(status=404,body='missing');return
  body=path.read_bytes()
  if str(path).endswith('/engine/shared-app/app.bundle.js'):
   s=body.decode('utf-8');i=s.rfind('\n})();')
   if i>=0:s=s[:i]+ '\n window.__STONEBLOOD_BROWSER_QA={get state(){return appState;},enableAiDirector(){GL_AI_TURN_DIRECTOR.active=true;GL_AI_TURN_DIRECTOR.token++;},openAttackResponseWindow,resolveResponseWindow};'+s[i:]
   body=s.encode('utf8')
  route.fulfill(status=200,body=body,content_type=mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
 page.route('https://grandis-regression.test/**',respond)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 page.wait_for_function('window.GL_GAME_UI && window.GL_GAME_ENGINE',timeout=20000)
 page.locator('#glLobbyStart').click(timeout=20000)
 page.locator('[data-coin-choice="HEADS"]').click(timeout=20000)
 page.locator('button.gl-coin-start').click(timeout=20000)
 page.wait_for_function('''() => {let s=window.GL_GAME_ENGINE?.getSnapshot?.();return s?.appState?.preGame==null && document.querySelector('.player-field')?.getBoundingClientRect()?.width>0}''',timeout=25000)
 page.wait_for_timeout(4500)
 res=page.evaluate('''() => {
   const q=window.__STONEBLOOD_BROWSER_QA,s=q.state;q.enableAiDirector();
   s.preGame=null;s.turn='AI';s.phase='Battle';s.round=2;s.pending=null;s.responseWindow=null;s.aiControl={resume:'after_player_response',from_phase:'Battle',director:true};s.racial=1;s.aiRacial=1;
   let h=s.playerHeroes.CENTER;h.card_id='S0-CLE-H004';h.hp=25;h.maxHp=100;h.statuses=[];h.mode='ACTIVE';h.legacy_mode=false;h.racial_used_turn=null;h.stoneblood_declined_turn=null;
   s.aiHeroes.CENTER.hp=100;
   q.openAttackResponseWindow(s,{card_id:'S0-WAR-001',source_side:'AI',source_lane:'CENTER',target_side:'PLAYER',target_lane:'CENTER'}, {damage:40,persistent:false,attachmentSlot:-1});
   q.resolveResponseWindow(null);window.GL_GAME_UI.render();
   return {pending:s.pending&&s.pending.type,hp:s.playerHeroes.CENTER.hp,oldOverlayCount:document.querySelectorAll('[data-stoneblood-choice]').length,visibleButtons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(/stoneblood|skip/i).test(b.textContent||'')).slice(0,15).map(b=>({text:b.textContent,html:b.outerHTML.slice(0,250)}))};
 }''')
 print('START',json.dumps(res));print('ERRORS',errors[:5])
 if res.get('pending')!='racial_stoneblood':raise AssertionError('Stoneblood not triggered')
 page.wait_for_timeout(350)
 options=page.evaluate('''() => [...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0&&(/stoneblood|skip/i).test(b.textContent||'')).slice(0,15).map(b=>({text:b.textContent,html:b.outerHTML.slice(0,250)}))''')
 print('OPTIONS',json.dumps(options));page.screenshot(path=str(ROOT/'qa/stage7/CHROMIUM_STONEBLOOD_CHOICE.png'),full_page=False)
 b=page.get_by_role('button',name='Stoneblood',exact=False)
 print('FOUND',b.count())
 b.first.click(timeout=10000)
 try:
  page.wait_for_function("""() => {const s=window.__STONEBLOOD_BROWSER_QA.state;return s.turn!=='AI'||s.phase!=='Battle'||s.gameOver;}""",timeout=10000)
 except Exception:
  print('AI ADVANCE TIMEOUT')
 aft=page.evaluate('''() => {const s=window.__STONEBLOOD_BROWSER_QA.state;return {turn:s.turn,phase:s.phase,pending:s.pending?.type||null,hp:s.playerHeroes.CENTER.hp,racial:s.racial,aiControl:s.aiControl,log:s.log.slice(0,5)}}''')
 page.screenshot(path=str(ROOT/'qa/stage7/CHROMIUM_STONEBLOOD_RESOLVED.png'),full_page=False);print('AFTER',json.dumps(aft));print('ERRORS_FINAL',errors[:5]);print('MISSING_ASSETS',missing[:5])
 if aft['hp']!=30 or aft['racial']!=0 or aft['pending'] or aft['turn']=='AI' and aft['phase']=='Battle':raise AssertionError('AI stuck / Stoneblood not resolved')
 if errors:raise AssertionError('JS errors')
 browser.close()
