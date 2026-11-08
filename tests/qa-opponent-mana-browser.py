"""Optional manual browser QA fixture. Requires python playwright + Chromium.
Uses original production battlefield CSS/DOM from index.html; no network required.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, json, base64
ROOT=Path(__file__).resolve().parent.parent
html=(ROOT/'public/battle/index.html').read_text()
html=re.sub(r'<script\s+[^>]*src="[^"]+"[^>]*></script>','',html)
html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)
# Avoid requests for external assets in an isolated about:blank fixture.
img=ROOT/'public/battle/assets/ui/back-shard.webp'
if not img.exists():
 raise FileNotFoundError(img)
source='data:image/webp;base64,'+base64.b64encode(img.read_bytes()).decode('ascii')
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height,mobile in [(1440,900,False),(1280,600,False),(844,390,True),(390,844,True)]:
  ctx=browser.new_context(viewport={'width':width,'height':height},is_mobile=mobile,has_touch=mobile, device_scale_factor=1)
  page=ctx.new_page()
  page.set_content(html,wait_until='domcontentloaded')
  page.evaluate('''imageSrc=>{
   const host=document.getElementById('opponentManaCards');
   document.querySelector('.app')?.classList.remove('gl-lobby-hidden');
   for(let i=0;i<4;i++){
    const wrap=document.createElement('div');wrap.className='mana-card';
    wrap.style.left=(i*48+2)+'px';wrap.style.zIndex=String(10+i);
    const img=document.createElement('img');img.src=imageSrc;img.alt='Face-down opponent Mana';
    wrap.appendChild(img);host.appendChild(wrap);
   }
   document.getElementById('opponentManaCount').textContent='4';
  }''',source)
  page.wait_for_timeout(350)
  data=page.evaluate('''()=>{
   const a=document.querySelector('.opponent-mana-pool'),label=a.querySelector('.gl-pool-badge'),field=document.querySelector('.battlefield');
   const rect=e=>{let x=e.getBoundingClientRect();return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height}};
   return {pool:rect(a),label:rect(label),field:rect(field),parent:a.parentElement.className,
     childCount:a.querySelectorAll('.mana-card').length, poolDisplay:getComputedStyle(a).display,
     scale:document.documentElement.style.getPropertyValue('--ui-scale')};
  }''')
  assert data['childCount']==4 and data['poolDisplay']!='none',data
  b=data['pool'];lab=data['label'];assert b['width']>40 and b['height']>30,data
  assert b['left']>=-1 and b['right']<=width+1 and b['top']>=-1 and b['bottom']<=height+1,data
  assert lab['right']<=width+1,data
  if not mobile:
   assert b['right']<=data['field']['right']+1,data
  name=f'QA_RC34_RC4_Opponent_Mana_{width}x{height}.png'
  path=ROOT/'docs'/name
  page.screenshot(path=str(path))
  print('PASS',width,height,'touch' if mobile else 'desktop',json.dumps(data))
  results.append({'viewport':f'{width}x{height}', 'mobile':mobile,**data})
  ctx.close()
 browser.close()
(ROOT/'docs'/'QA_RC34_RC4_OPP_MANA_GEOMETRY.json').write_text(json.dumps(results,indent=2))
