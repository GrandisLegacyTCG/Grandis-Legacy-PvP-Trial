#!/usr/bin/env python3
import base64, json, re, sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
FIX=ROOT/'tests/fixtures/v348-artwork'
OUT=ROOT/'tests/artifacts/v348-card-stroke'
OUT.mkdir(parents=True,exist_ok=True)
VPS=[('desktop',1366,768,False),('tablet-landscape',1024,768,True),('tablet-portrait',768,1024,True),('phone',390,844,True)]
CARD_TYPES=[('hero','S1-WAR-H001'),('skill','S1-WAR-001'),('legacy','S1-WAR-L001'),('item','S1-ITM-006'),('event','S1-EVT-004')]

def data_uri(path):
    return 'data:image/webp;base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
CARD_BACK=data_uri(FIX/'Back-of-Card-Main-Deck.webp')
ART={cid:data_uri(FIX/f'{cid}.webp') for _,cid in CARD_TYPES}

def stripped_html():
    s=(PUBLIC/'index.html').read_text(encoding='utf-8')
    s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I)
    s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I)
    return s
HTML=stripped_html()
CSS='\n'.join((PUBLIC/f).read_text(encoding='utf-8') for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
JS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js']

def boot(page):
    page.route('**/*',lambda route: route.abort())
    page.set_content(HTML)
    page.add_style_tag(content=CSS)
    page.evaluate("window.GL_APP_MODE='PVP';document.body.classList.remove('pvp-booting')")
    for f in JS: page.add_script_tag(content=(PUBLIC/f).read_text(encoding='utf-8'))
    page.evaluate("""()=>{window.GL_PVP_SHARED_BOARD_ACTIVE=true;window.GL_PVP_LOCAL_ROLE='player';window.GL_LOCAL_AI_BRIDGE.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',aiDeckKey:'starter_02_saint_crusader_grand_ranger',player1Name:'Player A',player2Name:'Player B'});window.GL_LOCAL_AI_BRIDGE.completeOpeningFlow('PLAYER',{choice:'HEADS',outcome:'HEADS'});}""")
    page.wait_for_timeout(100)

def no_gold_edge(path):
    im=Image.open(path).convert('RGB')
    w,h=im.size
    pixels=[]
    band=max(1,min(2,w//8,h//8))
    for y in range(h):
        for x in range(w):
            if x<band or x>=w-band or y<band or y>=h-band:
                pixels.append(im.getpixel((x,y)))
    gold=sum(1 for r,g,b in pixels if r>=120 and g>=85 and b<=75 and r>g*1.05)
    ratio=gold/max(1,len(pixels))
    return ratio<0.015,ratio

def surface_state(page):
    return page.evaluate("""()=>{const img=document.querySelector('.opponent-hand-slot img.back'),slot=img&&img.closest('.opponent-hand-slot');if(!img||!slot)return null;const a=getComputedStyle(img),b=getComputedStyle(slot),pre=getComputedStyle(slot,'::before'),post=getComputedStyle(slot,'::after');return {htmlClass:document.documentElement.className,shell:!!document.querySelector('.gl-lab-authority'),count:document.querySelectorAll('.opponent-hand-slot img.back').length,img:{border:a.border,borderWidth:a.borderWidth,borderStyle:a.borderStyle,borderColor:a.borderColor,outline:a.outline,shadow:a.boxShadow,background:a.backgroundColor,filter:a.filter,radius:a.borderRadius},slot:{border:b.border,outline:b.outline,shadow:b.boxShadow,background:b.backgroundColor,before:pre.content,after:post.content}}}""")

def assert_clean_surface(data,label):
    assert data and data['count']>=3,(label,'missing opponent cards',data)
    for owner in ('img','slot'):
        x=data[owner]
        assert x['border'].startswith('0px'),(label,owner,'border',x['border'])
        assert 'none' in x['outline'],(label,owner,'outline',x['outline'])
        assert x['shadow']=='none',(label,owner,'shadow',x['shadow'])
        assert x['background'] in ('rgba(0, 0, 0, 0)','transparent'),(label,owner,'background',x['background'])
    assert data['img']['filter']=='none',(label,'filter',data['img']['filter'])
    assert data['slot']['before']=='none' and data['slot']['after']=='none',(label,'pseudo',data['slot'])

def main():
  results={'ok':True,'realChromium':True,'quickPreview':{},'opponentHand':{},'functionalOutline':{}}
  with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    # Opponent-hand actual production DOM at the four mandated viewports.
    for name,w,h,mobile in VPS:
        ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile)
        page=ctx.new_page(); boot(page)
        page.evaluate('(u)=>document.querySelectorAll(".opponent-hand-slot img.back").forEach(i=>i.src=u)',CARD_BACK)
        page.wait_for_timeout(60)
        data=surface_state(page); assert_clean_surface(data,name)
        expected_path='.gl-lab-authority .gl-lab-hand--opponent .opponent-hand-slot > img.back' if data['shell'] else '.v96-app .hand-area--opponent .opponent-hand-slot > img.back'
        shot=OUT/f'opponent-hand-{name}-{w}x{h}.png'; page.screenshot(path=str(shot),full_page=False)
        cardshot=OUT/f'opponent-card-edge-{name}-{w}x{h}.png'; page.locator('.opponent-hand-slot img.back').first.screenshot(path=str(cardshot))
        edge_ok,edge_ratio=no_gold_edge(cardshot); assert edge_ok,(name,'gold-like perimeter pixels',edge_ratio)
        results['opponentHand'][name]={'viewport':f'{w}x{h}','activeDomPath':expected_path,'cards':data['count'],'computedClean':True,'goldEdgePixelRatio':edge_ratio,'screenshot':str(shot.relative_to(ROOT))}
        ctx.close()

    # Quick Preview: actual production renderer + actual production card nodes.
    ctx=browser.new_context(viewport={'width':1366,'height':768})
    page=ctx.new_page(); boot(page)
    snap=page.evaluate('window.GL_LOCAL_AI_BRIDGE.getSnapshot()')
    st=snap['appState']; st['playerHand']=['S1-WAR-001','S1-ITM-006','S1-EVT-004']
    defeated=st['playerHeroes']['LEFT']
    st['playerHeroes']['LEFT']={'card_id':'S1-WAR-L001','side':'PLAYER','lane':'LEFT','mode':'LEGACY','legacy_mode':True,'active_legacy_card_id':'S1-WAR-L001','defeated_hero_snapshot':defeated,'assigned_legacy_card_id':'S1-WAR-L001','legacy_lineage_id':'WAR-CONQUEROR','legacy_package_id':'V348-VISUAL-TEST'}
    snap['appState']=st
    page.evaluate('(s)=>window.GL_LOCAL_AI_BRIDGE.importSnapshot(s)',snap); page.wait_for_timeout(80)
    for kind,cid in CARD_TYPES:
        loc=page.locator(f'[data-preview="{cid}"]').first
        assert loc.count()==1 and loc.is_visible(),(kind,cid,'production preview source missing')
        loc.hover(force=True); page.wait_for_timeout(70)
        zoom=page.locator('#hoverCardZoom'); assert zoom.is_visible(),(kind,'Quick Preview did not show')
        page.evaluate('(u)=>document.querySelector("#hoverCardZoom img").src=u',ART[cid]); page.wait_for_timeout(30)
        comp=page.evaluate("""()=>{const z=document.querySelector('#hoverCardZoom'),i=z.querySelector('img'),s=getComputedStyle(i);return {classes:z.className,border:s.border,outline:s.outline,background:s.backgroundColor,shadow:s.boxShadow}}""")
        assert comp['border'].startswith('0px'),(kind,'border',comp)
        assert 'none' in comp['outline'],(kind,'outline',comp)
        assert comp['background'] in ('rgba(0, 0, 0, 0)','transparent'),(kind,'background',comp)
        assert comp['shadow']=='none',(kind,'shadow',comp)
        shot=OUT/f'quick-preview-{kind}.png'; zoom.screenshot(path=str(shot))
        results['quickPreview'][kind]={'cardId':cid,'computedClean':True,'classes':comp['classes'],'screenshot':str(shot.relative_to(ROOT))}
        page.mouse.move(1,1); page.wait_for_timeout(25)

    # Modal image-shell variant: ring/background remain removed.
    page.locator('[data-preview="S1-WAR-H001"]').first.hover(force=True); page.wait_for_timeout(50)
    page.evaluate('(u)=>{const z=document.querySelector("#hoverCardZoom");z.classList.add("is-modal-zoom");z.querySelector("img").src=u}',ART['S1-WAR-H001'])
    modal=page.evaluate("""()=>{const i=document.querySelector('#hoverCardZoom img'),s=getComputedStyle(i);return {shadow:s.boxShadow,background:s.backgroundColor,border:s.border}}""")
    assert modal['shadow']=='none' and modal['background'] in ('rgba(0, 0, 0, 0)','transparent') and modal['border'].startswith('0px'),modal
    results['quickPreview']['modalVariant']={'computedClean':True}

    # Actual production Hero surface with targeting/selection state classes still renders feedback.
    target=page.locator('.hero-panel[data-side="AI"][data-lane="CENTER"]').first
    assert target.count()==1 and target.is_visible()
    before=target.evaluate('e=>getComputedStyle(e).boxShadow')
    target.evaluate("e=>{e.classList.add('selectable-legal','targetLegal')}")
    after=target.evaluate('e=>({shadow:getComputedStyle(e).boxShadow,outline:getComputedStyle(e).outline})')
    assert after['shadow']!='none' and '2px' in after['outline'],('functional outline missing',before,after)
    target.screenshot(path=str(OUT/'functional-target-outline.png'))
    results['functionalOutline']={'productionHeroSurface':True,'selectableLegalShadow':after['shadow'],'targetLegalOutline':after['outline'],'preserved':True}
    ctx.close(); browser.close()
  (OUT/'browser-results.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
  print(json.dumps(results,indent=2))
  return 0

if __name__=='__main__':
    try: sys.exit(main())
    except Exception as e:
        import traceback; traceback.print_exc(); sys.exit(1)
