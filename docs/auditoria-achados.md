# Achados de auditoria técnica

Registro iniciado em 21/10/2026. Antes do bootstrap não havia ledger nem IDs encontrados em `git log --all --grep=achado -i`. Snapshot auditado: `a83fdfe69913123f84050b76fdfe94e262f29cd1`.

Relatório: `C:\Codes\relatorios\afetilu\auditoria-2026-10-21.md` (adendo de resolução de 23/10/2026).

| # | Título | Severidade | Status | Evidência |
|---|---|---|---|---|
| 1 | PDFs em claro sobrevivem à exclusão dos dados | Média | PARCIAL — conferido no Android (Galaxy A52s, 23/10/2026); falta conferir no iOS | `apps/mobile/src/lib/exportacoes.ts`; `residuos.ts`; `estado.tsx` |
| 2 | Falha ao excluir SQLite é ignorada antes de destruir a chave | Média | RESOLVIDO — 23/10/2026, teste falsificado contra o código antigo | `apps/mobile/src/lib/exclusao.ts` (`apagarArquivoEChave`); `db.ts` |
| 3 | Erros posteriores ao commit afirmam que os dados não mudaram | Média | RESOLVIDO — 23/10/2026 | `apps/mobile/src/app/restaurar.tsx`; `apagar.tsx`; `backup.tsx` |
| 4 | Falhas de leitura e escrita nas telas escapam sem estado de erro | Média | RESOLVIDO — 23/10/2026; trava da restauração com teste falsificado | `apps/mobile/src/lib/usar-consulta.ts`; `tentar` em `estado.tsx`; `exclusao.ts` (`restauracaoLiberada`) |
| 5 | Lockfile mantém quatro advisories transitivos | Baixa | ABERTO (aceito) — risco aceito pelo usuário em 23/10/2026; reabrir quando o Expo atualizar as cadeias (`query-string`/`decode-uri-component`, `xcode`/`uuid`) ou surgir versão corrigida de `node-forge`/`braces` | `pnpm-lock.yaml`; `apps/mobile/src/lib/links.ts:9` mitiga deep links |
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
