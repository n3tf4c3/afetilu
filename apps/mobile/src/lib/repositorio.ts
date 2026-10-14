import {
  corrigirRegistro,
  entradaPessoa,
  entradaRegistro,
  novoRegistro,
  VERSAO_CONTEUDO_BACKUP,
  type ConteudoBackup,
  type DiaAnotado,
  type EntradaRegistro,
  type Pessoa,
  type Registro,
  type RevisaoRegistro,
} from "@afetilu/core";
import type { SQLiteDatabase } from "expo-sqlite";
import { novoId } from "./db";
import {
  diaAnotadoDaLinha,
  linhaDoRegistro,
  pessoaDaLinha,
  registroDaLinha,
  revisaoDaLinha,
  type LinhaDiaAnotado,
  type LinhaPessoa,
  type LinhaRegistro,
  type LinhaRevisao,
} from "./linhas";

const agoraIso = () => new Date().toISOString();

// Pessoas -------------------------------------------------------------------

export async function listarPessoas(db: SQLiteDatabase): Promise<Pessoa[]> {
  const linhas = await db.getAllAsync<LinhaPessoa>("SELECT * FROM pessoa ORDER BY criada_em");
  return linhas.map(pessoaDaLinha);
}

export async function criarPessoa(db: SQLiteDatabase, apelido: string): Promise<Pessoa> {
  const dados = entradaPessoa.parse({ apelido });
  const pessoa: Pessoa = { id: novoId(), apelido: dados.apelido, criadaEm: agoraIso() };
  await db.runAsync("INSERT INTO pessoa (id, apelido, criada_em) VALUES (?, ?, ?)", pessoa.id, pessoa.apelido, pessoa.criadaEm);
  return pessoa;
}

export async function renomearPessoa(db: SQLiteDatabase, id: string, apelido: string): Promise<void> {
  const dados = entradaPessoa.parse({ apelido });
  await db.runAsync("UPDATE pessoa SET apelido = ? WHERE id = ?", dados.apelido, id);
}

/** Quanto será apagado junto com a pessoa, para a tela de confirmação. */
export async function contarDadosDaPessoa(db: SQLiteDatabase, id: string): Promise<{ registros: number; diasSemCrises: number }> {
  const r = await db.getFirstAsync<{ n: number }>("SELECT count(*) AS n FROM registro WHERE pessoa_id = ?", id);
  const d = await db.getFirstAsync<{ n: number }>("SELECT count(*) AS n FROM dia_anotado WHERE pessoa_id = ? AND sem_crises = 1", id);
  return { registros: r?.n ?? 0, diasSemCrises: d?.n ?? 0 };
}

/**
 * Exclusão definitiva da pessoa. Registros, revisões e dias anotados vão junto, em cascata
 * (foreign_keys e secure_delete ligados em abrirBanco), numa única instrução.
 */
export async function apagarPessoa(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM pessoa WHERE id = ?", id);
}

// Registros -----------------------------------------------------------------

async function inserirLinha(db: SQLiteDatabase, l: LinhaRegistro): Promise<void> {
  await db.runAsync(
    `INSERT INTO registro (id, pessoa_id, categoria, ocorreu_em, ocorreu_dia, conteudo, lancado_em, atualizado_em, versao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    l.id, l.pessoa_id, l.categoria, l.ocorreu_em, l.ocorreu_dia, l.conteudo, l.lancado_em, l.atualizado_em, l.versao,
  );
}

export async function criarRegistro(db: SQLiteDatabase, entrada: EntradaRegistro): Promise<Registro> {
  const r = novoRegistro(entradaRegistro.parse(entrada), novoId(), agoraIso());
  await inserirLinha(db, linhaDoRegistro(r));
  return r;
}

export async function obterRegistro(db: SQLiteDatabase, id: string): Promise<Registro | null> {
  const linha = await db.getFirstAsync<LinhaRegistro>("SELECT * FROM registro WHERE id = ?", id);
  return linha ? registroDaLinha(linha) : null;
}

/** Registros da pessoa entre dois dias (inclusive), do mais recente ao mais antigo. */
export async function listarRegistros(
  db: SQLiteDatabase,
  pessoaId: string,
  inicio: string,
  fim: string,
): Promise<Registro[]> {
  const linhas = await db.getAllAsync<LinhaRegistro>(
    `SELECT * FROM registro WHERE pessoa_id = ? AND ocorreu_dia BETWEEN ? AND ?
     ORDER BY ocorreu_em DESC, lancado_em DESC`,
    pessoaId, inicio, fim,
  );
  return linhas.map(registroDaLinha).filter((r): r is Registro => r !== null);
}

/** Correção com histórico, numa transação: revisão gravada e versão substituída juntas. */
export async function salvarCorrecao(db: SQLiteDatabase, id: string, nova: EntradaRegistro): Promise<Registro | null> {
  const atual = await obterRegistro(db, id);
  if (!atual) throw new Error("nao_encontrado");
  const resultado = corrigirRegistro(atual, entradaRegistro.parse(nova), agoraIso());
  if (!resultado) return null;
  const l = linhaDoRegistro(resultado.registro);
  // Mesma conexão (withExclusiveTransactionAsync abriria outra, sem a chave da cifra).
  // A versão no WHERE impede sobrescrever uma correção concorrente.
  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      `UPDATE registro SET categoria = ?, ocorreu_em = ?, ocorreu_dia = ?, conteudo = ?, atualizado_em = ?, versao = ?
       WHERE id = ? AND versao = ?`,
      l.categoria, l.ocorreu_em, l.ocorreu_dia, l.conteudo, l.atualizado_em, l.versao, id, atual.versao,
    );
    if (r.changes !== 1) throw new Error("conflito");
    await db.runAsync(
      "INSERT INTO registro_revisao (registro_id, versao, conteudo_anterior, alterado_em) VALUES (?, ?, ?, ?)",
      resultado.revisao.registroId,
      resultado.revisao.versao,
      JSON.stringify(resultado.revisao.conteudoAnterior),
      resultado.revisao.alteradoEm,
    );
  });
  return resultado.registro;
}

export async function listarRevisoes(db: SQLiteDatabase, registroId: string): Promise<RevisaoRegistro[]> {
  const linhas = await db.getAllAsync<LinhaRevisao>(
    "SELECT * FROM registro_revisao WHERE registro_id = ? ORDER BY versao DESC",
    registroId,
  );
  return linhas.map(revisaoDaLinha).filter((r): r is RevisaoRegistro => r !== null);
}

/** Exclusão definitiva: o registro e todo o seu histórico (cascata). */
export async function apagarRegistro(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("DELETE FROM registro WHERE id = ?", id);
}

// Dias anotados -------------------------------------------------------------

export async function listarDiasAnotados(
  db: SQLiteDatabase,
  pessoaId: string,
  inicio: string,
  fim: string,
): Promise<DiaAnotado[]> {
  const linhas = await db.getAllAsync<LinhaDiaAnotado>(
    "SELECT * FROM dia_anotado WHERE pessoa_id = ? AND dia BETWEEN ? AND ?",
    pessoaId, inicio, fim,
  );
  return linhas.map(diaAnotadoDaLinha);
}

export async function marcarSemCrises(db: SQLiteDatabase, pessoaId: string, dia: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO dia_anotado (pessoa_id, dia, sem_crises, lancado_em) VALUES (?, ?, 1, ?)
     ON CONFLICT (pessoa_id, dia) DO UPDATE SET sem_crises = 1, lancado_em = excluded.lancado_em`,
    pessoaId, dia, agoraIso(),
  );
}

export async function desmarcarSemCrises(db: SQLiteDatabase, pessoaId: string, dia: string): Promise<void> {
  await db.runAsync("DELETE FROM dia_anotado WHERE pessoa_id = ? AND dia = ?", pessoaId, dia);
}

// Backup --------------------------------------------------------------------

/**
 * Tudo o que vai para o backup, já no formato do core. Linhas que não passam na validação
 * (não aparecem nas telas) ficam de fora e são contadas, para a tela avisar.
 */
export async function lerConteudoParaBackup(db: SQLiteDatabase, criadoEm: string): Promise<{ conteudo: ConteudoBackup; ignorados: number }> {
  const pessoas = (await db.getAllAsync<LinhaPessoa>("SELECT * FROM pessoa ORDER BY criada_em")).map(pessoaDaLinha);
  const linhas = await db.getAllAsync<LinhaRegistro>("SELECT * FROM registro ORDER BY ocorreu_em, lancado_em");
  const registros = linhas.map(registroDaLinha).filter((r): r is Registro => r !== null);
  const validos = new Map(registros.map((r) => [r.id, r.versao]));
  const linhasRevisao = await db.getAllAsync<LinhaRevisao>("SELECT * FROM registro_revisao ORDER BY registro_id, versao");
  const revisoes = linhasRevisao
    .filter((l) => validos.has(l.registro_id))
    .map(revisaoDaLinha)
    .filter((r): r is RevisaoRegistro => r !== null);
  const diasAnotados = (await db.getAllAsync<LinhaDiaAnotado>("SELECT * FROM dia_anotado ORDER BY pessoa_id, dia")).map(diaAnotadoDaLinha);
  return {
    conteudo: { versao: VERSAO_CONTEUDO_BACKUP, criadoEm, pessoas, registros, revisoes, diasAnotados },
    ignorados: linhas.length - registros.length + linhasRevisao.length - revisoes.length,
  };
}

export async function contarTudo(db: SQLiteDatabase): Promise<{ pessoas: number; registros: number }> {
  const p = await db.getFirstAsync<{ n: number }>("SELECT count(*) AS n FROM pessoa");
  const r = await db.getFirstAsync<{ n: number }>("SELECT count(*) AS n FROM registro");
  return { pessoas: p?.n ?? 0, registros: r?.n ?? 0 };
}

/**
 * Restauração: apaga todos os dados (cascata, com secure_delete) e grava os do backup, numa
 * transação só. Se qualquer passo falhar, o aparelho fica como estava. Preferências não mudam.
 */
export async function substituirPorBackup(db: SQLiteDatabase, c: ConteudoBackup): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM pessoa");
    for (const p of c.pessoas) {
      await db.runAsync("INSERT INTO pessoa (id, apelido, criada_em) VALUES (?, ?, ?)", p.id, p.apelido, p.criadaEm);
    }
    for (const r of c.registros) await inserirLinha(db, linhaDoRegistro(r));
    for (const r of c.revisoes) {
      await db.runAsync(
        "INSERT INTO registro_revisao (registro_id, versao, conteudo_anterior, alterado_em) VALUES (?, ?, ?, ?)",
        r.registroId, r.versao, JSON.stringify(r.conteudoAnterior), r.alteradoEm,
      );
    }
    for (const d of c.diasAnotados) {
      await db.runAsync(
        "INSERT INTO dia_anotado (pessoa_id, dia, sem_crises, observacao, lancado_em) VALUES (?, ?, ?, ?, ?)",
        d.pessoaId, d.dia, d.semCrises ? 1 : 0, d.observacao ?? null, d.lancadoEm,
      );
    }
  });
}

// Preferências --------------------------------------------------------------

export async function lerPreferencia(db: SQLiteDatabase, chave: string): Promise<string | null> {
  const l = await db.getFirstAsync<{ valor: string }>("SELECT valor FROM preferencia WHERE chave = ?", chave);
  return l?.valor ?? null;
}

export async function gravarPreferencia(db: SQLiteDatabase, chave: string, valor: string): Promise<void> {
  await db.runAsync(
    "INSERT INTO preferencia (chave, valor) VALUES (?, ?) ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor",
    chave, valor,
  );
}
