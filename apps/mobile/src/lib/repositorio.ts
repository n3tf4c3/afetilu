import {
  corrigirRegistro,
  entradaPessoa,
  entradaRegistro,
  novoRegistro,
  type DiaAnotado,
  type EntradaRegistro,
  type Pessoa,
  type Registro,
  type RevisaoRegistro,
} from "@eloazul/core";
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
