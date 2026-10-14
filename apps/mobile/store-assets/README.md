# Material das fichas das lojas

Tudo aqui é público e vai para as fichas. Nada de dado real: as capturas usam só pessoas criadas pelo gerador de dados fictícios (build de desenvolvimento).

| Arquivo | Origem | Restrições |
|---|---|---|
| `ficha-pt-BR.md`, `ficha-en.md`, `ficha-es.md` | Escritos à mão | Título até 30, descrição curta até 80 e completa até 4000 caracteres. Linguagem de diário e resumo; sem promessa de resultado, diagnóstico ou tratamento; aviso de que não é serviço médico nem de emergência (SAMU 192 só em pt-BR). |
| `icone-512.png` | `ferramentas/icone/gerar_icone.mjs` | Ícone da Google Play, 512 × 512, sem canal alfa. Não editar à mão. |
| `destaque-1024x500.png` | `ferramentas/icone/gerar_icone.mjs` | Imagem de destaque da Google Play, sem texto traduzível (serve aos três idiomas). |
| `capturas/<idioma>/` | Capturas do app no Galaxy A52s, sem as barras do sistema, centralizadas sobre o fundo da marca | 1080 × 1920 (9:16, como o Play Console pede); a do PDF é a primeira página do resumo. Refazer quando a tela mudar. |

Público-alvo: adultos (familiares e cuidadores). O mascote aparece discreto nas capturas, para a ficha não ser lida como app infantil.
