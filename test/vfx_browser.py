"""VFX regression, asset fallback, bounded lifetime and Chromium performance checks."""
import argparse, json, shutil, struct, zlib
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8080)
parser.add_argument('--output', default='/tmp/live-arena-vfx')
parser.add_argument('--performance-seconds', type=int, default=6)
args = parser.parse_args()
OUT = Path(args.output); OUT.mkdir(parents=True, exist_ok=True)
BASE = f'http://127.0.0.1:{args.port}'
EXPECTED = json.loads(Path(__file__).with_name('fixtures').joinpath('vfx-gameplay-baseline.json').read_text())
CAPTURE = """(() => { let p; Object.defineProperty(window,'Phaser',{configurable:true,get:()=>p,set:v=>{p=v;v.Game=new Proxy(v.Game,{construct(t,a){const g=Reflect.construct(t,a);window.game=g;return g;}});}}); })();"""
PROBE = """() => {
const s=window.game.scene.getScene('ArenaScene'); s.eventSimulator.stop();
s.roundManager.phase='WAITING'; s.loadRotationTimer.remove(false); s.botTimer.remove(false);
let seed=123456; const oldRandom=Math.random; Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<3;i++)s.eventBus.publish({type:'JOIN',userId:'probe-'+i,username:'Probe'+i,eventId:'join-'+i});
const [a,b,c]=Array.from(s.activePlayerManager.entries.values());
const initial=[a,b,c].map(e=>({x:e.player.avatar.x,y:e.player.avatar.y,speed:e.movement.speed,direction:[e.movement.direction.x,e.movement.direction.y],next:e.movement.nextDirectionChange,hp:e.health.currentHealth}));
a.player.setPosition(200,250);b.player.setPosition(280,250);c.player.setPosition(500,250);
s.activePlayerManager.spatialGrid.rebuild([a.player,b.player,c.player]);
const nearest=a.combat.findNearestTarget().userId;
a.combat.update(1000); const first={hp:b.health.currentHealth,energy:a.player.energy,next:a.combat.nextActionTime};
a.combat.update(1100);const cooldownHp=b.health.currentHealth;
a.player.applyBonus({energy:50,boost:1.25,duration:5000});a.combat.update(1900);
const boosted={hp:b.health.currentHealth,energy:a.player.energy,boost:a.player.damageMultiplier,next:a.combat.nextActionTime};
a.movement.update(3000,16);const moved={x:a.player.avatar.x,y:a.player.avatar.y,direction:[a.movement.direction.x,a.movement.direction.y],next:a.movement.nextDirectionChange};
b.health.takeDamage(100,a.player);
const death={alive:b.player.isAlive(),hp:b.health.currentHealth,score:s.scoreSystem.getScore(a.player.userId),delay:b.health.respawnTimer.delay,visible:b.player.avatar.visible};
b.health.respawn();const respawn={alive:b.player.isAlive(),hp:b.health.currentHealth,x:b.player.avatar.x,y:b.player.avatar.y};
a.health.takeDamage(40);s.interactionEffects.handleEvent({type:'FOLLOW',userId:a.player.userId,data:{}});
const follow={hp:a.health.currentHealth,energy:a.player.energy,multiplier:a.player.damageMultiplier};
s.eventBus.publish({type:'GIFT',userId:a.player.userId,username:a.player.username,eventId:'gift-probe',data:{giftName:'Rose',quantity:2}});
const gift={hp:a.health.currentHealth,energy:a.player.energy,multiplier:a.player.damageMultiplier,processed:s.giftManager.processed,units:s.participantRegistry.get(a.player.userId).giftUnits};
Math.random=oldRandom;return {initial,nearest,first,cooldownHp,boosted,moved,death,respawn,follow,gift,stats:s.participantRegistry.getStats()};
}"""
BURST = """() => {
const s=window.game.scene.getScene('ArenaScene');const ids=Array.from(s.activePlayerManager.entries.keys());
window.burstIndex=(window.burstIndex||0)+1;const prefix='burst-'+window.burstIndex;
for(let i=0;i<100;i++)s.eventBus.publish({type:'LIKE',userId:ids[i%ids.length],username:'Load',eventId:prefix+'l'+i,data:{count:1}});
for(let i=0;i<10;i++)s.eventBus.publish({type:'COMMENT',userId:ids[i%ids.length],username:'Load',eventId:prefix+'c'+i,data:{message:'VFX TESTE '+i}});
for(let i=0;i<5;i++)s.eventBus.publish({type:'GIFT',userId:ids[i%ids.length],username:'Load',eventId:prefix+'g'+i,data:{giftName:'Present '+i,quantity:1,diamondCount:[1,100,500,1000,1000][i]}});
}"""
MEASURE = """() => new Promise(resolve=>{const times=[];let start,previous;function frame(t){if(!start)start=t;if(previous)times.push(t-previous);previous=t;if(t-start<6000)requestAnimationFrame(frame);else{times.sort((a,b)=>a-b);const s=window.game.scene.getScene('ArenaScene');resolve({fps:Math.round(times.length*10000/(t-start))/10,p95ms:Math.round(times[Math.floor(times.length*.95)]*10)/10,children:s.children.length,effects:s.visualEffects.objects.size,tweens:s.tweens.getTweens().length,timers:s.time._active.length+s.time._pendingInsertion.length,metrics:s.visualEffects.metrics?.()??null});}}requestAnimationFrame(frame);})"""

def fixture_png(width=32, height=16):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    rows = b''.join(b'\0' + b''.join(bytes((80 if x < 16 else 240, 180, 255, 255)) for x in range(width)) for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')

STRESS = """() => {
 const s=window.game.scene.getScene('ArenaScene');s.eventSimulator.stop();s.scene.pause();
 const fx=s.visualEffects, players=Array.from(s.activePlayerManager.entries.values()).map(e=>e.player);
 const resources=()=>({children:s.children.length,timers:s.time._active.length+s.time._pendingInsertion.length,tweens:s.tweens.getTweens().length,metrics:fx.metrics()});
 const before=resources(), samples=[];
 for(let cycle=0;cycle<40;cycle++){
  for(let i=0;i<100;i++)fx.interaction(players[i%players.length],{type:'LIKE',data:{count:100}});
  for(let i=0;i<10;i++)fx.interaction(players[i%players.length],{type:'COMMENT',data:{message:'Comentário de carga '+i}});
  for(let i=0;i<5;i++)fx.gift(players[i%players.length],{data:{giftName:'Load '+i,quantity:1}},['COMMON','RARE','EPIC','LEGENDARY','LEGENDARY'][i]);
  for(let i=0;i<players.length;i++){fx.attack(players[i],players[(i+1)%players.length]);fx.hit(players[i],20);}
  fx.death(players[0]);fx.respawn(players[1]);fx.update(cycle*1000,1000);
  if([9,19,39].includes(cycle))samples.push(resources());
 }
 fx.update(50000,10000);const drained=resources();
 window.stoppedFx=fx;s.scene.stop();return {before,samples,drained};
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=shutil.which('chromium') or shutil.which('google-chrome'),
        headless=True, args=['--no-sandbox', '--disable-webgl'])
    context = browser.new_context(viewport={'width':1280,'height':720})
    context.add_init_script(CAPTURE)
    report = {'renderer':'Chromium Canvas headless', 'regression':[], 'performance':[], 'stress':[], 'assets':{}}
    def new_page(query, portrait=False, routes=None):
        page = context.new_page()
        if portrait: page.set_viewport_size({'width':540,'height':960})
        page.errors=[]; page.on('pageerror',lambda error:page.errors.append(str(error)))
        if routes:
            for pattern, handler in routes: page.route(pattern, handler)
        page.goto(BASE+'/'+query,wait_until='domcontentloaded')
        page.wait_for_function("window.game?.scene.getScene('ArenaScene')?.participantRegistry",timeout=15000)
        return page
    def clean(page): assert not page.errors, page.errors
    for quality in ['LOW','MEDIUM','HIGH']:
        page=new_page('?mode=simulator&bots=off&vfxQuality='+quality)
        assert page.evaluate(PROBE)==EXPECTED, quality
        assert page.locator('#vfx-debug').count()==0
        clean(page);page.close();report['regression'].append(quality)
    print('Deterministic gameplay baseline: identical at LOW/MEDIUM/HIGH',flush=True)
    for portrait in [False,True]:
        page=new_page('?mode=simulator&debugVfx=1'+('&layout=portrait' if portrait else ''),portrait)
        page.evaluate("window.game.scene.getScene('ArenaScene').eventSimulator.stop()")
        scenarios=page.evaluate("Array.from(window.game.scene.getScene('ArenaScene').vfxDebug.panel.querySelectorAll('button')).map(b=>b.textContent).filter(n=>n!=='Demonstrar todos')")
        for name in scenarios:
            page.get_by_role('button',name=name,exact=True).click()
            assert page.evaluate('name=>window.game.scene.getScene("ArenaScene").vfxDebug.last===name',name)
        page.wait_for_function("window.game.scene.getScene('ArenaScene').visualEffects.gifts.queue.active?.value.tier==='LEGENDARY'")
        page.wait_for_timeout(200)
        if portrait:page.locator('#vfx-debug summary').click()
        page.screenshot(path=str(OUT/('after-debug-portrait.png' if portrait else 'after-debug-landscape.png')))
        assert page.evaluate("window.game.scene.getScene('ArenaScene').giftManager.processed")==0
        assert page.evaluate("window.game.scene.getScene('ArenaScene').participantRegistry.getStats().registered")==0
        clean(page);page.close()
    print('All 13 visual previews: passed at 16:9 and 9:16 without gameplay events',flush=True)
    # Fixtures are generated here, never third-party or shipped artwork.
    manifest={'version':1,'assets':[
        {'role':'hit','type':'spritesheet','path':'assets/vfx/combat/hit/fixture.png','frameWidth':16,'frameHeight':16},
        {'role':'attack','type':'atlas','path':'assets/vfx/combat/attack/fixture.png','atlas':'assets/vfx/combat/attack/fixture.json'},
        {'role':'particle.spark','type':'image','path':'assets/vfx/environment/fixture.png'}]}
    frames={f'frame{i}':{'frame':{'x':i*16,'y':0,'w':16,'h':16},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':16,'h':16},'sourceSize':{'w':16,'h':16}} for i in range(2)}
    page=new_page('?mode=simulator&bots=off',routes=[
        ('**/assets/vfx/manifest.json',lambda r:r.fulfill(json=manifest)),
        ('**/fixture.png',lambda r:r.fulfill(body=fixture_png(),content_type='image/png')),
        ('**/fixture.json',lambda r:r.fulfill(json={'frames':frames,'meta':{'size':{'w':32,'h':16}}}))])
    assert page.evaluate("window.game.scene.getScene('ArenaScene').visualEffects.assets.size")==3
    assert page.evaluate("window.game.scene.getScene('ArenaScene').anims.get('vfx-external-hit-play').frames.length")==2
    assert page.evaluate("window.game.scene.getScene('ArenaScene').anims.get('vfx-external-attack-play').frames.length")==2
    page.evaluate(PROBE);clean(page);page.close();report['assets']['imageSpritesheetAtlas']='passed (generated test fixtures)'
    missing={'version':1,'assets':[{'role':'hit','type':'image','path':'assets/vfx/combat/hit/missing.png'}]}
    page=new_page('?mode=simulator&bots=off',routes=[('**/assets/vfx/manifest.json',lambda r:r.fulfill(json=missing))])
    assert page.evaluate("window.game.scene.getScene('ArenaScene').visualEffects.assets.size")==0
    assert page.evaluate(PROBE)==EXPECTED
    clean(page);page.close();report['assets']['missingFallback']='passed'
    print('External preload, spritesheet/atlas playback and missing-file fallback: passed',flush=True)
    for count in [10,25,40]:
        page=new_page(f'?load={count}&maxActive={count}')
        page.wait_for_function('n=>window.game.scene.getScene("ArenaScene").activePlayerManager.entries.size===n',arg=count)
        page.evaluate("window.game.scene.getScene('ArenaScene').eventSimulator.stop()")
        page.evaluate(BURST)
        page.evaluate('fn=>{window.repeatBurst=setInterval(new Function("return ("+fn+")()"),1000)}',BURST)
        result=page.evaluate(MEASURE.replace('t-start<6000',f't-start<{max(2,args.performance_seconds)*1000}'))
        page.evaluate('clearInterval(window.repeatBurst)');result['active']=count
        report['performance'].append(result);print('Performance '+json.dumps(result),flush=True)
        if count==25:page.screenshot(path=str(OUT/'after-landscape.png'))
        stress=page.evaluate(STRESS)
        page.wait_for_function('window.stoppedFx.destroyed')
        stress['destroyed']=page.evaluate('window.stoppedFx.metrics()')
        report['stress'].append({'active':count,**stress})
        for sample in stress['samples']:
            m=sample['metrics'];assert m['particles']['allocated']<=m['particles']['capacity'];assert m['effects']<=m['limit']
            assert m['presentations']['active']<=1 and m['presentations']['pending']<=m['presentations']['capacity']
        last=stress['samples'][-1]['metrics'];earlier=stress['samples'][1]['metrics']
        for pool in ['particles','sprites','labels']: assert last[pool]['allocated']==earlier[pool]['allocated'],pool
        drained=stress['drained']['metrics'];assert drained['particles']['active']==0 and drained['effects']==0 and drained['playerStates']==0
        assert drained['presentations']['active']==0 and drained['presentations']['pending']==0
        assert stress['drained']['timers']==stress['before']['timers']
        assert stress['drained']['tweens']==stress['before']['tweens']
        for pool in ['particles','sprites','labels']: assert stress['destroyed'][pool]['allocated']==0
        clean(page);page.close()
    page=new_page('?load=25&layout=portrait',True);page.wait_for_timeout(2200);page.screenshot(path=str(OUT/'after-portrait.png'));clean(page);page.close()
    (OUT/'results.json').write_text(json.dumps(report,indent=2))
    context.close();browser.close()
print('VFX browser checks: passed; report '+str(OUT/'results.json'),flush=True)
