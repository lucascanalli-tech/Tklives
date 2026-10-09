# Validação da v0.09

Implementação preparada para teste real; nenhuma TikTok LIVE foi validada nesta sessão.

| Verificação | Resultado |
| --- | --- |
| Node.js 24.19.0 / npm 11.9.0 | Compatíveis com requisito Node 20.19+ |
| tiktok-live-connector estável no npm | 2.5.0, igual à dependência instalada |
| Instalação inicial e repetição com lockfile | Passaram; npm ci, sem alteração de versões declaradas |
| npm start / npm run start:live sem .env | Iniciaram servidor e modo SIMULATOR, sem fingir conexão TikTok |
| npm test | 20 passaram; 0 falhas, 0 pulados, 0 cancelados |
| HTTP / arquivos Phaser e módulos | Resposta funcional e tipos de conteúdo corretos |
| Arquivos privados / caminho codificado de travessia | 404, incluindo .env, Git, backend e package.json |
| Servidor Node → WebSocket → navegador | Os 6 eventos sintéticos chegaram ao jogo; um único usuário |
| Simulador normal | 6 usuários, efeitos, morte, pontuação e respawn |
| Cargas 6, 10, 25, 50, 100 | Todos ativos, TOP 10 no máximo |
| 500 registrados | 100 ativos, 400 na fila |
| 1000 registrados | 100 ativos, 900 na fila |
| 1000 em portrait | 40 ativos, 960 na fila, TOP 5 |
| Rotação de fila | Verificada nas cargas acima do limite |
| Bots em LIVE UI simulada | Cederam todas as vagas para primeiras interações reais sintéticas; fora do ranking |
| Rodadas | Fim, pausa e próxima rodada sem clique; relógio reduzido apenas no teste |
| Efeitos | Orçamento global respeitado; rajada de 200 likes e gifts/combos testados |
| Backoff / conexão duplicada / desligamento pendente | Verificados por adaptadores falsos, inclusive queda durante connect |
| Layout horizontal e vertical | Renderizados e inspecionados em Chromium/Canvas |

## Comandos principais executados

```bash
bash /workspace/.live-arena-onboarding/install.sh
npm test
npm start
PORT=8081 npm run start:ws-test
python test/browser.py --websocket-port 8081
npm run start:live
```

Os servidores foram encerrados/reiniciados somente quando pertenciam a esta sessão. Ao final, o processo principal permanece no modo simulador, porque TIKTOK_USERNAME não foi fornecido.

O navegador de validação usa Canvas, fallback do Phaser.AUTO, por ser mais previsível sem GPU. O teste inicial com WebGL por software mostrou atraso do relógio de jogo na rotação; o diagnóstico confirmou que a rotação acontecia e que Canvas executava normalmente. Isso é uma limitação do teste gráfico da nuvem, não comprovação de FPS no computador da LIVE.

## Ainda pendente

LIVE real disponível, @username configurado, comentários/follows/shares/likes/gifts reais, metadata/combo de gifts do ambiente real, recuperação de uma queda real e captura em OBS/TikTok LIVE Studio. Siga o procedimento do README.

A publicação do ambiente e a restauração em uma tarefa nova não foram verificadas. Os commits desta sessão são locais; não houve push.
