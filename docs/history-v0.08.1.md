# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão em validação

**v0.08.1 — Escalabilidade básica (aguardando teste de carga no computador)**

A v0.08 — Efeitos das interações foi aprovada no computador real. Antes de validar a v0.09 em LIVE real, esta correção separa usuários registrados/interagindo dos personagens pesados que estão simultaneamente renderizados e combatendo na arena.

A `main` já continha o trabalho preliminar de backend/WebSocket da v0.09. Esse código foi preservado, mas não foi ampliado nesta etapa. A validação da v0.08.1 deve focar somente na escalabilidade local.

## Arquitetura da v0.08.1

```text
Evento
  -> EventBus
  -> ParticipantRegistry
      -> usuário registrado (leve)
      -> fila, se arena cheia
  -> ActivePlayerManager
      -> somente personagens ativos
      -> Player / movimento / combate / vida
```

Não existe limite global de 25 usuários.

O valor abaixo limita apenas personagens simultaneamente ativos/renderizados:

```js
MAX_ACTIVE_PLAYERS = 100
```

Ele fica em `game/config/GameConfig.js` e pode ser alterado futuramente sem mudar a arquitetura.

Usuários acima desse número continuam registrados em memória, continuam gerando eventos e aguardam na fila. No modo de carga acima de 100 usuários, uma rotação simples libera periodicamente uma vaga e promove o próximo usuário da fila, apenas para validar o mecanismo.

## Ranking

A pontuação fica registrada internamente por `userId`, inclusive quando o usuário sai temporariamente da arena ativa.

A interface mostra somente:

```text
TOP 10
```

O ranking visual nunca cria uma linha para cada participante registrado.

## Combate

O combate não percorre mais toda a lista global de jogadores.

Os personagens ativos são colocados em uma grade espacial simples. Cada atacante consulta somente sua célula e as células vizinhas antes de escolher o alvo mais próximo dentro do alcance.

Isso mantém a solução pequena para o MVP e reduz o custo médio da busca de alvo quando a arena contém muitos personagens.

## Eventos e rajadas de LIKE

Eventos internos suportados:

- `JOIN`
- `COMMENT`
- `LIKE`
- `FOLLOW`
- `GIFT`
- `SHARE`

Rajadas de `LIKE` do mesmo usuário são agregadas por uma pequena janela de 250 ms antes de chegar aos consumidores visuais.

`COMMENT`, `FOLLOW`, `GIFT` e `SHARE` continuam sendo enviados imediatamente. Gifts não são agregados nem descartados.

O painel visual de eventos também atualiza de forma agrupada para evitar redesenhar texto centenas de vezes durante rajadas.

## Requisitos

- Node.js 20 ou superior
- npm

## Teste normal da v0.08.1

```powershell
cd D:\projetos\Tklives
npm.cmd start
```

Abra:

```text
http://localhost:8080
```

O simulador normal continua funcionando.

## Testes de carga

Use o parâmetro `load` na URL. O modo de carga substitui o simulador normal e não inicia a fonte WebSocket, isolando o teste local.

### 10 usuários

```text
http://localhost:8080/?load=10
```

### 25 usuários

```text
http://localhost:8080/?load=25
```

### 50 usuários

```text
http://localhost:8080/?load=50
```

### 100 usuários

```text
http://localhost:8080/?load=100
```

A estrutura também aceita testes posteriores:

```text
http://localhost:8080/?load=250
http://localhost:8080/?load=500
http://localhost:8080/?load=1000
```

Cada usuário do simulador de carga possui `userId` único.

O modo de carga também gera:

- `COMMENT`
- rajadas de `LIKE`
- `FOLLOW`
- `GIFT`
- `SHARE`

Na parte inferior da arena aparece um contador semelhante a:

```text
REGISTRADOS 250 • ATIVOS 100/100 • FILA 150
```

Para 10, 25, 50 e 100 usuários, todos devem poder ficar ativos ao mesmo tempo.

Acima de 100, o esperado é manter no máximo 100 personagens gráficos e colocar os demais participantes na fila.

## Critérios principais da v0.08.1

- usuários duplicados continuam sendo identificados pelo mesmo `userId`;
- registro de usuários não cria obrigatoriamente objetos gráficos pesados;
- no máximo `MAX_ACTIVE_PLAYERS` ficam ativos;
- excedentes ficam na fila sem serem perdidos;
- vagas promovem participantes da fila;
- pontuação continua vinculada ao `userId`;
- ranking visual mostra somente TOP 10;
- movimento, combate, vida, morte e respawn continuam funcionando;
- efeitos continuam funcionando para usuários ativos;
- eventos de usuários não ativos continuam sendo aceitos;
- LIKEs são agregados em pequenas rajadas;
- gifts continuam sendo processados individualmente.

---

## Trabalho preliminar já existente para v0.09

A `main` já possui os módulos preliminares de backend/WebSocket e conector TikTok criados antes desta correção. Eles foram preservados para não perder trabalho.

**Não validar a integração real ainda.** Primeiro a v0.08.1 deve ser aprovada nos testes progressivos de carga.

### Fluxo já preparado

```text
TikTok LIVE
  -> TikTokConnector
  -> TikTokEventMapper
  -> WebSocket
  -> WebSocketEventSource
  -> EventBus
  -> Live Arena
```

O jogo continua sem depender diretamente da biblioteca TikTok. O `EventSimulator` permanece disponível para testes locais.

A primeira interação recebida de um usuário também pode chegar ao mesmo `EventBus`; com a v0.08.1, qualquer primeira interação válida registra esse `userId` e solicita entrada na arena ativa ou na fila.

### Teste do WebSocket sem TikTok LIVE — somente depois da v0.08.1

```bash
npm run start:ws-test
```

Abra:

```text
http://localhost:8080/?simulator=off
```

### Preparar teste com TikTok LIVE real — somente depois da v0.08.1

1. Copie `.env.example` para um novo arquivo chamado `.env`.
2. Troque `@seu_usuario` pelo @ da conta que estará em LIVE.
3. Inicie a LIVE no TikTok.
4. Execute:

```powershell
npm.cmd run start:live
```

5. Abra:

```text
http://localhost:8080/?simulator=off
```

## Segurança

Nunca coloque cookies, tokens, senhas ou credenciais no código. O arquivo `.env` está ignorado pelo Git e `.env.example` não contém informações privadas.

## Observação sobre a conexão TikTok

O trabalho preliminar da v0.09 usa `tiktok-live-connector` somente dentro de `server/tiktok/TikTokConnector.js`. A biblioteca é não oficial e mudanças do TikTok podem exigir troca ou atualização do conector no futuro. Essa troca não deve exigir mudanças na lógica do jogo.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
