# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.04 — Combate automático (aguardando validação no computador)**

A v0.03 — Movimento automático foi aprovada no computador real. Esta versão adiciona combate automático simples: cada personagem procura o adversário mais próximo dentro do alcance, ataca sozinho com intervalo entre ataques e exibe um efeito visual curto.

Ainda não existem dano/vida, morte/respawn, pontuação, ranking, WebSocket ou integração com TikTok.

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

## Resultado esperado da v0.04

A tela deve mostrar:

- a arena 2D responsiva;
- seis personagens se movimentando automaticamente;
- personagens atacando automaticamente quando outro personagem entra no alcance;
- uma linha amarela rápida indicando cada ataque;
- intervalo entre ataques, sem ataque contínuo a cada frame;
- todos os `@nomes` acompanhando corretamente os personagens;
- nenhum dano, vida, morte, respawn, pontuação ou ranking.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
