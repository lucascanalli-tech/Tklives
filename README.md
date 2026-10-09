# LIVE ARENA — v0.09

Arena automática em Phaser 3 para OBS/TikTok LIVE Studio. Mantém o simulador, movimento, combate, morte/respawn, pontuação por `userId`, grade espacial e fila da v0.08.1.

**Status:** implementado e testado localmente com eventos simulados. **Aguardando validação em uma TikTok LIVE real.** Um WebSocket conectado ao nosso servidor não comprova conexão ao TikTok.

## Executar

Requer Node.js **20.19+** (22/24 recomendado) e npm. Não usa banco de dados nem etapa de build.

```bash
cd Tklives
npm ci
npm start
```

Abra `http://localhost:8080/?mode=simulator`. No Windows, use `npm.cmd` caso o PowerShell bloqueie `npm.ps1`.

O servidor escuta em `127.0.0.1:8080` por padrão. `PORT` e `HOST` permitem alteração; configure `HOST=0.0.0.0` apenas quando precisar acesso de outro dispositivo. HTTP e WebSocket usam a mesma porta; `WS_PORT` não é necessário.

## Modos e layouts

| URL local | Uso |
| --- | --- |
| `http://localhost:8080/` | Detecta o modo do backend: simulador sem username; LIVE com username |
| `http://localhost:8080/?mode=simulator` | Simulador de seis usuários, sem receber eventos reais |
| `http://localhost:8080/?mode=live` | Somente eventos do backend, com bots enquanto faltarem espectadores |
| `http://localhost:8080/?mode=live&layout=portrait` | LIVE vertical 9:16 |
| `http://localhost:8080/?mode=simulator&layout=portrait` | Simulador vertical |
| `http://localhost:8080/?load=1000` | Carga local, isolada da fonte TikTok |
| `http://localhost:8080/?mode=live&maxActive=30` | Máximo de 30 personagens, sem limitar espectadores |
| `http://localhost:8080/?mode=live&bots=off` | LIVE sem bots |

`layout=landscape`: 1280×720, TOP 10. `layout=portrait`: 540×960, TOP 5, com espaço reservado nas extremidades. O Phaser ajusta a escala uniformemente; não estique a fonte no OBS.

O padrão é 100 personagens no simulador horizontal e 40 no modo LIVE/vertical. O máximo permitido está em `game/config/GameConfig.js`. `maxActive` ajusta esse limite dentro do teto configurado. Registrados acima do limite continuam na fila, recebem interações e são promovidos por rotação a cada 5 segundos. A pontuação permanece vinculada ao `userId` durante a rotação. Bots têm IDs próprios, cedem vagas e ficam fora do ranking.

Cada rodada dura 120 segundos, pausa por 8 segundos e reinicia automaticamente. O ranking mostra a pontuação da rodada; o registro de participantes permanece. Não exige cliques.

## Configurar seu @username e conectar à LIVE

1. Copie `.env.example` para `.env`. Não sobrescreva um arquivo já configurado.
2. Preencha **somente no arquivo local**, por exemplo:

   ```dotenv
   TIKTOK_USERNAME=@seu_usuario
   PORT=8080
   ```

3. Inicie sua TikTok LIVE.
4. Execute:

   ```bash
   npm run start:live
   ```

5. Abra `http://localhost:8080/?mode=live&layout=portrait`.
6. Confirme `[TIKTOK] CONNECTED` no terminal **e** “TIKTOK CONECTADO” na interface.
7. Use outra conta para enviar as interações abaixo. Confirme tanto os logs quanto o comportamento do jogo.

O username deve ser o identificador público, sem URL. A integração também aceita `TIKTOK_USERNAME` já injetado no processo; nesse caso, `npm start` usa a variável. O comando `start:live` lê `.env` quando ele existe.

`TIKTOK_SIGN_API_KEY` é **opcional**: só configure uma chave Euler Stream se o serviço de assinatura exigir acesso. Insira-a em `.env` ou nas configurações seguras do ambiente, nunca no Git/chat/frontend. Não há cookie, sessionId ou login implementado no MVP. A ausência dessa chave não foi tratada como erro antecipadamente.

O conector reconecta com backoff de aproximadamente 1, 2, 4…60 segundos e pequena variação. Se a LIVE estiver offline, continua tentando enquanto o jogo e os bots permanecem funcionando. O WebSocket do navegador também reconecta automaticamente. Logs preservam os diagnósticos de resolução da sala. Encerre com `Ctrl+C`.

## Procedimento exato de validação real

| Interação pela segunda conta | Conferir |
| --- | --- |
| COMMENT: enviar “teste arena” antes de qualquer JOIN observado | Log `[TIKTOK] Comment`; um único participante; @ no personagem; balão curto |
| LIKE: enviar várias curtidas | Energia/♥ agrupados; o usuário mantém o mesmo `userId`; TikTok pode entregar somente parte das curtidas |
| FOLLOW: seguir o streamer com uma conta que ainda não o segue | Aura verde e bônus temporário; evento FOLLOW no painel horizontal |
| SHARE: compartilhar a LIVE | Onda azul, bônus e evento SHARE |
| GIFT: enviar um presente conhecido | Log `[TIKTOK] Gift @usuario Nome (ID) xN`; destaque dourado; remetente correto |
| GIFT em combo: enviar uma sequência de 3 e encerrá-la | Um efeito lógico com total 3; nenhum total aplicado nos eventos intermediários |
| GIFT desconhecido | Nome/ID/quantidade preservados; efeito padrão sem erro |
| Queda temporária de rede | HUD muda para RECONECTANDO; jogo continua; volta a CONNECTED sem duplicar conexão/personagem |

Algumas ações, como seguir novamente, não geram outro evento. A biblioteca/TikTok não garantem entrega de todos os JOINs/LIKEs; por isso qualquer primeira interação válida registra o usuário. Comente novamente depois de uma reconexão para confirmar a entrega de ponta a ponta. Não faça repetidos gastos para depurar: valide inicialmente com eventos sintéticos e, no teste real, com um presente pequeno.

`GET /api/status` informa estado público, username, usuários reconhecidos pelo backend e eventos aceitos. Não contém segredos. Conteúdo bruto do TikTok não é enviado ao navegador.

## OBS / TikTok LIVE Studio

Adicione uma **Fonte de navegador / Browser Source**, use a URL local LIVE acima e configure:

- horizontal: largura 1280, altura 720;
- vertical: largura 540, altura 960 (ou escale proporcionalmente para 1080×1920).

Mantenha a fonte ativa durante a transmissão. Use o teste de carga no computador que fará a LIVE antes de decidir o número de personagens ativos. A aplicação já abre sem controles ou botões sobre a arena. O endereço local é para o OBS no mesmo computador; a configuração da nuvem não publica um site/preview.

## Testes sem TikTok

```bash
npm test
npm run start:ws-test
```

O segundo comando envia JOIN, COMMENT, LIKE, FOLLOW, SHARE e GIFT sintéticos, um por segundo, pelo **mesmo gateway** do TikTok. Abra `http://localhost:8080/?mode=live&bots=off`. A indicação TikTok continua desconectada: este teste não é uma LIVE real. Encerre um servidor antes de iniciar outro na mesma porta.

Cargas suportadas: `?load=6`, `10`, `25`, `50`, `100`, `500`, `1000`; acrescente `&layout=portrait` para a versão vertical. Além dos seis tipos de evento, o simulador cobre primeira interação antes do JOIN, usuário repetido, mesmo username com IDs diferentes, comentário longo, gift desconhecido, combo e rajada de 200 likes.

Os testes Node cobrem normalização, identidade, deduplicação, primeira interação, agregação, gifts/combos, backoff, parada de conexão pendente, reconexão do browser, fila, ranking, rodadas e WebSocket/HTTP reais com mensagens sintéticas.

Há também `npm run test:browser`: exige Python com Playwright e Chromium, disponíveis no ambiente de nuvem. Com os servidores 8080 e 8081 ativos, execute:

```bash
python test/browser.py --websocket-port 8081
```

Para iniciar o segundo servidor: `PORT=8081 npm run start:ws-test` no Bash; no PowerShell, use `$env:PORT=8081; npm.cmd run start:ws-test`. A verificação usa Canvas, fallback suportado do Phaser em máquinas sem GPU. `--renderer webgl` permite repetir com WebGL por software, mas não mede desempenho do computador/OBS real. Capturas ficam fora do checkout.

## Arquitetura e configuração

```text
TikTokConnector (somente server/tiktok importa a biblioteca)
  → TikTokEventMapper
  → EventNormalizer (contrato compartilhado)
  → ViewerRegistry (userId)
  → EventGateway / WebSocket
  → EventBus
  → ParticipantRegistry / ActivePlayerManager
  → combate, GiftManager, efeitos, ranking, HUD

Simulador → mesmo contrato/normalização → EventBus → mesmos consumidores
```

Formato interno:

```js
{
  type: 'GIFT',
  userId: '123456',
  username: '@usuario',
  timestamp: 123456789,
  eventId: 'id-da-mensagem-quando-fornecido',
  data: {
    giftId: '5655',
    giftName: 'Rose',
    quantity: 3,
    repeatCount: 3,
    repeatEnd: true,
    giftType: 1,
    groupId: 'id-do-combo-quando-fornecido',
    diamondCount: null
  }
}
```

| Arquivo | Responsabilidade/configuração |
| --- | --- |
| `server/tiktok/TikTokConnector.js` | Adaptador substituível, estados e backoff |
| `server/tiktok/TikTokEventMapper.js` | Campos reais da biblioteca 2.5.0 → contrato interno |
| `server/events/EventNormalizer.js`, `game/events/InternalEvent.js` | Validação comum e limites |
| `server/viewers/ViewerRegistry.js` | Identidade independente do username |
| `server/websocket/EventGateway.js` | Deduplicação e publicação |
| `game/gifts/GiftManager.js`, `GiftConfig.js`, `GiftEffects.js` | Combos, mapeamento editável e apresentação |
| `game/config/InteractionConfig.js` | Energia, cura, bônus, cooldown visual |
| `game/config/GameConfig.js` | Limite ativo, rodadas, agregação, orçamento visual |
| `game/config/LayoutConfig.js` | Áreas horizontal/vertical sem duplicar o jogo |
| `game/arena/BotManager.js`, `RoundManager.js` | Funcionamento autônomo |
| `game/player/Player.js`, `game/effects/VisualEffects.js` | Personagens procedurais e efeitos limitados |
| `game/hud/LiveHud.js`, `game/ranking/RankingView.js` | Status real da conexão e TOP 5/10 |

Eventos continuam aceitos mesmo quando um visual é descartado. Os bônus visuais usam cooldown por personagem e um orçamento global. Gifts de usuários na fila permanecem registrados e aparecem no aviso; o bônus no personagem exige que ele esteja ativo. Comentários têm até 200 caracteres no contrato e 64 no balão. IDs de replay têm armazenamento limitado e expiram em 2 minutos.

Gifts `giftType=1` aplicam somente o total terminal `repeatEnd=true`, conforme a documentação instalada. Duplicatas são identificadas por mensagem e/ou grupo quando esses IDs existem; sem identificador da origem, duas entregas iguais não podem ser distinguidas com segurança de dois presentes legítimos. Não se inventa preço/diamantes, nem se aplica um combo interrompido sem seu evento final. O mapeamento usa IDs/nomes explícitos ou `diamondCount` realmente informado pela origem; presentes desconhecidos têm fallback.

## Limitações e evidência

- `tiktok-live-connector@2.5.0` foi confirmado como versão estável pelo registry npm e sua documentação instalada foi consultada. É um conector **não oficial**; a própria biblioteca declara que não é uma API de produção garantida. Mudanças de protocolo, assinatura, região e limites podem impedir conexão.
- Nenhuma alternativa oficial pública adequada para este fluxo foi configurada. Os eventos deste MVP vêm do serviço Webcast por esse adaptador, sem depender de aprovação de uma API oficial.
- Estado fica em memória. Reiniciar servidor/página não restaura a rodada anterior; espectadores são reconhecidos novamente por suas próximas interações.
- Os testes de rede/conexão usam adaptadores falsos ou mensagens sintéticas. Comentário, gift, combo, metadados e queda/reconexão **ainda exigem LIVE real**.
- Carga no Chromium da nuvem confirma os limites e funcionamento, não garante FPS nem valida captura no OBS/TikTok LIVE Studio do seu computador.
- Na nuvem, os destinos necessários incluem `*.tiktok.com`, `*.tiktokv.com` e `api.eulerstream.com`; o endpoint WebSocket final varia por sala/região.
- `.env` e `node_modules` são ignorados; servidor só entrega os arquivos públicos do jogo, não `.env`, Git, backend ou manifestos.

[Histórico preservado da v0.08.1](docs/history-v0.08.1.md).
## Atualização visual VFX

A atualização de apresentação está na branch `feat/vfx-upgrade`, baseada na v0.09.0. Ela inclui pools de efeitos, combate visual, dissolve/portais, quatro tiers de gifts, qualidade LOW/MEDIUM/HIGH e laboratório `?debugVfx=1`, preservando as regras de gameplay.

Para testar um clone existente no Windows:

```powershell
cd D:\projetos\Tklives
git fetch origin
git switch feat/vfx-upgrade
npm.cmd ci
npm.cmd start
```

Abra `http://localhost:8080/?mode=simulator&debugVfx=1`. Os comandos precisam ser executados dentro de `Tklives`, que contém `.git` e `package-lock.json`.

- [Guia de VFX, arquitetura e primeiro clone](docs/VFX.md)
- [Resultados, comparação de gameplay e imagens](docs/VFX_VALIDATION.md)
- [Assets externos e licenças pendentes](docs/THIRD_PARTY_ASSETS.md)

Os efeitos procedurais funcionam agora. Cooked FX/Flat Night e Kenney não foram importados porque suas licenças não puderam ser verificadas nesta rede.
