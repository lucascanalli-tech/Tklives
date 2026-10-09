# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.09 — TikTok + backend (aguardando validação no computador e LIVE real)**

A v0.08 — Efeitos das interações foi aprovada no computador real. Esta etapa adiciona uma camada separada de backend capaz de receber eventos reais do TikTok LIVE, normalizá-los e encaminhá-los por WebSocket para o mesmo `EventBus` já usado pelo simulador.

O jogo continua sem depender diretamente da biblioteca TikTok. O `EventSimulator` permanece disponível para testes locais.

## Fluxo da v0.09

```text
TikTok LIVE
  -> TikTokConnector
  -> TikTokEventMapper
  -> WebSocket
  -> WebSocketEventSource
  -> EventBus
  -> Live Arena
```

Eventos internos suportados:

- `JOIN`
- `COMMENT`
- `LIKE`
- `FOLLOW`
- `GIFT`
- `SHARE`

Exemplo:

```js
{
  type: 'COMMENT',
  userId: '123',
  username: '@usuario',
  timestamp: 0,
  message: 'Olá'
}
```

A primeira interação recebida de um usuário também gera um `JOIN` local antes do evento original quando necessário. Assim, um comentário, like, follow, gift ou share pode criar o personagem mesmo se o evento de entrada da LIVE não chegar.

Gifts em sequência são enviados ao jogo apenas quando a sequência termina, evitando processar várias vezes o mesmo presente enquanto o contador ainda está aumentando.

## Requisitos

- Node.js 20 ou superior
- npm

## Teste local com simulador

```bash
npm install
npm start
```

Abra:

```text
http://localhost:8080
```

O simulador continua ligado por padrão e deve se comportar como na v0.08.

No Windows PowerShell, se o `npm.ps1` estiver bloqueado, use:

```powershell
npm.cmd install
npm.cmd start
```

## Teste do WebSocket sem TikTok LIVE

Antes da LIVE real, execute:

```bash
npm run start:ws-test
```

Abra:

```text
http://localhost:8080/?simulator=off
```

A cada 3 segundos o backend enviará um `COMMENT` de `@WebSocketTest`. Mesmo sem um `JOIN` anterior, o jogo deve criar esse personagem automaticamente e mostrar `WebSocket OK`. Isso confirma o caminho `backend -> WebSocket -> EventBus` sem depender do TikTok.

## Preparar teste com TikTok LIVE real

1. Copie `.env.example` para um novo arquivo chamado `.env`.
2. Troque `@seu_usuario` pelo @ da conta que estará em LIVE.
3. Inicie a LIVE no TikTok.
4. No terminal, execute:

```bash
npm run start:live
```

No Windows PowerShell, se necessário:

```powershell
npm.cmd run start:live
```

5. Abra o jogo com o simulador desligado:

```text
http://localhost:8080/?simulator=off
```

Resultado esperado no terminal:

```text
[SERVER] Live Arena em http://localhost:8080
[WS] WebSocket em ws://localhost:8080/events
[TIKTOK] Conectando a @seu_usuario...
[TIKTOK] Conectado à sala ...
[WS] Jogo conectado.
```

Quando uma interação real chegar, o terminal deverá mostrar algo como:

```text
[EVENT] COMMENT @usuario -> 1 cliente(s)
```

No jogo, o usuário deverá aparecer automaticamente e o comentário/gift/etc. deverá gerar o efeito já existente.

## Segurança

Nunca coloque cookies, tokens, senhas ou credenciais no código. O arquivo `.env` está ignorado pelo Git e `.env.example` não contém informações privadas.

## Observação sobre a conexão TikTok

A v0.09 usa `tiktok-live-connector` somente dentro de `server/tiktok/TikTokConnector.js`. A biblioteca é não oficial e baseada no serviço interno de Webcast do TikTok, então mudanças do TikTok podem exigir troca ou atualização do conector no futuro. Essa troca não deve exigir mudanças na lógica do jogo.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
