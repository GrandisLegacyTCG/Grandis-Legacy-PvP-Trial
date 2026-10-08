#!/usr/bin/env python3
import re,sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; PUBLIC=ROOT/'public'
VPS=[('desktop',1366,768),('tablet-landscape',1024,768),('tablet-portrait',768,1024),('phone',390,844)]
def clean_html():
    s=(PUBLIC/'index.html').read_text(encoding='utf-8')
    s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I); s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I); return s
HTML=clean_html(); CSS='\n'.join((PUBLIC/f).read_text(encoding='utf-8') for f in ['css/app.css','css/battlefield-authority.css','shared-ui/battlefield-ui.css'])
JS=['shared-ui/battlefield-ui.js','config.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js','js/pvp-network.js','js/mobile-app-nav.js']
def boot(page):
    page.set_content(HTML); page.add_style_tag(content=CSS)
    page.evaluate("""()=>{window.__pvpSent=[];const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}});class TestWS{static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;constructor(url){this.url=url;this.readyState=0;setTimeout(()=>{if(this.onerror)this.onerror(new Event('error'));},20)}send(x){window.__pvpSent.push(String(x))}close(){this.readyState=3;}}Object.defineProperty(window,'WebSocket',{configurable:true,writable:true,value:TestWS});}""")
    for f in JS: page.add_script_tag(content=(PUBLIC/f).read_text(encoding='utf-8'))
    page.wait_for_selector('#pvpSetupDeck',timeout=10000); page.wait_for_timeout(80)
def style(loc):
    return loc.evaluate("""e=>{const s=getComputedStyle(e);return {width:s.width,height:s.height,display:s.display,grid:s.gridTemplateColumns,marginTop:s.marginTop,padding:s.padding,border:s.border,borderRadius:s.borderRadius,background:s.backgroundColor,fontSize:s.fontSize,fontWeight:s.fontWeight,color:s.color,lineHeight:s.lineHeight}}""")
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1366,'height':768}); page=ctx.new_page(); page.route('**/*',lambda r:r.abort()); page.set_default_timeout(5000)
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e))); boot(page); results=[]
    expected_parent={'width':'138px','height':'33px','display':'grid','grid':'31px 74px 31px','marginTop':'17px','padding':'0px','border':'1px solid rgb(64, 66, 76)','borderRadius':'7px','background':'rgb(18, 19, 24)','fontWeight':'400'}
    expected_button={'width':'31px','height':'31px','padding':'1px 6px','borderRadius':'0px','fontSize':'22px','fontWeight':'400','color':'rgb(255, 255, 255)','lineHeight':'normal'}
    expected_label={'width':'74px','fontSize':'10px','fontWeight':'700','color':'rgb(240, 210, 127)','lineHeight':'normal'}
    for name,w,h in VPS:
        cdp=ctx.new_cdp_session(page); cdp.send('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':1,'mobile':name!='desktop','screenWidth':w,'screenHeight':h,'screenOrientation':{'type':'portraitPrimary' if h>w else 'landscapePrimary','angle':0 if h>w else 90}}); cdp.send('Emulation.setTouchEmulationEnabled',{'enabled':name!='desktop','maxTouchPoints':5 if name!='desktop' else 1}); page.evaluate("window.dispatchEvent(new Event('resize'))"); page.wait_for_timeout(40)
        page.locator('#pvpSetupDeck').select_option(index=0); page.wait_for_timeout(8)
        if page.locator('#pvpRankLabel').inner_text().strip()!='RANK I':
            while page.locator('#pvpRankLabel').inner_text().strip()!='RANK I': page.locator('#pvpRankPrev').click()
        rank=page.locator('.rank-control'); assert rank.count()==1 and rank.is_visible(),name
        form=page.locator('#pvpFormationPreview').bounding_box(); rr=rank.bounding_box(); assert form and rr and rr['y']>=form['y']+form['height']-1,(name,form,rr)
        ps=style(rank); bs=style(rank.locator('button').first); ls=style(rank.locator('strong'))
        for k,v in expected_parent.items(): assert ps[k]==v,(name,'parent',k,ps[k],v)
        for k,v in expected_button.items(): assert bs[k]==v,(name,'button',k,bs[k],v)
        for k,v in expected_label.items(): assert ls[k]==v,(name,'label',k,ls[k],v)
        sent_before=page.evaluate('window.__pvpSent.length')
        page.locator('#pvpRankNext').click(); assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK II'
        page.locator('#pvpRankNext').click(); assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK III'
        page.locator('#pvpRankPrev').click(); assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK II'
        assert page.evaluate('window.__pvpSent.length')==sent_before,(name,'rank preview emitted network data')
        for i in range(5):
            page.locator('#pvpSetupDeck').select_option(index=i); page.wait_for_timeout(8); assert page.locator('#pvpRankLabel').inner_text().strip()=='RANK I'
            assert page.locator('#pvpFormationPreview .pvp-v260-hero').count()==3
            page.locator('#pvpRankNext').click(); assert page.locator('#pvpFormationPreview [data-lobby-rank="2"]').count()==3
            page.locator('#pvpRankNext').click(); assert page.locator('#pvpFormationPreview [data-lobby-rank="3"]').count()==3
        assert page.locator('#pvpFormationPreview .pvp-v260-swap-button').count()==2
        assert page.locator('#pvpChangeNameButton').count()==0
        results.append({'viewport':f'{w}x{h}','kind':name,'rankControlRect':rr,'style1ComputedParity':True,'rankI':True,'rankII':True,'rankIII':True,'rankPreviewNetworkMutation':False,'heroSwapPreserved':True})
    out={'ok':not errors,'authority':'Deck Builder v1.31 Style 1','expectedComponent':'31px | 74px | 31px; outer 138x33 CSS px','viewports':results,'page_errors':errors}; print(json.dumps(out,indent=2)); browser.close(); sys.exit(0 if out['ok'] else 1)
