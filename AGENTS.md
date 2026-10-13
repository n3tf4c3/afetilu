# Afetilu — guia do projeto

App Android/iOS para familiares e cuidadores de pessoas autistas registrarem observações do dia a dia (alimentação, sono, desconfortos, comportamentos, higiene, evacuação e momentos positivos) e levarem um resumo descritivo às consultas.

Documentos de decisão: `docs/viabilidade-e-escopo.md` (lojas, privacidade, arquitetura) e `docs/experiencia-avatar.md` (mascote slime, reações, etapas). Quando divergirem, vale o segundo.

## Regras de produto (não negociáveis)

- **Sem conteúdo clínico:** nada de diagnóstico, dose, recomendação de medicamento, dieta de exclusão, teste de alergia ou IA clínica. O app não é serviço de emergência.
- **Sem causalidade:** proximidade no tempo nunca aparece como causa. O contexto mostra só horário e distância ("Última refeição registrada: 12:30 (40 min antes)"), sem citar o alimento.
- **Falta de registro não é "sem crises":** só a marcação explícita do responsável conta como dia sem crises. Dia sem nada é "sem informação".
- **Horário do evento ≠ horário do lançamento.** `lancadoEm` nunca muda; correções viram revisões (`registro_revisao`) e sobem a versão.
- **Origem da informação** em todo registro: vi / me contaram / suspeita. Suspeita sempre identificada como tal.
- **Sem gamificação:** sem pontos, sequências ou recompensas.
- **Acessibilidade:** alvos ≥ 48 dp, rótulos para leitor de tela, nenhuma informação só por cor, o app inteiro funciona sem animações.
- **Repositório público:** não versionar referências a outros projetos, contas ou histórico com as lojas, CNPJ ou dados pessoais.

## Idiomas

- **Português (Brasil), inglês e espanhol** (neutro, latino-americano). O idioma vem do aparelho (`expo-localization`) e pode ser trocado em Ajustes; idioma não traduzido cai no inglês.
- **Nenhum texto fixo nas telas.** Textos do domínio (categorias, legendas, datas, horas, critérios de intensidade) ficam em `packages/core/src/i18n`; textos das telas em `apps/mobile/src/i18n`. Cada idioma implementa a mesma interface: faltar uma chave é erro de compilação.
- Gramática por idioma em funções do dicionário: concordância de gênero (pt/es), hora em 12 h no inglês, formato de data de cada idioma.
- **Emergência:** o SAMU (192) só aparece em pt-BR; nos outros idiomas, "número de emergência local".
- Traduções para inglês e espanhol precisam de revisão por falantes nativos antes da publicação; os critérios de intensidade, também por profissionais.

## Privacidade (invariantes)

- **Dados só no aparelho.** Sem servidor, conta, sincronização, analytics, anúncios ou rastreamento de falhas de terceiros.
- **Banco SQLite cifrado com SQLCipher** (`expo-sqlite` com `useSQLCipher`). Chave aleatória de 32 bytes no Keychain/Keystore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`). `abrirBanco` recusa abrir sem `cipher_version` (build sem cifra não grava nada).
- `android.allowBackup: false`. No iOS o arquivo pode ir para o backup do sistema, mas só cifrado e sem a chave.
- **Nenhum `console.*`** (regra de lint `no-console: error`): relatos nunca vão para logs.
- **Só dados fictícios** em desenvolvimento, testes, demonstrações e capturas. O gerador (`src/lib/dados-ficticios.ts`) aparece só em `__DEV__`.
- Exclusão apaga de verdade (`PRAGMA secure_delete = ON`; revisões em cascata).

## Stack

- Monorepo **pnpm** (`packageManager` fixado), `nodeLinker: hoisted`, React no `catalog` do `pnpm-workspace.yaml`.
- `packages/core` — domínio puro em TypeScript + Zod: tipos e limites (`LIMITES`), validação, cobertura de dias, legendas, contexto temporal, correções. Sem dependência de framework. Limites e enums são declarados só aqui.
- `apps/mobile` — Expo SDK 57 (React Native 0.86), Expo Router (`src/app`), `expo-sqlite` + SQLCipher, `expo-secure-store`, `expo-crypto`. Exige **build de desenvolvimento** (não roda no Expo Go por causa do SQLCipher).
- O conteúdo do registro fica em JSON na coluna `conteudo`, validado pelo core na leitura; as colunas `categoria`, `ocorreu_em` e `ocorreu_dia` existem para filtro e ordenação. Migrações em `src/lib/migracoes.ts`: só acrescentar ao fim.
- Lógica de tela fica em helpers puros (`src/lib/*.ts`) testados com `tsx --test`; componentes não têm teste de renderização ainda.

## Comandos (na raiz)

```sh
pnpm install --frozen-lockfile
pnpm typecheck      # core + mobile (inclui os testes)
pnpm lint           # expo lint no mobile
pnpm test           # core + helpers do mobile
pnpm android        # expo run:android (build de desenvolvimento local)
```

O CI do GitHub Actions (`.github/workflows/ci.yml`) só roda manualmente, para evitar gastar minutos a cada push: rodar `lint`, `typecheck` e `test` localmente antes de enviar.

Dentro de `apps/mobile`, instalar dependências com `pnpm exec expo install <pacote> --pnpm` (resolve versões do SDK) e conferir com `npx expo-doctor`.

## Expo muda a cada SDK

Antes de usar uma API do Expo/React Native, conferir a documentação da versão do `expo` em `apps/mobile/package.json` (`https://docs.expo.dev/versions/v<major>.0.0/`). As pastas `android/` e `ios/` são geradas (`expo prebuild`) e ficam fora do Git; configurar pelo `app.json` e plugins.

## Pendências conhecidas

- Identificador `com.afetilu.app` é provisório: fica permanente no primeiro envio às lojas.
- EAS (builds na nuvem e updates OTA) ainda não configurado: exige conta e aprovação.
- Resumo em PDF, backup cifrado escolhido pelo responsável e exclusão total pelo usuário: etapa 5.
- Mascote slime 3D: componente isolado em `apps/mobile/src/components/slime/` (react-native-filament 1.11.0, versão fixada, com patch do pnpm em `patches/` que limita o laço de render a 60 quadros/s: refazer o patch ao atualizar a biblioteca). Renderização sob demanda (liga só durante a reação). Armadilhas: `useModel` devolve objeto novo a cada render (usar o `asset`); `Skybox`/`DefaultLight` vazam memória a cada render (manter memorizados); sem `KHR_materials_transmission` (corpo por alfa). Contrato com o `.glb` testado em `reacoes.test.ts`.
- O modelo do slime é gerado por `ferramentas/slime/gerar_slime.py` (Blender 4.5 LTS, sem add-ons) e conferido por `ferramentas/slime/inspecionar-glb.mjs`; nunca editar o `.glb` à mão. Sons opcionais (`expo-audio`) sintetizados por `ferramentas/sons/gerar_sons.mjs`, desligados até a escolha e mudos no modo silencioso; no tocador, pausar antes do `seekTo(0)`. Bateria e aquecimento medidos no Galaxy A52s (`docs/experiencia-avatar.md`, 2.4); Android de entrada, build de release e iOS ainda não.
