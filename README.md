# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.06 — Pontuação e ranking (aguardando validação no computador)**

A v0.05 — Vida, dano, morte e respawn foi aprovada no computador real. Esta versão adiciona pontuação por eliminação e um ranking visual atualizado automaticamente durante o jogo.

Cada personagem começa com 0 pontos. Quando um personagem vivo causa o golpe final em outro personagem válido, recebe 1 ponto. A pontuação permanece após o respawn.

Ainda não existem rodadas, reset automático de pontuação, WebSocket, banco de dados ou integração com TikTok.

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

## Resultado esperado da v0.06

A tela deve mostrar:

- a arena 2D responsiva;
- seis personagens se movimentando e atacando automaticamente;
- vida, dano, morte e respawn funcionando como na v0.05;
- um painel `RANKING` visível na arena;
- todos os jogadores começando com 0 pontos;
- +1 ponto para o personagem que causar o golpe final;
- ranking ordenado automaticamente da maior para a menor pontuação;
- `@nome` e quantidade de pontos em cada linha;
- pontuação preservada após o respawn;
- vários personagens podendo pontuar durante a mesma execução;
- nenhuma rodada, reset automático de pontuação ou integração externa.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
