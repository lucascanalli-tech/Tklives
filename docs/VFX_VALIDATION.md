# Relatório da atualização visual

Validado em 2026-10-09. Base v0.09.0: `82e27c43ac099d4b3d851b7b7bacbe8e11da7c6c`. Branch `feat/vfx-upgrade`. Implementação validada até `505776d`, seguida do commit dos testes. Nenhum merge em `main` faz parte desta entrega.

## Antes e depois

Antes: linha instantânea de ataque, anéis simples, punch por tween e textos descartáveis; presentes em três categorias de gameplay, sem uma fila de apresentação.

Depois: slash/projétil com trail; sparks e punch local; dissolve da cópia visual da morte; portais de spawn/respawn; quatro tiers de apresentação para gifts; banner global único com fila e prioridade; partículas reutilizadas; balões limitados; ambiente discreto; qualidade configurável e laboratório de 13 prévias. Tudo funciona sem sprites externos.

| Layout | Antes | Depois | Laboratório |
|---|---|---|---|
| 16:9 | [Imagem](vfx/before-landscape.png) | [Imagem](vfx/after-landscape.png) | [Imagem](vfx/after-debug-landscape.png) |
| 9:16 | [Imagem](vfx/before-portrait.png) | [Imagem](vfx/after-portrait.png) | [Imagem](vfx/after-debug-portrait.png) |

As imagens de carga ilustram a apresentação em capturas distintas; posições variam naturalmente entre execuções. A comparação determinística abaixo mede gameplay com a mesma sequência de sorteios.

## Arquivos e motivo

| Arquivo / grupo | Mudança |
|---|---|
| `EffectManager`, `VisualEffects` | API central de apresentação, lifecycle e compatibilidade com os call sites existentes |
| `VfxAssets`, `ProceduralTextures`, `assets/vfx/manifest.json` | Preload validado, suporte a image/spritesheet/atlas, texturas de fallback |
| `ObjectPool`, `ParticlePool` | Reutilização de sprites, textos, corações, projectiles e sparks com capacidades e métricas |
| `CombatEffects`, `DeathEffects`, `RespawnEffects` | Implementação dos efeitos de combate, dissolve e portais |
| `Player`, `HealthSystem` | Apenas encaminhamento de apresentação e limpeza; vida/morte/posição continuam nas mesmas operações |
| `GiftVisualConfig`, `GiftPresentation`, `PresentationQueue` | Tiers independentes dos bônus, snapshots visuais, prioridade e limite de banners |
| `GiftEffects`, `InteractionEffects`, `InteractionPresentation` | Adaptadores visuais, mantendo aplicação de bônus e cooldowns existentes |
| `ScreenEffects`, `VfxConfig` | Ambiente, flash/shake controlados, qualidade e RNG visual isolado |
| `ArenaScene` | Preload, update e cleanup da camada; criação condicional do laboratório |
| `VfxDebugController`, `VfxScenarios`, `EventSimulator`, `style.css` | Prévia opt-in, atores não registrados e cenários sem eventos de gameplay |
| `server/server.js` | Servir apenas PNG/WebP/JSON públicos da árvore VFX, mantendo proteção de paths e symlinks |
| `test/vfx.test.js`, `test/vfx_browser.py`, fixture, `test/server.test.js` | Regressão determinística, assets ausentes, pools, prioridade, HTTP e performance |
| `docs/VFX.md`, `THIRD_PARTY_ASSETS.md`, pastas e exemplos | Uso local, arquitetura, licença pendente e instalação futura |

Arquivos integralmente iguais à base: `AutoCombat`, `AutoMovement`, `GameConfig`, `InteractionConfig`, `GiftConfig`, `GiftManager`, `ScoreSystem`, `ParticipantRegistry`, `ActivePlayerManager`, `BotManager`, `RoundManager`, `EventBus`, `InternalEvent`, `WebSocketEventSource`, módulos TikTok/gateway/normalização/configuração/viewers, `package.json` e lockfile.

## Regressão de gameplay

O baseline foi capturado **antes de modificar o código**. O teste repete a mesma sequência no navegador em LOW, MEDIUM e HIGH e compara o resultado completo com `test/fixtures/vfx-gameplay-baseline.json`.

| Regra / cenário | Base | Depois |
|---|---|---|
| HP inicial / máximo | 100 | 100 |
| Primeiro ataque normal | 20 de dano; alvo vai a 80 HP | Igual |
| Alcance / cooldown / busca sem alvo | 150 px / 900 ms / 180 ms | Arquivo de combate idêntico |
| Ataque dentro do cooldown | HP permanece 80 | Igual |
| Ataque com energia 50 e multiplicador 1,25 | 31 de dano; HP 49; energia 46 | Igual |
| Targeting | Alvo mais próximo, `probe-1` | Igual |
| Movimento com seed fixa | x 198,89982114026935; y 249,46209813342054 | Igual, incluindo direção, velocidade e próximo sorteio |
| Morte | HP 0, morto e oculto imediatamente; +1 ponto | Igual |
| Respawn | Delay 2.000 ms; HP 100; vivo | Igual |
| Posição de respawn com seed fixa | x 701,8564768144861; y 214,33231246843934 | Igual |
| FOLLOW após dano | HP 65; energia 61; boost 1,25 | Igual |
| Rose ×2 após FOLLOW | HP 71; energia 77; boost 1,3; 2 unidades e 1 gift processado | Igual |
| Identidades / fila / ranking / bots | Comportamento da base | Testes existentes passaram; arquivos lógicos idênticos |
| Streak / combo / dedup / LIKE agrupado | Comportamento da base | Testes existentes passaram; regras e configurações idênticas |

Os efeitos não registram critical hit, dano atrasado, alteração de hitbox, pause ou slow motion. A animação do projétil é independente do dano já aplicado. A morte visual termina em 520 ms e não altera o timer de respawn.

## Testes executados

- `npm test`: **27 testes passaram** (20 existentes e sete testes VFX). Inclui servidor HTTP e WebSocket real com fixtures normalizadas, seis tipos de evento, reconexão, agregação, combos e fila.
- `python test/browser.py`: passou nas cargas 6, 10, 25, 50, 100, 500 e 1.000, além do simulador normal, rounds, mortes/respawns, bots cedendo vaga e layout vertical. Com 1.000 registrados: landscape 100 ativos / 900 em fila; portrait 40 ativos / 960 em fila.
- `python test/vfx_browser.py`: comparação de gameplay nas três qualidades; 13 prévias em 16:9 e 9:16; nenhum gift/evento de gameplay aplicado pelas prévias; preload de image/spritesheet/atlas; missing-file fallback; carga 10/25/40; 40 ciclos de saturação por carga; drenagem e shutdown completos.
- Três restarts de cena: pools anteriores zerados, um único painel debug e nenhum erro de navegador. Checkbox shake desligado: deslocamento da câmera igual a zero em LEGENDARY.
- Imagens de ambos os layouts revisadas. O painel de debug não aparece no jogo normal.

O teste de assets usa PNGs e atlas gerados em memória pelo próprio teste. Isso valida o caminho de instalação futura; não significa que os pacotes Cooked FX/Kenney foram baixados.

## Performance medida

Node 24.19.0; Phaser 3.90.0; Chromium 151.0.7922.173 headless, **renderer Canvas**, viewport 1280×720. Sem execução simultânea de outro teste de navegador durante as medições. Seis segundos por carga. Baseline e versão atual receberam rajadas a cada segundo de **100 eventos LIKE, dez COMMENT e cinco GIFT**, junto do combate automático.

| Ativos | FPS antes | FPS depois | P95 frame depois | VFX ativos no fim | Partículas ativas / limite no fim | Tweens totais no fim |
|---:|---:|---:|---:|---:|---:|---:|
| 10 | 59,8 | 60,0 | 16,7 ms | 46 / 100 | 171 / 224 | 0 |
| 25 | 60,0 | 59,8 | 16,7 ms | 66 / 100 | 192 / 224 | 3 |
| 40 | 60,0 | 59,8 | 16,7 ms | 67 / 100 | 205 / 224 | 0 |

Os três tweens na captura de 25 pertencem ao restante do jogo; a camada nova criou **zero tweens e zero timers visuais**. Os timers totais de gameplay variam com mortes/respawns. No teste isolado de apresentação, suas contagens permaneceram iguais: 5, 13 e 17 antes/depois para as três cargas.

Na qualidade MEDIUM, o pico de partículas chegou a 224, o limite configurado. Em saturação, partículas/textos e snapshots de banners podem ser omitidos; eventos e bônus permanecem processados pelas classes originais. Os pools têm mais objetos retidos que o sistema anterior de criar/destruir, de forma deliberada e limitada.

Após 40 ciclos virtuais de bursts/ataques/morte/respawn:

| Ativos | Sprites alocados, ciclo 20 → 40 | Textos alocados | Partículas alocadas | Depois da drenagem |
|---:|---:|---:|---:|---|
| 10 | 86 → 86 | 14 → 14 | 224 → 224 | 0 efeitos / 0 partículas / 0 estados temporários / fila vazia |
| 25 | 99 → 99 | 14 → 14 | 224 → 224 | Igual |
| 40 | 99 → 99 | 14 → 14 | 224 → 224 | Igual |

Shutdown da cena: todos os pools ficaram com zero objetos alocados. Banner global ativo nunca excedeu um; fila pendente nunca excedeu oito. Dados completos: [validation-results.json](vfx/validation-results.json).

## Assets e limites da validação

Não foram integrados arquivos externos; fontes/licenças não puderam ser confirmadas pela rede disponível. O fallback está pronto. A instalação Cooked FX/Flat Night e Kenney permanece manual, conforme [THIRD_PARTY_ASSETS.md](THIRD_PARTY_ASSETS.md). Não há alegação de licença CC0, autor Cooked FX ou arquivo de download verificados sem evidência.

A medição curta neste Chromium Canvas não garante 60 FPS em todo PC, renderer WebGL/GPU, stream OBS ou LIVE de horas. Os ciclos de saturação avançam tempo visual de forma determinística e verificam limites/limpeza; não simulam horas de tráfego real. TikTok LIVE real não foi usado nesta tarefa; seus módulos e contratos foram preservados e os testes locais passaram.

Para revisão manual, siga [VFX.md](VFX.md), teste os quatro tiers no laboratório, desligue shake, compare as qualidades e use `?load=40&maxActive=40`. A branch fica disponível para revisão; merge em `main` deve ser uma ação separada.
