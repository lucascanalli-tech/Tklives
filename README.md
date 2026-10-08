# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.02 — Personagens (aguardando validação no computador)**

Esta versão adiciona personagens visuais simples e estáticos dentro da arena, com suporte a vários personagens simultâneos e `@nome` acima de cada um.

Ainda não existem movimento automático, combate, vida/dano, morte/respawn, ranking, WebSocket ou integração com TikTok.

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

## Resultado esperado da v0.02

A tela deve mostrar:

- a arena 2D responsiva da v0.01;
- seis personagens circulares parados dentro dos limites da arena;
- um `@nome` visível acima de cada personagem;
- nenhum movimento ou combate.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
