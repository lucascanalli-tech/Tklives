# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.05 — Vida, dano, morte e respawn (aguardando validação no computador)**

A v0.04 — Combate automático foi aprovada no computador real. Esta versão transforma os ataques em combate real: cada personagem começa com 100 de vida, recebe 20 de dano por ataque, exibe uma barra de vida, morre ao chegar a zero e reaparece automaticamente após aproximadamente 2 segundos com vida cheia em uma nova posição válida da arena.

Personagens mortos não se movimentam nem atacam enquanto aguardam o respawn.

Ainda não existem pontuação, ranking, rodadas, WebSocket ou integração com TikTok.

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

## Resultado esperado da v0.05

A tela deve mostrar:

- a arena 2D responsiva;
- seis personagens se movimentando e atacando automaticamente;
- uma barra de vida acompanhando cada personagem;
- 100 de vida máxima por personagem;
- redução de 20 de vida a cada ataque recebido;
- desaparecimento do personagem quando a vida chega a zero;
- personagem morto sem movimento e sem ataques;
- respawn automático após aproximadamente 2 segundos;
- retorno com vida cheia em uma posição válida da arena;
- vários personagens podendo morrer e reaparecer de forma independente;
- todos os `@nomes` acompanhando corretamente os personagens;
- nenhuma pontuação, ranking, rodada ou integração externa.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
