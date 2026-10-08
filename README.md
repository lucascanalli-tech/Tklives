# Live Arena

Jogo 2D automático para TikTok LIVE.

## Versão atual

**v0.03 — Movimento automático (aguardando validação no computador)**

A v0.02 — Personagens foi aprovada no computador real. Esta versão adiciona movimento automático aos personagens: cada um escolhe direções sozinho, se movimenta simultaneamente aos demais e permanece dentro dos limites da arena com o `@nome` acompanhando sua posição.

Ainda não existem combate, vida/dano, morte/respawn, ranking, WebSocket ou integração com TikTok.

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

## Resultado esperado da v0.03

A tela deve mostrar:

- a arena 2D responsiva;
- seis personagens circulares se movimentando ao mesmo tempo;
- cada personagem mudando de direção automaticamente;
- todos os personagens permanecendo dentro dos limites da arena;
- o `@nome` acompanhando corretamente cada personagem;
- nenhum combate, vida, ranking ou integração externa.

Para encerrar o servidor, pressione `Ctrl+C` no terminal.
