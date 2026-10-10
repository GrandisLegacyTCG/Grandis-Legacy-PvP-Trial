from pathlib import Path
import re, asyncio, sys
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
idx=(ROOT/'public/index.html').read_text()
inline='\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',idx,re.S))
lobby=(ROOT/'public/lobby/pvp-lobby-v3.76.6.css').read_text()
integ=(ROOT/'public/pvp/pvp-integration.css').read_text()
html=f'''<!doctype html><html><head><style>{inline}</style><style>{lobby}</style><style>{integ}</style></head><body>
<div class="pvp-v260-lobby open"><div class="pvp-v260-page"><main class="pvp-v260-layout"><section></section><aside class="pvp-v260-panel pvp-v260-room-panel"><h2>MATCH PANEL</h2><label class="pvp-v260-label">PLAYER NAME</label><div class="pvp-v260-name"><input value="Jenoz"></div><div class="pvp-v260-actions"><button id="join" class="pvp-v260-btn pvp-v260-outline pvp-v260-gold-outline">JOIN AS PLAYER</button><button class="pvp-v260-btn pvp-v260-gold">READY</button></div><div class="pvp-v260-divider"></div><div class="pvp-v260-seats"><article class="pvp-v260-seat"><div><span>Player 2</span><strong>Player 1</strong></div><p><i></i>offline</p><button id="kick" class="pvp-seat-kick"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="></button></article></div></aside></main></div></div></body></html>'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for w,h in [(1366,768),(1440,900),(1024,768)]:
      page=await b.new_page(viewport={'width':w,'height':h}); await page.set_content(html,wait_until='load')
      r=await page.evaluate('''()=>{const j=document.querySelector('#join'),k=document.querySelector('#kick'),i=k.querySelector('img'),range=document.createRange();range.selectNodeContents(j);return{join:{font:getComputedStyle(j).fontSize,lines:range.getClientRects().length,w:j.offsetWidth,h:j.offsetHeight},kick:{w:k.offsetWidth,h:k.offsetHeight,r:getComputedStyle(k).borderRadius},img:{w:i.offsetWidth,h:i.offsetHeight}}}''')
      assert r['join']['font']=='13px',r
      assert r['join']['lines']==1,r
      assert r['kick']['w']==28 and r['kick']['h']==28,r
      assert r['img']['w']==16 and r['img']['h']==16,r
      await page.close()
    await b.close()
  print('PASS v3.78 Lobby browser parity: JOIN AS PLAYER is one line; kick=28x28; icon=16x16.')
asyncio.run(main())
