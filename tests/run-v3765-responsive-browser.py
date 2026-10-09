from pathlib import Path
import re, json, sys
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
html=(root/'public/index.html').read_text()
# Remove production scripts; this fixture audits the real DOM/CSS shell and the real responsive scaler only.
html=re.sub(r'<script\b[^>]*>.*?</script>','',html,flags=re.S|re.I)
# Inline CSS in production order.
css_files=['public/css/app.css','public/css/battlefield-authority.css','public/shared-ui/battlefield-ui.css','public/css/gameplay-shell.css','public/css/gameplay-presentation.css','public/css/pvp-shell-isolation.css']
for rel in css_files:
    name=Path(rel).name
    css=(root/rel).read_text()
    html=re.sub(rf'<link[^>]+href="[^"]*{re.escape(name)}[^"]*"[^>]*>',f'<style>\n{css}\n</style>',html,count=1,flags=re.I)
# Remove remaining links and inject the production scaler.
html=re.sub(r'<link\b[^>]*>','',html,flags=re.I)
html=html.replace('</body>',f'<script>{(root/"public/js/pvp-responsive-scale.js").read_text()}</script></body>')
# Make the external shell the visible owner.
html=html.replace('<body class="pvp-booting">','<body class="pvp-presentation-owned pvp-gameplay-revealed">')

viewports=[(1600,760,'desktop'),(1180,820,'tablet-wide'),(1024,768,'tablet-1024'),(768,1024,'tablet-portrait')]
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for w,h,label in viewports:
        page=browser.new_page(viewport={"width":w,"height":h})
        page.set_content(html,wait_until='domcontentloaded')
        page.evaluate('''() => {
          document.documentElement.classList.add('gl-lobby-ready');
          document.querySelectorAll('.hero-lane').forEach((lane, i) => {
            lane.classList.add('hero-panel');
            const hc=lane.querySelector(':scope > .hero-card');
            if(hc){
              hc.classList.add('hero-main');
              let pack=lane.querySelector(':scope > .ob-hero-physical-stack');
              if(!pack){pack=document.createElement('div');pack.className='ob-hero-physical-stack is-ready';lane.appendChild(pack)}
              pack.appendChild(hc);
              if(!hc.querySelector('img')){const img=document.createElement('img');img.alt='hero';hc.appendChild(img)}
            }
          });
          document.querySelectorAll('.hand-track').forEach(track => {
            for(let i=0;i<6;i++){const c=document.createElement('div');c.className='hand-card';const img=document.createElement('img');c.appendChild(img);track.appendChild(c)}
          });
          document.querySelectorAll('.zone img').forEach(img=>{img.alt='zone'});
          document.querySelectorAll('.racial-row').forEach(row=>{if(!row.children.length){for(let i=0;i<2;i++){const x=document.createElement('img');x.className='racial-token';row.appendChild(x)}}});
          window.GL_PVP_UPDATE_RESPONSIVE_SCALE?.();
        }''')
        page.wait_for_timeout(240)
        data=page.evaluate('''() => {
          const shell=document.querySelector('.ob-pvp-shell'), lane=document.querySelector('.hero-lane.hero-panel'), hand=document.querySelector('.hand-card'), zone=document.querySelector('.zone'), phaseActions=document.querySelector('.phase-actions'), racial=document.querySelector('.racial-token'), native=document.querySelector('#app');
          const r=shell.getBoundingClientRect(), cs=x=>getComputedStyle(x);
          return {
            viewport:[innerWidth,innerHeight], shell:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height},
            bodyScroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],
            nativeDisplay:cs(native).display,
            lanePadding:cs(lane).padding, laneMinHeight:cs(lane).minHeight,
            handWidth:hand.getBoundingClientRect().width, handCssWidth:cs(hand).width,
            zoneOverflow:cs(zone).overflow, zoneHeight:zone.getBoundingClientRect().height,
            phaseDisplay:cs(phaseActions).display,
            racial:[racial.getBoundingClientRect().width,racial.getBoundingClientRect().height],
            scale:getComputedStyle(document.documentElement).getPropertyValue('--ui-scale').trim(),
            orientation:document.documentElement.dataset.uiOrientation
          };
        }''')
        eps=1.5
        assert data['nativeDisplay']=='none', (label,'native root visible',data)
        assert data['shell']['left']>=-eps and data['shell']['top']>=-eps, (label,'negative shell origin',data)
        assert data['shell']['right']<=w+eps and data['shell']['bottom']<=h+eps, (label,'shell clipped',data)
        assert data['bodyScroll'][0] <= w+1 and data['bodyScroll'][1] <= h+1, (label,'document scroll overflow',data)
        assert data['lanePadding'].startswith('0px'), (label,'legacy hero padding leak',data)
        assert data['phaseDisplay']=='flex', (label,'legacy phase grid leak',data)
        assert abs(data['racial'][0]-28*float(data['scale'])) < 2 and abs(data['racial'][1]-28*float(data['scale'])) < 2, (label,'racial token legacy size leak',data)
        assert data['zoneOverflow']=='visible', (label,'legacy zone overflow leak',data)
        if h>w: assert data['orientation']=='portrait-virtual-landscape', (label,'portrait not virtual landscape',data)
        results.append({'label':label,**data})
        shot=root/'tests'/f'_v3765_{label}.png'
        page.screenshot(path=str(shot),full_page=False)
        page.close()

    # Explicit Coin Flip cover audit: gameplay may hydrate underneath but must not paint.
    page=browser.new_page(viewport={"width":1024,"height":768})
    page.set_content(html,wait_until='domcontentloaded')
    page.evaluate("""() => {
      document.documentElement.classList.add('gl-lobby-ready');
      document.body.classList.remove('pvp-gameplay-revealed');
      document.body.classList.add('pvp-presentation-owned','pvp-coin-gate','pvp-pregame');
      const modal=document.createElement('div');
      modal.className='gl-opening-coin-modal';
      modal.style.position='fixed'; modal.style.inset='0';
      const card=document.createElement('div'); card.textContent='Opening Coin Flip';
      card.style.cssText='margin:auto;padding:40px;background:#07121d;color:#ffd84a;border:1px solid #ffd84a';
      modal.style.display='grid'; modal.style.placeItems='center'; modal.appendChild(card);
      document.body.appendChild(modal);
      window.GL_PVP_UPDATE_RESPONSIVE_SCALE?.();
    }""")
    page.wait_for_timeout(240)
    coin=page.evaluate("""() => {
      const modal=document.querySelector('.gl-opening-coin-modal');
      const shell=document.querySelector('.ob-pvp-shell');
      return {
        bodyBg:getComputedStyle(document.body).backgroundColor,
        shellVisibility:getComputedStyle(shell).visibility,
        modalVisibility:getComputedStyle(modal).visibility,
        modalZ:Number(getComputedStyle(modal).zIndex),
        nativeDisplay:getComputedStyle(document.querySelector('#app')).display,
        revealed:document.body.classList.contains('pvp-gameplay-revealed')
      };
    }""")
    assert coin['bodyBg'] in ('rgb(0, 0, 0)','rgba(0, 0, 0, 1)'), ('coin','body is not opaque black',coin)
    assert coin['shellVisibility']=='hidden', ('coin','hydrating gameplay shell is still visible',coin)
    assert coin['modalVisibility']=='visible', ('coin','coin modal hidden with gameplay shell',coin)
    assert coin['nativeDisplay']=='none', ('coin','native app can paint under coin gate',coin)
    assert not coin['revealed'], ('coin','gameplay revealed during coin gate',coin)
    page.screenshot(path=str(root/'tests'/'_v3765_coin-black.png'),full_page=False)
    page.close()
    browser.close()
print(json.dumps({'ok':True,'viewports':results,'coinGate':coin},indent=2))
