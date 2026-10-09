# Assets VFX de terceiros

Data das tentativas: **2026-10-09 (UTC)**. Nenhum arquivo de terceiros foi adicionado nesta branch. `ProceduralTextures.js` gera os gráficos em runtime; esses gráficos não são frames de Cooked FX, não são Kenney e não constituem uma integração do tema Flat Night.

| Pacote solicitado | Autor | Fonte | Licença / crédito | Verificação | Arquivos usados |
|---|---|---|---|---|---|
| Cooked FX, preferência Flat Night | Não confirmado | Link oficial ainda não confirmado | Não verificados; uso de sprites pendente | Buscas externas bloqueadas; nenhum resultado oficial verificável nas fontes acessíveis | Nenhum |
| Kenney Particle Pack | Kenney, identificação do pacote solicitado | https://kenney.nl/assets/particle-pack | Não confirmados nesta sessão; não presumir uma licença | A leitura da página recebeu `Tunnel connection failed: 403 Forbidden` do proxy | Nenhum |

As buscas tentadas incluíram Google, Bing, itch.io e GitHub. Google/Bing/itch.io foram bloqueados pelo proxy. A busca pública GitHub esteve acessível, mas os resultados “CookedFX” encontrados eram projetos Java, sem confirmação de relação com o pacote pedido. `cookedfx.com` foi apenas um domínio candidato de pesquisa, também bloqueado; **não foi validado como fonte oficial**. Não há autor, URL de download ou nome de arquivo Cooked FX verificados nesta entrega.

O rascunho da configuração da nuvem recebeu domínios de pesquisa e Kenney, preservando os destinos TikTok existentes. Salvar esse rascunho não aplica a rede à instância atual. Na interface de configurações do ambiente, revise/salve as alterações e publique o ambiente para usar a configuração preparada. A disponibilidade de cada fonte precisa ser testada novamente após a aplicação.

## Instalação manual pendente

Para **Kenney Particle Pack**, abra a página acima e use o download público oferecido pelo autor. O nome real do ZIP não pôde ser verificado nesta sessão. Leia a licença na página e no arquivo recebido, conserve uma cópia do texto/licença no pacote de documentação e preencha a tabela antes de adicionar PNGs ao Git. Se houver exigência de crédito, inclua o texto exigido. Se a licença não permitir claramente o uso e a distribuição no projeto, não instale.

Para **Cooked FX / Flat Night**, a etapa pendente começa pela identificação da página do autor. A URL exata, o arquivo para baixar e sua licença **não estão confirmados**. Após identificá-los, registre o link oficial e o nome real do arquivo aqui, verifique os termos e baixe pela interface autorizada. Não substitua essa verificação por um reupload sem procedência. Não houve tentativa de contornar login, CAPTCHA ou proteção.

Extraia somente os arquivos licenciados selecionados, renomeando paths sem espaços, para estas pastas já preparadas:

| Conteúdo | Destino |
|---|---|
| Slash / ataque | `assets/vfx/combat/attack/` |
| Hit spark | `assets/vfx/combat/hit/` |
| Critical, reservado sem mecânica atual | `assets/vfx/combat/critical/` |
| Explosion / dissolve | `assets/vfx/combat/death/` |
| Portal | `assets/vfx/spawn/`, `assets/vfx/respawn/` |
| Gift / buff / confetti selecionados | `assets/vfx/gifts/common/`, `rare/`, `epic/`, `legendary/` |
| Heart e interações selecionadas | `assets/vfx/interactions/like/`, `follow/`, `share/`, `comment/` |
| Sparks / glow / partículas Kenney | `assets/vfx/environment/` |

Registre os arquivos usados, suas dimensões/frames e a data efetiva da verificação. Depois cadastre os descriptors no `assets/vfx/manifest.json`, conforme [VFX.md](VFX.md). O jogo já funciona com o fallback enquanto a instalação está pendente.

As imagens usadas pelos testes de preload são fixtures geradas em memória pelo próprio teste, sem sprites externos e sem arquivos distribuídos no diretório de assets. Phaser continua sendo a dependência existente com sua licença de pacote; este documento não altera licenças do projeto ou de dependências anteriores.
