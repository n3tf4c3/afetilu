# Achados de auditoria técnica

Registro iniciado em 21/10/2026. Antes do bootstrap não havia ledger nem IDs encontrados em `git log --all --grep=achado -i`. Snapshot auditado: `a83fdfe69913123f84050b76fdfe94e262f29cd1`.

Relatório: `C:\Codes\relatorios\afetilu\auditoria-2026-10-21.md` (adendo de resolução de 23/10/2026).

| # | Título | Severidade | Status | Evidência |
|---|---|---|---|---|
| 1 | PDFs em claro sobrevivem à exclusão dos dados | Média | PARCIAL — conferido no Android (Galaxy A52s, 23/10/2026); falta conferir no iOS | `apps/mobile/src/lib/exportacoes.ts`; `residuos.ts`; `estado.tsx` |
| 2 | Falha ao excluir SQLite é ignorada antes de destruir a chave | Média | RESOLVIDO — 23/10/2026, teste falsificado contra o código antigo | `apps/mobile/src/lib/exclusao.ts` (`apagarArquivoEChave`); `db.ts` |
| 3 | Erros posteriores ao commit afirmam que os dados não mudaram | Média | RESOLVIDO — 23/10/2026 | `apps/mobile/src/app/restaurar.tsx`; `apagar.tsx`; `backup.tsx` |
| 4 | Falhas de leitura e escrita nas telas escapam sem estado de erro | Média | RESOLVIDO — 23/10/2026; trava da restauração com teste falsificado | `apps/mobile/src/lib/usar-consulta.ts`; `tentar` em `estado.tsx`; `exclusao.ts` (`restauracaoLiberada`) |
| 5 | Lockfile mantém advisories transitivos do tooling do Expo | Baixa | PARCIAL — 2026-10-31: node-forge 1.4.0 → 1.4.2 dentro da faixa do `@expo/cli` (`pnpm update node-forge -r`); typecheck, lint, testes (11 site, 70 core, 85 mobile) e `expo-doctor` 21/21 OK. Restam só no tooling do SDK 57: zod 3 (correção só na 4.x), uuid 7 (via `xcode`; correção na 11), decode-uri-component 0.2.2 (0.5.1 é ESM), deepmerge 4.3.1 (sem correção), minimatch e glob (exigem major). Não forçar: saem com o Expo SDK 58, junto da próxima versão nas lojas. O aceite de 23/10/2026 cobre o decode-uri-component e o uuid; os demais são posteriores e não estão aceitos | `pnpm-lock.yaml`; `apps/mobile/src/lib/links.ts:9` mitiga deep links |
| 6 | Quatro pacotes Expo atrás do patch recomendado | Baixa | PARCIAL — build de desenvolvimento nova conferida no Android (Galaxy A52s, 23/10/2026); falta build iOS | `apps/mobile/package.json`; `app.json` (plugin `expo-sharing` sem opções) |

## Decisões verificadas

- Não interpretar o placar de advisories como exploração no app. Deep links externos são descartados antes do parsing; não houve evidência nova invalidando esse controle.
- CI manual é decisão explícita do guia. Ausência de autenticação/tenant é coerente com arquitetura local.
- Não substituir transações pela variante que abre conexão sem a chave SQLCipher sem resolver primeiro o provisionamento da chave.
- PDF do resumo não é apagado logo após o compartilhamento: o app de destino pode ler o arquivo depois que a folha fecha. A limpeza acontece na próxima exportação, ao abrir o app e ao apagar ou restaurar dados (#1).
- O nome do PDF continua legível, com o apelido, porque é o que o destinatário vê (#1).
- Sem override de major para os advisories de #5: `decode-uri-component` ≥0.5.0 é só ESM e quebraria o `query-string` 7 do expo-router; `node-forge` e `braces` não têm versão corrigida.


## Rodada transversal 2026-10-30 — 200000

HEAD auditado: `07bd0c822335529ce97b8b3cebce998accf616bc`. Relatório externo: `C:\Codes\relatorios\afetilu\auditoria-2026-10-30-200000.md`. Evidências: `C:\Codes\relatorios\afetilu\evidencias-2026-10-30-200000.json`.

Auditoria estática e validações selecionadas; sem correção de código, commit, push ou deploy. Falta de prova operacional não foi convertida em vulnerabilidade presumida.

| ID | Achado | Severidade | Status nesta rodada | Evidência |
|---|---|---|---|---|
| 1 | Falha ao remover exportações não impede conclusão da limpeza | média | PARCIAL | `apps/mobile/src/lib/exportacoes.ts:11`; `apps/mobile/src/lib/exportacoes.ts:28`; `apps/mobile/src/app/apagar.tsx:57`; `apps/mobile/src/app/restaurar.tsx:87`; `apps/mobile/src/lib/estado.tsx:86`; Potencial — erro de I/O não reproduzido em aparelho. |
| 5 | Advisories do tooling incluem correção disponível e novo decoder | baixa | PARCIAL | `pnpm-lock.yaml:1`; Versões confirmadas; exploração não demonstrada. |

Reverificações e decisões históricas: #1 — PARCIAL; residual de falha de I/O confirmado por leitura; #5 — ACEITO histórico preservado; há advisories novos a revisar; #6 — PARCIAL mantido. O relatório detalha alcance/evidência; provas operacionais antigas não foram repetidas.

## Resolução 2026-10-31

Correção no working tree, sem commit, push ou build. Validação: `pnpm typecheck` (core + mobile, com testes) OK; `pnpm lint` OK; `pnpm test`: site 11, core 70, mobile 85 (84 + 1 novo), todos PASS. Sem aparelho: falha real de I/O do cache não induzida.

| ID | Status | Resolução |
|---|---|---|
| 1 | RESOLVIDO (QA em aparelho pendente) | `apps/mobile/src/lib/residuos.ts` `limparResiduos` (puro) e `exportacoes.ts` `limparExportacoes(): boolean`: true só se o cache foi listado e todos os resíduos saíram; uma falha não interrompe as outras remoções. `apagar.tsx` (apagar uma pessoa) e `restaurar.tsx` mostram o aviso "Cópias exportadas ainda no aparelho" (pt-BR/en/es em `i18n`, chave `geral.copiasFicaram*`) quando algo ficou, e dizem que cópias já enviadas a outros apps não podem ser apagadas por ali. Abertura do app e "apagar tudo" (que reabre o app) seguem tentando de novo a cada abertura, sem aviso. Teste `residuos.test.ts` "limpeza informa resíduo que não saiu…" falhava sem a correção. |

Pendências: novo build de desenvolvimento/release para chegar ao aparelho (sem OTA); traduções novas em en/es precisam da revisão nativa já prevista no AGENTS.md.

## Rodada 2026-11-06 — auditoria técnica por ordem alfabética

HEAD auditado: `56c4b1cf5d227535a500f13cc3fc94fd05c027cf`. Worktree limpa durante a coleta; somente este registro documental alterado ao final. Sem correção de código, instalação/atualização de dependências, commit, push, deploy ou acesso a dados reais.

Relatório externo: `C:\Codes\relatorios\afetilu\auditoria-2026-11-06.md`.
Evidências: `C:\Codes\relatorios\afetilu\evidencias-2026-11-06\`.

| ID | Achado | Severidade | Status | Evidência |
|---|---|---|---|---|
| 5 | Advisories transitivos permanecem na árvore do Expo | Baixa | PARCIAL — aceites anteriores preservados, exploração no app não demonstrada | `pnpm audit --audit-level moderate --json`: metadata 2 altas, 4 moderadas, 1 baixa; seis advisories detalhados no nível solicitado. Node-forge não consta do retorno. Decoder mitigado por `links.ts:9`; Zod 3 é transitivo do CLI, core usa 4.6.7 |
| 6 | Quatro dependências Expo abaixo dos patches recomendados | Baixa | PARCIAL — checagem atual diverge; sem nova build/QA | `apps/mobile/package.json:21,23,29,31`: expo ~57.0.32, constants ~57.0.23, router ~57.0.30 e sharing ~57.0.25 recomendados por `expo install --check` |
| 7 | Backup reutiliza resultado cifrado com senha anterior após edição durante geração | Média | ABERTO — corrida reproduzida com corpos reais extraídos e KDF simulado; falta QA nativo | `apps/mobile/src/app/backup.tsx:50–66,119–125`; `components/ui.tsx:111–142` |
| 8 | Corrigir observação após troca de fuso altera o dia histórico | Média | ABERTO — reproduzido com helper real e dados fictícios | `apps/mobile/src/lib/formulario.ts:59–65,110–112`; `packages/core/src/quando.ts:33–38`; `repositorio.ts:119–121` |
| 9 | Comando de cobertura falha no próprio limite de funções | Baixa | ABERTO — exit 1; 99,15% ante 100% exigidos | `packages/core/package.json:15`; `.github/workflows/ci.yml:23–29`; anexo de cobertura |
| 10 | CI usa referências mutáveis e não declara permissões mínimas | Baixa | ABERTO — higiene; comprometimento não demonstrado | `.github/workflows/ci.yml:5–29`: tags, expo-doctor@latest, ausência de permissions; gatilho manual preservado |
| 11 | Gerador de ícones interpola caminho sem escape em PowerShell | Baixa | ABERTO — potencial, não executado; caminho atual não contém apóstrofo | `ferramentas/icone/gerar_icone.mjs:127–134` |

Validações: typecheck e lint PASS; testes site 11, core 70, mobile 85 PASS. Cobertura core: linhas 98,91%, branches 97,92%, funções 99,15% (gate falha). Site gerado em cópia temporária: seis páginas. SQL das duas migrations exercitado só em SQLite `:memory:` com dados fictícios: FK/cascata/rollback OK, sem validar driver Expo/SQLCipher. Oito pares de contraste calculados ≥4,5:1. `expo-doctor` ausente localmente, não baixado/executado. Sem testes nativos ou validação de deployment.

Reincidências: #1 mantém a correção e a pendência de QA já registradas; aviso existe ao apagar pessoa/restaurar, enquanto abertura/apagar tudo ignoram o booleano, limitação expressamente documentada em 31/10. Não houve mudança de contexto para criar novo ID/reabrir como descoberta inédita. #2–#4 mantidos nos caminhos históricos após inspeção direta. Decisão de adiar release permanece em `docs/pendencias-auditoria.md`.

Candidatos rejeitados: ausência de autenticação/tenant em app local, projectId/owner como segredo, SQL injection por PRAGMA de chave gerada internamente, XSS em conteúdo escapado, índice pessoa/dia ausente (planner usa índice), CI manual como defeito e severidade alta inferida exclusivamente do scanner. Justificativas detalhadas no relatório; decisões anteriores preservadas, sem IDs duplicados.
