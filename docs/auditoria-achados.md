# Achados de auditoria técnica

Registro iniciado em 21/10/2026. Antes do bootstrap não havia ledger nem IDs encontrados em `git log --all --grep=achado -i`. Snapshot auditado: `a83fdfe69913123f84050b76fdfe94e262f29cd1`.

Relatório: `C:\Codes\relatorios\afetilu\auditoria-2026-10-21.md` (adendo de resolução de 23/10/2026).

| # | Título | Severidade | Status | Evidência |
|---|---|---|---|---|
| 1 | PDFs em claro sobrevivem à exclusão dos dados | Média | PARCIAL — limpeza implementada e testada (regra pura); falta conferir em aparelho | `apps/mobile/src/lib/exportacoes.ts`; `residuos.ts`; `estado.tsx` |
| 2 | Falha ao excluir SQLite é ignorada antes de destruir a chave | Média | RESOLVIDO — 23/10/2026, teste falsificado contra o código antigo | `apps/mobile/src/lib/exclusao.ts` (`apagarArquivoEChave`); `db.ts` |
| 3 | Erros posteriores ao commit afirmam que os dados não mudaram | Média | RESOLVIDO — 23/10/2026 | `apps/mobile/src/app/restaurar.tsx`; `apagar.tsx`; `backup.tsx` |
| 4 | Falhas de leitura e escrita nas telas escapam sem estado de erro | Média | RESOLVIDO — 23/10/2026; trava da restauração com teste falsificado | `apps/mobile/src/lib/usar-consulta.ts`; `tentar` em `estado.tsx`; `exclusao.ts` (`restauracaoLiberada`) |
| 5 | Lockfile mantém quatro advisories transitivos | Baixa | ABERTO (aceito) — risco aceito pelo usuário em 23/10/2026; reabrir quando o Expo atualizar as cadeias (`query-string`/`decode-uri-component`, `xcode`/`uuid`) ou surgir versão corrigida de `node-forge`/`braces` | `pnpm-lock.yaml`; `apps/mobile/src/lib/links.ts:9` mitiga deep links |
| 6 | Quatro pacotes Expo atrás do patch recomendado | Baixa | PARCIAL — versões alinhadas, `expo-doctor` 21/21; falta build nova de desenvolvimento | `apps/mobile/package.json`; `app.json` (plugin `expo-sharing` sem opções) |

## Decisões verificadas

- Não interpretar o placar de advisories como exploração no app. Deep links externos são descartados antes do parsing; não houve evidência nova invalidando esse controle.
- CI manual é decisão explícita do guia. Ausência de autenticação/tenant é coerente com arquitetura local.
- Não substituir transações pela variante que abre conexão sem a chave SQLCipher sem resolver primeiro o provisionamento da chave.
- PDF do resumo não é apagado logo após o compartilhamento: o app de destino pode ler o arquivo depois que a folha fecha. A limpeza acontece na próxima exportação, ao abrir o app e ao apagar ou restaurar dados (#1).
- O nome do PDF continua legível, com o apelido, porque é o que o destinatário vê (#1).
- Sem override de major para os advisories de #5: `decode-uri-component` ≥0.5.0 é só ESM e quebraria o `query-string` 7 do expo-router; `node-forge` e `braces` não têm versão corrigida.
