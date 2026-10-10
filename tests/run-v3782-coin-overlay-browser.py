from pathlib import Path
import asyncio
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
shared=(ROOT/'public/shared-ui/battlefield-ui.css').read_text()
integ=(ROOT/'public/pvp/pvp-integration.css').read_text()
html=f'''<!doctype html><html class="gl-pvp-game-active gl-pvp-coin-gated"><head>
<style>{shared}</style><style>{integ}</style>
<style>
.app{{position:fixed;inset:0;background:#123;}}
#fieldCard{{position:absolute;left:40%;top:40%;width:100px;height:140px;background:#ddd;transition:transform .1s}}
#fieldCard:hover{{transform:translateY(-12px) scale(1.08)}}
</style></head><body>
<div class="app" inert aria-hidden="true"><button id="fieldCard" type="button">FIELD CARD</button></div>
<div class="gl-battlefield-hover-preview open"><img alt="preview"></div>
<div class="gl-coin-overlay open"><section class="gl-coin-card"><h2>Opening Coin Flip</h2><button id="coinButton">Heads</button></section></div>
<script>window.fieldClicks=0;document.querySelector('#fieldCard').addEventListener('click',()=>window.fieldClicks++);</script>
</body></html>'''

async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page=await b.new_page(viewport={'width':1366,'height':768})
    await page.set_content(html,wait_until='load')
    result=await page.evaluate('''()=>{
      const app=document.querySelector('.app'), overlay=document.querySelector('.gl-coin-overlay'), card=document.querySelector('#fieldCard'), preview=document.querySelector('.gl-battlefield-hover-preview');
      const r=card.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2;
      const top=document.elementFromPoint(x,y);
      return {
        appVisibility:getComputedStyle(app).visibility,
        appPointer:getComputedStyle(app).pointerEvents,
        appInert:app.inert,
        overlayBg:getComputedStyle(overlay).backgroundColor,
        topClass:top?.className||top?.id||top?.tagName,
        previewDisplay:getComputedStyle(preview).display,
        cardTransform:getComputedStyle(card).transform,
        x,y
      };
    }''')
    assert result['appVisibility']=='visible', result
    assert result['appPointer']=='none', result
    assert result['appInert'] is True, result
    assert result['overlayBg']=='rgb(0, 0, 0)', result
    assert result['previewDisplay']=='none', result
    assert 'fieldCard' not in str(result['topClass']), result

    await page.mouse.move(result['x'],result['y'])
    await page.mouse.click(result['x'],result['y'])
    leaked=await page.evaluate('''()=>({clicks:window.fieldClicks,transform:getComputedStyle(document.querySelector('#fieldCard')).transform,active:document.activeElement?.id||''})''')
    assert leaked['clicks']==0, leaked
    assert leaked['transform']=='none', leaked
    assert leaked['active']!='fieldCard', leaked

    # Simulate the exact post-Start-Game release: remove overlay, root gate and inert.
    await page.evaluate('''()=>{document.documentElement.classList.remove('gl-pvp-coin-gated');const app=document.querySelector('.app');app.inert=false;app.removeAttribute('aria-hidden');document.querySelector('.gl-coin-overlay').classList.remove('open')}''')
    await page.mouse.move(result['x'],result['y'])
    await page.mouse.click(result['x'],result['y'])
    released=await page.evaluate('''()=>({clicks:window.fieldClicks,transform:getComputedStyle(document.querySelector('#fieldCard')).transform,pointer:getComputedStyle(document.querySelector('.app')).pointerEvents})''')
    assert released['clicks']==1, released
    assert released['transform']!='none', released
    assert released['pointer']!='none', released
    await b.close()
  print('PASS v3.78.2 Coin Flip gate: field stays rendered behind opaque black overlay; hover/click/focus are blocked until Start Game release.')

asyncio.run(main())
