# Pendências — auditoria técnica de 30/10/2026

Atualizado em 31/10/2026. Detalhes em `docs/auditoria-achados.md`.

## Feito em 31/10/2026

**#1** commitado e pushado (`eb46dcc`, `7238833`): a limpeza de PDFs e backups exportados informa falha, e apagar uma pessoa ou restaurar um backup avisam quando alguma cópia ficou no cache.

## Lojas

- **ADIADO (decisão do titular, 31/10/2026):** nenhuma versão nova nas lojas agora. O #1 só chega aos usuários na próxima versão (o app não tem OTA). Reabrir quando houver release planejada.
- Antes dessa versão: QA do aviso num aparelho Android (e iOS, que não foi revalidado) e revisão nativa das frases novas em inglês e espanhol (`geral.copiasFicaramTitulo`/`copiasFicaramTexto`).

## Achados ainda abertos

- **#5** — advisories no tooling do Expo: node-forge 1.4.0 (há correção na 1.4.1), decode-uri-component 0.2.2 (correção 0.5.1 é ESM; não forçar no `query-string` CommonJS), uuid, zod 3 e deepmerge. Atualizar o que for compatível e registrar prazo do resto.
- **#6** — alinhamento das versões do Expo: sem novo `expo-doctor` nem build iOS desde a última conferência.
