"""Read-only Chromium render check of Season 1-style Season 0 lobby.
Browsers in this test container cannot connect to loopback HTTP; embed JS/CSS and assets
solely in the browser test, never into the shipped application.
"""
import pathlib, re, base64, os
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]/'client'
html=(root/'index.html').read_text()
css=(root/'runtime/s1-lobby.css').read_text()
def data(path):
 raw=(root/path).read_bytes()
 ext=path.split('.')[-1]
 mime='image/webp' if ext=='webp' else 'image/png'
 return f'data:{mime};base64,'+base64.b64encode(raw).decode()
css=css.replace('assets/lobby/background.webp',data('assets/lobby/background.webp'))
css=css.replace('assets/lobby/chevron-down.png',data('assets/lobby/chevron-down.png'))
html=re.sub(r'<link rel="stylesheet" href="runtime/s1-lobby.css\?v=1">',lambda m:'<style>'+css+'</style>',html)
html=html.replace('assets/lobby/grandis-legacy-logo.webp',data('assets/lobby/grandis-legacy-logo.webp'))
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (root/m.group(1)).read_text()+'</script>',html)
html=html.replace('<link rel="stylesheet" href="shared-ui/battlefield-ui.css">','<style>'+(root/'shared-ui/battlefield-ui.css').read_text()+'</style>')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get('PVP_CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 try:
  page=browser.new_page(viewport={'width':1600,'height':900},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded')
  page.wait_for_function('!!document.querySelector("#s0PvpOverlay .pvp-v260-layout")')
  page.wait_for_function('document.querySelectorAll("#s0PvpFormation .pvp-v260-card").length === 3')
  def inject_cards():
   for img in page.locator('#s0PvpFormation img').all():
    src=img.get_attribute('src')
    if src and src.startswith('card-art/'):
     img.evaluate('(el,src)=>el.src=src',data(src))
  inject_cards()
  page.locator('.pvp-v260-logo img').evaluate('(el,src)=>el.src=src',data('assets/lobby/grandis-legacy-logo.webp'))
  assert page.locator('#s0PvpDeck').count()==1
  assert page.locator('#s0PvpRoom').count()==1
  assert page.locator('#s0PvpJoin').is_visible()
  assert page.locator('.pvp-v260-panel').count()==2
  assert page.locator('#s0PvpRankLabel').inner_text()=='RANK I'
  # S1-like preview behavior, rank selector, ability to swap positional preview.
  page.locator('#s0PvpRankNext').click()
  inject_cards()
  assert page.locator('#s0PvpRankLabel').inner_text()=='RANK II'
  before=page.locator('#s0PvpFormation img').first.get_attribute('src')
  page.locator('[data-swap="0"]').click()
  after=page.locator('#s0PvpFormation img').first.get_attribute('src')
  assert before!=after,'preview swap did not reorder Hero positions'
  page.locator('#s0PvpRankPrev').click()
  inject_cards()
  page.screenshot(path=str(root.parent/'docs'/'LOBBY_S1_STYLE_DESKTOP.png'),full_page=True)
  print('PASS: Season 1-style lobby renders 2 panels, three Season 0 Heroes, deck stats, room panel, rank selection, and formation preview swap at 1600x900.')
  assert not errors,errors
  page.set_viewport_size({'width':430,'height':900})
  page.wait_for_timeout(150)
  inject_cards()
  assert page.locator('#s0PvpJoin').is_visible()
  dims=page.evaluate('''() => ({scroll:document.querySelector("#s0PvpOverlay").scrollHeight,client:document.querySelector("#s0PvpOverlay").clientHeight,width:document.querySelector("#s0PvpOverlay .pvp-v260-page").scrollWidth,view:window.innerWidth})''')
  assert dims['scroll']>dims['client'],dims
  assert dims['width']<=dims['view']+5,dims
  page.screenshot(path=str(root.parent/'docs'/'LOBBY_S1_STYLE_MOBILE.png'),full_page=True)
  print('PASS: 430px mobile lobby is scrollable, with no material horizontal overflow.')
 finally:browser.close()
