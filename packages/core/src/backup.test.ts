import assert from "node:assert/strict";
import { test } from "node:test";
import {
  conteudoBackup,
  envelopeBackup,
  LIMITES_KDF_BACKUP,
  previaDoBackup,
  VERSAO_CONTEUDO_BACKUP,
  type ConteudoBackup,
} from "./backup";
import { comida, episodio, PESSOA, registro, sono } from "./fixtures.test-util";

// Dados fictícios.
const OUTRA = "pessoa-ficticia-2";
const CRIADA = "2026-10-01T10:00:00.000Z";

function valido(): ConteudoBackup {
  const corrigido = registro(new Date(2026, 9, 12, 8), comida("pão"), { id: "corrigido", versao: 2 });
  const { id: _id, lancadoEm: _l, atualizadoEm: _a, versao: _v, ...anterior } = corrigido;
  return {
    versao: VERSAO_CONTEUDO_BACKUP,
    criadoEm: "2026-10-13T21:00:00.000Z",
    pessoas: [
      { id: PESSOA, apelido: "Bia", criadaEm: CRIADA },
      { id: OUTRA, apelido: "Léo", criadaEm: CRIADA },
    ],
    registros: [
      corrigido,
      registro(new Date(2026, 9, 10, 9), sono),
      registro(new Date(2026, 9, 11, 15), episodio, { pessoaId: OUTRA }),
    ],
    revisoes: [{ registroId: "corrigido", versao: 1, conteudoAnterior: { ...anterior, detalhe: comida("arroz") }, alteradoEm: CRIADA }],
    diasAnotados: [
      { pessoaId: PESSOA, dia: "2026-10-09", semCrises: true, lancadoEm: CRIADA },
      { pessoaId: OUTRA, dia: "2026-10-14", semCrises: false, observacao: "nota", lancadoEm: CRIADA },
    ],
  };
}

const motivos = (c: unknown) => {
  const r = conteudoBackup.safeParse(c);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

test("aceita um conteúdo completo e devolve os mesmos dados", () => {
  const c = valido();
  // Ida e volta pelo JSON, como no arquivo: nada se perde nem muda.
  assert.deepEqual(conteudoBackup.parse(JSON.parse(JSON.stringify(c))), c);
});

test("aceita um backup sem nenhum dado", () => {
  assert.deepEqual(motivos({ ...valido(), pessoas: [], registros: [], revisoes: [], diasAnotados: [] }), []);
});

test("recusa versão de conteúdo desconhecida", () => {
  assert.equal(conteudoBackup.safeParse({ ...valido(), versao: VERSAO_CONTEUDO_BACKUP + 1 }).success, false);
});

test("recusa registro que não passa nas regras do core", () => {
  const c = valido();
  // Término antes do início: a mesma regra cruzada usada ao salvar vale na restauração.
  c.registros[1] = { ...c.registros[1]!, ocorreuFim: "2026-10-01T00:00:00.000Z" };
  assert.ok(motivos(c).includes("O término não pode ser antes do início."));
});

test("recusa chaves repetidas", () => {
  const c = valido();
  c.pessoas.push({ ...c.pessoas[0]! });
  c.registros.push({ ...c.registros[0]! });
  c.revisoes.push({ ...c.revisoes[0]! });
  c.diasAnotados.push({ ...c.diasAnotados[0]! });
  assert.deepEqual(motivos(c), ["Pessoa repetida.", "Registro repetido.", "Revisão repetida.", "Dia anotado repetido."]);
});

test("recusa referências quebradas", () => {
  const c = valido();
  c.registros[1] = { ...c.registros[1]!, pessoaId: "sumiu" };
  c.revisoes.push({ ...c.revisoes[0]!, registroId: "sumiu" });
  c.diasAnotados[0] = { ...c.diasAnotados[0]!, pessoaId: "sumiu" };
  assert.deepEqual(motivos(c), ["Registro de pessoa ausente.", "Revisão de registro ausente.", "Dia anotado de pessoa ausente."]);
});

test("recusa revisão igual ou posterior à versão atual do registro", () => {
  const c = valido();
  c.revisoes[0] = { ...c.revisoes[0]!, versao: 2 };
  assert.deepEqual(motivos(c), ["Revisão posterior à versão atual."]);
});

test("prévia conta registros por pessoa e mostra o período", () => {
  assert.deepEqual(previaDoBackup(valido()), {
    criadoEm: "2026-10-13T21:00:00.000Z",
    pessoas: [
      { apelido: "Bia", registros: 2 },
      { apelido: "Léo", registros: 1 },
    ],
    registros: 3,
    diasSemCrises: 1,
    // O dia marcado sem crises (09) abre o período; o dia anotado sem a marcação (14) não conta.
    periodo: { inicio: "2026-10-09", fim: "2026-10-12" },
  });
});

test("prévia de backup vazio não tem período", () => {
  const p = previaDoBackup({ ...valido(), pessoas: [], registros: [], revisoes: [], diasAnotados: [] });
  assert.equal(p.periodo, null);
  assert.equal(p.registros, 0);
});

const envelope = () => ({
  formato: "afetilu-backup",
  versao: 1,
  kdf: { nome: "scrypt", logN: 16, r: 8, p: 1, sal: "AAAAAAAAAAAAAAAAAAAAAA==" },
  cifra: { nome: "aes-256-gcm", nonce: "AAAAAAAAAAAAAAAA" },
  dados: "c2VncmVkbw==",
});

test("envelope aceita o formato esperado", () => {
  assert.equal(envelopeBackup.safeParse(envelope()).success, true);
});

test("envelope recusa outro formato, parâmetros fora dos limites e base64 inválido", () => {
  const recusa = (mudar: (e: ReturnType<typeof envelope>) => void) => {
    const e = envelope();
    mudar(e);
    return !envelopeBackup.safeParse(e).success;
  };
  assert.ok(recusa((e) => (e.formato = "outro")));
  assert.ok(recusa((e) => (e.kdf.logN = LIMITES_KDF_BACKUP.logNMax + 1)));
  assert.ok(recusa((e) => (e.kdf.logN = LIMITES_KDF_BACKUP.logNMin - 1)));
  assert.ok(recusa((e) => (e.kdf.r = 16)));
  assert.ok(recusa((e) => (e.kdf.sal = "AAAA")));
  assert.ok(recusa((e) => (e.cifra.nonce = "AAAAAAAAAAAAAAA!")));
  assert.ok(recusa((e) => (e.dados = "")));
});
