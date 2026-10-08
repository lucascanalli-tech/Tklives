# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.07 — Simulador de eventos (aguardando validação no computador)**

A v0.06 — Pontuação e ranking foi aprovada no computador real. Esta versão adiciona uma camada interna padronizada de eventos e um simulador local capaz de gerar `JOIN`, `COMMENT`, `LIKE`, `FOLLOW`, `GIFT` e `SHARE` sem conexão com o TikTok.

Eventos `JOIN` criam personagens automaticamente quando o `userId` ainda não existe. Um `JOIN` repetido do mesmo usuário não cria personagem duplicado. Os personagens criados entram normalmente em movimento, combate, vida, morte, respawn, pontuação e ranking.

A tela também exibe um painel simples com os eventos simulados recebidos em tempo real.

Ainda não existe conexão real com TikTok, autenticação TikTok, WebSocket externo, banco de dados, rodadas ou efeitos especiais de gifts/likes/comentários.

## Contrato interno de eventos

Todo evento publicado pelo jogo possui pelo menos:

```js
{
  type: 'JOIN',
  userId: 'sim-001',
  username: '@Lucas',
  timestamp: 0
}
```

Tipos suportados:

- `JOIN`
- `COMMENT`
- `LIKE`
- `FOLLOW`
- `GIFT`
- `SHARE`

Eventos podem incluir dados adicionais, como `message`, `count`, `giftName` e `quantity`.

## Requisitos

- Node.js 18 ou superior
- npm

## Executar localmente

```bash
npm install
npm start
```

No Windows PowerShell, se o `npm.ps1` estiver bloqueado, use:

```powershell
npm.cmd install
npm.cmd start
```

Abra no navegador:

```text
http://localhost:8080
```

## Resultado esperado da v0.07

Ao abrir a página:

- o título deve mostrar `LIVE ARENA • v0.07`;
- o painel `EVENTOS • SIMULADOR` deve começar a receber eventos automaticamente;
- usuários simulados devem entrar gradualmente por eventos `JOIN`;
- cada usuário deve criar apenas um personagem;
- até seis personagens simulados devem aparecer com `@nome`;
- personagens devem se movimentar, atacar, perder vida, morrer, reaparecer e pontuar normalmente;
- o ranking deve aceitar jogadores adicionados durante a execução e atualizar automaticamente;
- devem aparecer eventos `COMMENT`, `LIKE`, `FOLLOW`, `GIFT` e `SHARE` no painel;
- um `JOIN` repetido de um usuário já existente não deve criar personagem duplicado.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
