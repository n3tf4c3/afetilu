import { LIMITES } from "@afetilu/core";

/**
 * Migrações do banco local, em ordem. Nunca editar uma já publicada:
 * acrescentar uma nova ao fim. `PRAGMA user_version` guarda a última aplicada.
 *
 * O conteúdo completo do registro fica em `conteudo` (JSON validado pelo core);
 * as colunas repetidas existem só para filtrar e ordenar.
 */
export const MIGRACOES: readonly string[] = [
  `
  CREATE TABLE pessoa (
    id TEXT PRIMARY KEY NOT NULL,
    apelido TEXT NOT NULL CHECK (length(apelido) BETWEEN 1 AND ${LIMITES.apelido}),
    criada_em TEXT NOT NULL
  );

  CREATE TABLE registro (
    id TEXT PRIMARY KEY NOT NULL,
    pessoa_id TEXT NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    categoria TEXT NOT NULL,
    ocorreu_em TEXT NOT NULL,
    ocorreu_dia TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    lancado_em TEXT NOT NULL,
    atualizado_em TEXT NOT NULL,
    versao INTEGER NOT NULL CHECK (versao >= 1)
  );
  CREATE INDEX registro_pessoa_dia ON registro (pessoa_id, ocorreu_dia);

  CREATE TABLE registro_revisao (
    registro_id TEXT NOT NULL REFERENCES registro(id) ON DELETE CASCADE,
    versao INTEGER NOT NULL,
    conteudo_anterior TEXT NOT NULL,
    alterado_em TEXT NOT NULL,
    PRIMARY KEY (registro_id, versao)
  );

  CREATE TABLE dia_anotado (
    pessoa_id TEXT NOT NULL REFERENCES pessoa(id) ON DELETE CASCADE,
    dia TEXT NOT NULL,
    sem_crises INTEGER NOT NULL CHECK (sem_crises IN (0, 1)),
    observacao TEXT,
    lancado_em TEXT NOT NULL,
    PRIMARY KEY (pessoa_id, dia)
  );

  CREATE TABLE preferencia (
    chave TEXT PRIMARY KEY NOT NULL,
    valor TEXT NOT NULL
  );
  `,
];
