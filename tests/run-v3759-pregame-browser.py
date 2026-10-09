#!/usr/bin/env python3
import re,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; P=ROOT/'public'; OUT=ROOT/'tests/artifacts/v3759-pregame'; OUT.mkdir(parents=True,exist_ok=True)
BUILD='gl-pvp-3.75.9-v351-authority-v6907-ui-2026-10-09'

def stripped_html():
    s=(P/'index.html').read_text()
    s=re.sub(r'<script[\s\S]*?</script>','',s,flags=re.I)
    s=re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*>','',s,flags=re.I)
    return s
HTML=stripped_html()
STYLES=[('pvpV351AppCss','css/app.css','all'),('pvpV351AuthorityCss','css/battlefield-authority.css','all'),('pvpV351SharedUiCss','shared-ui/battlefield-ui.css','all'),('pvpV6UiCss','css/pvp-ui.css','not all')]
BASEJS=['config.js','shared-ui/battlefield-ui.js','js/static-data.js','js/pvp-presentation-adapter.js','js/runtime-authority.js','js/app.bundle.js','js/pvp-ui-runtime.js']
MOCK_JS="""()=>{const store=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}});class MockWS{static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;constructor(url){this.url=url;this.readyState=0;this.sent=[];window.__mockWs=this;setTimeout(()=>{this.readyState=1;this.onopen&&this.onopen({})},5)}send(x){try{this.sent.push(JSON.parse(x))}catch(e){this.sent.push(x)}}close(){this.readyState=3}}window.WebSocket=MockWS;}"""

def boot(page):
    page.route('**/*',lambda r:r.abort())
    page.set_content(HTML)
    for elid,rel,media in STYLES:
        h=page.add_style_tag(content=(P/rel).read_text());h.evaluate('(el,x)=>{el.id=x.id;el.media=x.media}',{'id':elid,'media':media})
    page.add_style_tag(content=(P/'css/pvp-lobby.css').read_text())
    page.evaluate("window.GL_APP_MODE='PVP';window.GL_PVP_CLIENT_MODE=true;window.GL_PVP_SHARED_BOARD_ACTIVE=true")
    for rel in BASEJS: page.add_script_tag(content=(P/rel).read_text())
    page.evaluate(MOCK_JS)
    page.add_script_tag(content=(P/'js/pvp-network.js').read_text())
    page.wait_for_timeout(70)
    assert page.evaluate('!!window.__mockWs && !!window.GL_LOCAL_AI_BRIDGE && !!window.GL_PVP_NETWORK')

def feed(page,match,players,local):
    snap={'type':'snapshot','buildId':BUILD,'room':{'id':'LOBBY','generation':1},'match':match,'players':players,'spectators':[],'local':local}
    page.evaluate('(x)=>window.__mockWs.onmessage({data:JSON.stringify(x)})',snap);page.wait_for_timeout(100)

def player_rows():
    return [
      {'clientId':'p1','name':'JenoZ','role':'player','seat':1,'seatLabel':'Player 1','ready':True,'connected':True,'hasDeck':True,'deckKey':'starter_01_elemental_lord_conqueror_renegade','deckName':'Starter 1'},
      {'clientId':'p2','name':'Player 2','role':'player','seat':2,'seatLabel':'Player 2','ready':True,'connected':True,'hasDeck':True,'deckKey':'starter_02_saint_crusader_grand_ranger','deckName':'Starter 2'}]

def main():
    result={'ok':True,'lobby':{},'coin':{},'handoff':{}}
    with sync_playwright() as pw:
      browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
      # Lobby: exact requested desktop behavior + canonical v3.51 kick visual.
      for label,w,h in [('wide-720',1600,720),('standard',1366,768)]:
        ctx=browser.new_context(viewport={'width':w,'height':h});page=ctx.new_page();boot(page)
        players=player_rows();local={**players[0],'seatToken':'test-token'}
        feed(page,{'status':'setup','serverBoardRevision':0,'serverBoard':None},players,local)
        metrics=page.evaluate("""()=>{const root=document.scrollingElement,l=document.querySelector('.pvp-v260-lobby'),k=document.querySelector('[data-kick-seat=\"2\"]'),r=k&&k.getBoundingClientRect(),cs=k&&getComputedStyle(k);return{innerH:innerHeight,bodyScroll:root.scrollHeight,lobbyScroll:l&&l.scrollHeight,lobbyClient:l&&l.clientHeight,kick:k&&{w:r.width,h:r.height,borderRadius:cs.borderRadius,img:k.querySelector('img')?.getAttribute('src')},roomText:document.body.innerText.includes('CURRENT ROOM')||document.body.innerText.includes('SWITCH TO ROOM'),topActionsVisible:[...document.querySelectorAll('.pvp-v260-top-actions button')].some(x=>getComputedStyle(x).display!=='none')}}""")
        assert metrics['bodyScroll']<=metrics['innerH']+1,(label,'body scroll',metrics)
        assert metrics['lobbyScroll']<=metrics['lobbyClient']+1,(label,'lobby scroll',metrics)
        assert metrics['kick'] and abs(metrics['kick']['w']-28)<=.6 and abs(metrics['kick']['h']-28)<=.6,(label,'kick size',metrics['kick'])
        assert metrics['kick']['borderRadius']=='50%' and metrics['kick']['img'].endswith('assets/lobby/exit.png'),(label,'kick style',metrics['kick'])
        assert not metrics['roomText'] and not metrics['topActionsVisible'],(label,'removed lobby controls visible')
        shot=OUT/f'lobby-{label}-{w}x{h}.png';page.screenshot(path=str(shot),full_page=False)
        result['lobby'][label]={**metrics,'screenshot':str(shot.relative_to(ROOT))};ctx.close()

      # Player 2 is the chooser in the canonical v3.51 Coin Flip UI.
      ctx2=browser.new_context(viewport={'width':1600,'height':720});p2=ctx2.new_page();boot(p2)
      players2=player_rows();local2={**players2[1],'seatToken':'test-token-p2'}
      feed(p2,{'status':'setup','serverBoardRevision':0,'serverBoard':None},players2,local2)
      initial2=p2.evaluate("""()=>{const b=GL_LOCAL_AI_BRIDGE;b.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',player2DeckKey:'starter_02_saint_crusader_grand_ranger',player1Name:'JenoZ',player2Name:'Player 2'});const x=b.getCanonicalSnapshot(1);x.pvpPrivateStateMasked=true;return x;}""")
      deckChoices2={'1':{'deckKey':players2[0]['deckKey'],'deckName':'Starter 1'},'2':{'deckKey':players2[1]['deckKey'],'deckName':'Starter 2'}}
      feed(p2,{'status':'coin-flip','serverBoardRevision':1,'serverBoard':initial2,'coinFlip':{'pending':True,'chooserSeat':2,'chooserLabel':'Player 2','awaitingChoice':True},'playerNames':{'1':'JenoZ','2':'Player 2'},'deckChoices':deckChoices2,'lastAnimationEvents':[]},players2,local2)
      chooser=p2.evaluate("""()=>({heads:!!document.querySelector('#pvpBattleHeads'),disabled:document.querySelector('#pvpBattleHeads')?.disabled,stage:document.body.className,v6:!pvpV6Surface.hidden})""")
      assert chooser['heads'] and chooser['disabled'] is False and 'pvp-stage-pregame' in chooser['stage'] and not chooser['v6'],chooser
      p2.locator('#pvpBattleHeads').click();p2.wait_for_timeout(20)
      sent=p2.evaluate('window.__mockWs.sent');assert any(x.get('type')=='choose-coin-flip' and x.get('choice')=='HEADS' for x in sent),sent[-6:]
      result['coin']['player2Choice']={'enabled':True,'intent':'choose-coin-flip:HEADS'}
      ctx2.close()

      # Full P1 pregame: v3.51 battlefield + v3.51 Coin overlay, then v6 only after opening completes.
      ctx=browser.new_context(viewport={'width':1600,'height':720});page=ctx.new_page();boot(page)
      players=player_rows();local={**players[0],'seatToken':'test-token'}
      feed(page,{'status':'setup','serverBoardRevision':0,'serverBoard':None},players,local)
      initial=page.evaluate("""()=>{const b=GL_LOCAL_AI_BRIDGE;b.startSharedMatch({playerDeckKey:'starter_01_elemental_lord_conqueror_renegade',player2DeckKey:'starter_02_saint_crusader_grand_ranger',player1Name:'JenoZ',player2Name:'Player 2'});const x=b.getCanonicalSnapshot(1);x.pvpPrivateStateMasked=true;return x;}""")
      deckChoices={'1':{'deckKey':players[0]['deckKey'],'deckName':'Starter 1'},'2':{'deckKey':players[1]['deckKey'],'deckName':'Starter 2'}}
      feed(page,{'status':'coin-flip','serverBoardRevision':1,'serverBoard':initial,'coinFlip':{'pending':True,'chooserSeat':2,'chooserLabel':'Player 2','awaitingChoice':True},'playerNames':{'1':'JenoZ','2':'Player 2'},'deckChoices':deckChoices,'lastAnimationEvents':[]},players,local)
      coin=page.evaluate("""()=>{const m=document.querySelector('#pvpBattlefieldCoinModal'),r=m&&m.getBoundingClientRect();return{stage:document.body.className,v351:!document.querySelector('#pvpV351Surface').hidden,v6:!document.querySelector('#pvpV6Surface').hidden,modal:!!m&&getComputedStyle(m).display==='flex'&&r.width>500&&r.height>300,v6CoinOpen:document.querySelector('.ob-coin-overlay')?.classList.contains('open')||false,heroCount:document.querySelectorAll('#pvpV351Surface .heroCard,[data-hero-side]').length,animationChildren:document.querySelectorAll('#glAnimationLayer>*').length,uiActive:GL_OPTION_B_UI?.isPvpGameplayUiActive?.()||false}}""")
      assert 'pvp-stage-pregame' in coin['stage'] and coin['v351'] and not coin['v6'],coin
      assert coin['modal'] and not coin['v6CoinOpen'] and not coin['uiActive'],coin
      assert coin['animationChildren']==0,('Hero/Legacy animation must not run during Coin Flip',coin)
      coinShot=OUT/'coin-v351-background.png';page.screenshot(path=str(coinShot),full_page=False);coin['screenshot']=str(coinShot.relative_to(ROOT));coin.update(result.get('coin',{}));result['coin']=coin

      flip={'choice':'HEADS','outcome':'HEADS','firstSeat':1,'firstSeatLabel':'Player 1','firstPlayerName':'JenoZ','player1Name':'JenoZ','player2Name':'Player 2'}
      board2=json.loads(json.dumps(initial));board2['appState']['pvpCoinFlipPending']=False;board2['appState']['pvpCoinFlipResultPending']=True;board2['appState']['pvpOpeningCoinFlip']=flip
      feed(page,{'status':'coin-result','serverBoardRevision':2,'serverBoard':board2,'coinFlip':{'pending':False,'awaitingConfirmation':True,'choice':'HEADS','outcome':'HEADS','firstSeat':1,'firstPlayerName':'JenoZ'},'openingCoinFlip':flip,'deckChoices':deckChoices,'lastAnimationEvents':[]},players,local)
      # Create the same final canonical state the server publishes after confirmation.
      opened=page.evaluate("""(flip)=>{const b=GL_LOCAL_AI_BRIDGE;b.setRenderSuppressed(true);const r=b.completeOpeningFlow('PLAYER',flip),x=b.getCanonicalSnapshot(1);x.pvpPrivateStateMasked=true;const ev=r.events||[];return{board:x,opening:ev.filter(e=>e.reason==='OPENING_HAND'),post:ev.filter(e=>e.reason!=='OPENING_HAND')};}""",flip)
      starts=[]
      for i in range(3): starts += [{'side':'PLAYER','pool_index':i,'group_index':i},{'side':'AI','pool_index':i,'group_index':i}]
      evt={'id':'opening-sequence-r3','kind':'opening_sequence','opening_draw_events':opened['opening'],'starting_shard_entries':starts,'post_opening_draw_events':opened['post'],'post_opening_shard_entries':[{'side':'PLAYER','pool_index':3,'group_index':0}]}
      feed(page,{'status':'started','serverBoardRevision':3,'serverBoard':opened['board'],'coinFlip':{'pending':False,'awaitingConfirmation':False,'choice':'HEADS','outcome':'HEADS','firstSeat':1,'firstPlayerName':'JenoZ'},'openingCoinFlip':flip,'deckChoices':deckChoices,'lastAnimationEvents':[evt]},players,local)
      before=page.evaluate("()=>({stage:document.body.className,v351:!pvpV351Surface.hidden,v6:!pvpV6Surface.hidden,ui:GL_OPTION_B_UI.isPvpGameplayUiActive()})")
      assert 'pvp-stage-pregame' in before['stage'] and before['v351'] and not before['v6'] and not before['ui'],before
      # Opening is intentionally visible; wait for its real completion callback, then v6 may mount.
      page.wait_for_function("document.body.classList.contains('pvp-stage-gameplay')",timeout=10000)
      page.wait_for_timeout(180)
      after=page.evaluate("""()=>{const played=document.querySelector('.played');const op=document.querySelector('[data-pvp-identity-side=\"AI\"]'),pl=document.querySelector('[data-pvp-identity-side=\"PLAYER\"]');return{stage:document.body.className,v351:!pvpV351Surface.hidden,v6:!pvpV6Surface.hidden,ui:GL_OPTION_B_UI.isPvpGameplayUiActive(),playedReal:played?[...played.children].filter(x=>!x.classList.contains('ob-played-placeholder')).length:-1,opName:op?.querySelector('.pvp-player-display-name')?.textContent||'',opDeck:op?.querySelector('.pvp-player-deck-name')?.textContent||'',plName:pl?.querySelector('.pvp-player-display-name')?.textContent||'',plDeck:pl?.querySelector('.pvp-player-deck-name')?.textContent||'',opSignalAfterCopy:!!(op&&op.querySelector('.pvp-identity-copy')?.nextElementSibling?.matches('[data-pvp-signal-side=\"AI\"]')),plSignalBeforeCopy:!!(pl&&pl.firstElementChild?.matches('[data-pvp-signal-side=\"PLAYER\"]'))}}""")
      assert 'pvp-stage-gameplay' in after['stage'] and not after['v351'] and after['v6'] and after['ui'],after
      assert after['playedReal']==0,('Opening/normal draws leaked to Card Played',after)
      assert after['opName']=='Player 2' and after['plName']=='JenoZ',after
      assert after['opDeck'] and after['plDeck'] and after['opSignalAfterCopy'] and after['plSignalBeforeCopy'],after
      gameShot=OUT/'post-opening-v6907.png';page.screenshot(path=str(gameShot),full_page=False);after['screenshot']=str(gameShot.relative_to(ROOT));result['handoff']={'before':before,'after':after}
      ctx.close();browser.close()
    (OUT/'results.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));return 0

if __name__=='__main__':
  try: sys.exit(main())
  except Exception:
    import traceback;traceback.print_exc();sys.exit(1)
