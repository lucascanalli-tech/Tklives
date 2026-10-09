# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.08 — Efeitos das interações (aguardando validação no computador)**

A v0.07 — Simulador de eventos foi aprovada no computador real. Esta versão mantém o mesmo contrato interno de eventos e adiciona efeitos visuais temporários para `COMMENT`, `LIKE`, `FOLLOW`, `GIFT` e `SHARE`.

Os efeitos são somente visuais. Eles não alteram dano, vida, pontuação ou outros atributos do personagem.

Eventos de usuários que ainda não possuem personagem são ignorados pelos efeitos sem causar erro. O evento `JOIN` continua responsável por criar o personagem apenas quando o `userId` ainda não existe.

Ainda não existe conexão real com TikTok, WebSocket externo, banco de dados, rodadas, bônus permanentes, classes ou economia.

## Efeitos da v0.08

- `COMMENT`: mostra temporariamente a mensagem próxima ao personagem;
- `LIKE`: mostra um coração com a quantidade de likes;
- `FOLLOW`: mostra um destaque verde e a mensagem `NOVO FOLLOW`;
- `GIFT`: mostra um efeito mais destacado com nome e quantidade do presente;
- `SHARE`: mostra ondas azuis e a indicação `SHARE`;
- `JOIN`: mantém somente a criação do personagem, sem efeito adicional.

Todos os efeitos desaparecem automaticamente.

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

## Resultado esperado da v0.08

Ao abrir a página:

- o título deve mostrar `LIVE ARENA • v0.08`;
- usuários simulados devem continuar entrando por `JOIN` sem duplicidade;
- o painel de eventos deve continuar funcionando;
- `COMMENT` deve exibir a mensagem temporariamente próxima ao personagem;
- `LIKE` deve exibir um coração e a quantidade de likes;
- `FOLLOW` deve destacar o personagem temporariamente;
- `GIFT` deve gerar o efeito visual mais destacado e mostrar nome/quantidade;
- `SHARE` deve gerar ondas visuais azuis;
- todos os efeitos devem desaparecer automaticamente;
- movimento, combate, vida, morte, respawn, pontuação e ranking devem continuar funcionando;
- nenhum efeito deve alterar dano, vida ou pontuação.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
