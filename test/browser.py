"""Functional checks using Chromium/Playwright already provided by the cloud image."""
import argparse
import json
import os
import shutil
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=8080)
parser.add_argument("--websocket-port", type=int)
parser.add_argument("--renderer", choices=["canvas", "webgl"], default="canvas")
parser.add_argument("--screenshots", default="/workspace/.live-arena-onboarding/screenshots")
args = parser.parse_args()
base = f"http://127.0.0.1:{args.port}"
for path, content_type, marker in [
    ("/", "text/html", b"Live Arena"),
    ("/style.css", "text/css", b"game-container"),
    ("/game/main.js", "text/javascript", b"Phaser.Game"),
    ("/node_modules/phaser/dist/phaser.min.js", "text/javascript", b"Phaser"),
]:
    with urlopen(base + path, timeout=10) as response:
        assert response.status == 200, path
        assert content_type in response.headers["Content-Type"], path
        assert marker in response.read(), path
print("HTTP/assets: passed", flush=True)
capture = """(() => {
  let phaser;
  Object.defineProperty(window, 'Phaser', {
    configurable: true, get: () => phaser, set: value => {
      phaser = value;
      value.Game = new Proxy(value.Game, {construct(target, args) {
        const game = Reflect.construct(target, args);
        window.__onboardingGame = game;
        return game;
      }});
    }
  });
})();"""
outputs = Path(args.screenshots)
outputs.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    binary = os.environ.get("BROWSER_EXECUTABLE") or shutil.which("chromium") or shutil.which("google-chrome")
    launch = {"headless": True, "args": ["--no-sandbox", "--disable-webgl"] if args.renderer == "canvas"
              else ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]}
    if binary:
        launch["executable_path"] = binary
    browser = p.chromium.launch(**launch)
    context = browser.new_context(viewport={"width":1280,"height":720})
    context.add_init_script(capture)
    def open_page(url, portrait=False):
        page = context.new_page()
        if portrait:
            page.set_viewport_size({"width":540,"height":960})
        page.errors = []
        page.failures = []
        page.on("pageerror",lambda e:page.errors.append(str(e)))
        page.on("response",lambda r:page.failures.append(r.url) if r.status>=400 and not r.url.endswith("/favicon.ico") else None)
        page.goto(url,wait_until="domcontentloaded")
        page.wait_for_function("window.__onboardingGame?.scene.getScene('ArenaScene')?.participantRegistry",timeout=15000)
        page.evaluate("""() => {
          window.__scene=window.__onboardingGame.scene.getScene('ArenaScene');
          window.__types=new Set();
          window.__scene.eventBus.subscribe(e=>window.__types.add(e.type));
        }""")
        return page
    def healthy(page):
        assert not page.errors,page.errors
        assert not page.failures,page.failures
        assert page.locator("#game-container canvas").count()==1
        assert page.evaluate("window.__scene.visualEffects.objects.size<=window.__scene.visualEffects.limit")
    for mode in ["normal",6,10,25,50,100,500,1000,"portrait"]:
        portrait=mode=="portrait"
        count=6 if mode=="normal" else 1000 if portrait else mode
        maximum=40 if portrait else 100
        suffix="/?mode=simulator" if mode=="normal" else f"/?load={count}"+("&layout=portrait" if portrait else "")
        page=open_page(base+suffix,portrait)
        page.wait_for_function("n=>window.__scene.participantRegistry.getStats().registered===n",arg=count,timeout=15000)
        page.wait_for_function("['COMMENT','LIKE','FOLLOW','GIFT','SHARE'].every(t=>window.__types.has(t))",timeout=15000)
        page.wait_for_function("window.__scene.rankingView.rows.length>0 && window.__scene.participantStatsView.text.text.includes('REGISTRADOS')",timeout=5000)
        result=page.evaluate("""() => {
          const s=window.__scene;
          return {...s.participantRegistry.getStats(),rendered:s.activePlayerManager.entries.size,
            ranking:s.rankingView.rows.length,effects:s.visualEffects.objects.size,renderer:s.game.renderer.type};
        }""")
        assert result["registered"]==count,result
        assert result["active"]==min(count,maximum),result
        assert result["rendered"]==min(count,maximum),result
        assert result["queued"]==max(0,count-maximum),result
        assert result["ranking"]==min(count,5 if portrait else 10),result
        assert page.evaluate("window.__scene.webSocketEventSource.socket===null"),"Simulator must isolate real events"
        if count>maximum:
            page.evaluate("window.__first=window.__scene.activePlayerManager.entries.keys().next().value")
            page.wait_for_function("!window.__scene.activePlayerManager.entries.has(window.__first)",timeout=15000)
            assert page.evaluate("window.__scene.participantRegistry.getStats().queued")==count-maximum
        if mode=="normal":
            page.evaluate("""() => {
              const entries=Array.from(window.__scene.activePlayerManager.entries.values());
              window.__attacker=entries[0]; window.__victim=entries[1];
              window.__score=window.__scene.scoreSystem.getScore(window.__attacker.player.userId);
              window.__victim.health.takeDamage(100,window.__attacker.player);
            }""")
            assert not page.evaluate("window.__victim.player.isAlive()")
            assert page.evaluate("window.__scene.scoreSystem.getScore(window.__attacker.player.userId)===window.__score+1")
            page.wait_for_function("window.__victim.player.isAlive()",timeout=5000)
            page.evaluate("window.__round=window.__scene.roundManager.number; window.__scene.roundManager.remaining=100; window.__scene.roundManager.pause=150;")
            page.wait_for_function("window.__scene.roundManager.number>window.__round",timeout=5000)
            page.screenshot(path=str(outputs/"landscape.png"))
        if portrait:
            page.screenshot(path=str(outputs/"portrait.png"))
        healthy(page)
        print(f"{mode}: "+json.dumps(result,ensure_ascii=False),flush=True)
        page.close()
    page=open_page(base+"/?mode=live&maxActive=4")
    page.wait_for_function("window.__scene.participantRegistry.getStats().bots===4",timeout=5000)
    assert page.evaluate("window.__scene.scoreSystem.getRanking().length")==0
    assert "DESCONECTADO" in page.evaluate("window.__scene.hud.status.text"),"Local backend is not a real TikTok connection"
    page.evaluate("""() => {
      for(let i=0;i<5;i++)window.__scene.eventBus.publish({type:'COMMENT',userId:'real-'+i,username:'@Real'+i,data:{message:'primeira interação'}});
    }""")
    page.wait_for_function("window.__scene.participantRegistry.getStats().bots===0",timeout=5000)
    assert page.evaluate("window.__scene.participantRegistry.getStats().registered")==5
    assert page.evaluate("window.__scene.activePlayerManager.entries.size")==4
    assert page.evaluate("window.__scene.participantRegistry.getStats().queued")==1
    healthy(page);print("LIVE UI / bots yield to first interactions: passed (simulated, no real LIVE)",flush=True)
    page.close()
    if args.websocket_port:
        page=open_page(f"http://127.0.0.1:{args.websocket_port}/?mode=live&bots=off")
        page.wait_for_function("['JOIN','COMMENT','LIKE','FOLLOW','SHARE','GIFT'].every(t=>window.__types.has(t))",timeout=15000)
        assert page.evaluate("window.__scene.participantRegistry.getStats().registered")==1
        assert page.evaluate("window.__scene.webSocketEventSource.socket.readyState")==1
        assert page.evaluate("window.__scene.giftManager.processed")>=1
        healthy(page)
        print("Node gateway -> real WebSocket -> game: passed (synthetic events)",flush=True)
        page.close()
    context.close()
    browser.close()
print("Functional browser checks: passed",flush=True)
