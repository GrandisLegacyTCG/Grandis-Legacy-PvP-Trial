from pathlib import Path
import asyncio, json
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
css='\n'.join((ROOT/p).read_text() for p in ['public/css/app.css','public/css/gameplay-shell.css','public/css/gameplay-presentation.css','public/css/pvp-shell-isolation.css'])
markup='''<div class="app ob-pvp-shell"><main class="battlefield"><section class="phase"><div class="phase-turn"><div class="turn">YOUR TURN<small>TURN 1</small></div></div><div class="phase-track"><span class="phase-label active">DRAW PHASE</span><span class="phase-label">DEPLOY PHASE</span><span class="phase-label">BATTLE PHASE</span><span class="phase-label">REFORM PHASE</span><span class="phase-label">END PHASE</span></div><div class="phase-actions"><button class="phase-action">REPOSITION</button><button class="phase-action next" id="nextPhaseButton">NEXT PHASE</button></div></section><section class="hand top"><div class="hand-title pvp-external-identity"><span class="pvp-player-identity-container"><strong class="pvp-player-display-name">Player 2</strong><small class="pvp-player-deck-name">Starter 1 — Elemental</small></span><span class="pvp-connection-bar good"><span></span><span></span><span></span><span></span></span></div></section><div class="player-name pvp-external-identity"><span class="pvp-connection-bar excellent"><span></span><span></span><span></span><span></span></span><span class="pvp-player-identity-container"><strong class="pvp-player-display-name">jenoz</strong><small class="pvp-player-deck-name">Starter 2 — Saint</small></span></div></main><aside class="sidebar"></aside></div>'''
async def main():
  async with async_playwright() as pw:
    browser=await pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=await browser.new_page(viewport={'width':1600,'height':760})
    await page.set_content(f'<style>{css}</style><body class="pvp-presentation-owned">{markup}</body>')
    out=await page.evaluate('''()=>{const x=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),c=getComputedStyle(e);return {w:r.width,h:r.height,font:c.fontSize,minHeight:c.minHeight,display:c.display,padding:c.padding}};return {phase:x('.phase'),turn:x('.turn'),label:x('.phase-label'),next:x('.phase-action.next'),name:x('.pvp-player-display-name'),deck:x('.pvp-player-deck-name')}}''')
    assert abs(out['phase']['h']-32)<0.2, out
    assert out['phase']['display']=='flex', out
    assert out['phase']['minHeight']=='0px', out
    assert out['turn']['font']=='10px', out
    assert out['label']['font']=='7.4px', out
    assert abs(out['next']['h']-24)<0.2, out
    assert out['name']['font']=='10px', out
    assert out['deck']['font']=='7px', out
    print(json.dumps({'ok':True,'build':'Grandis Legacy PvP v3.76.6','computed':out},indent=2))
    await browser.close()
asyncio.run(main())
