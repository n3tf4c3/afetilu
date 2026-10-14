import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { VERSAO_CONTEUDO_BACKUP, type ConteudoBackup } from "@afetilu/core";
import { gcm } from "@noble/ciphers/aes.js";
import { scrypt } from "@noble/hashes/scrypt.js";
import {
  cifrarBackup,
  decifrarBackup,
  diasDesde,
  ErroBackup,
  lerArquivoDeBackup,
  nomeDoArquivoDeBackup,
  problemaDaSenha,
  type FalhaBackup,
} from "./backup";

// Dados fictícios. Nunca usar dados reais.
const T = "2026-10-12T15:30:00.000Z";
const conteudo: ConteudoBackup = {
  versao: VERSAO_CONTEUDO_BACKUP,
  criadoEm: "2026-10-13T21:00:00.000Z",
  pessoas: [{ id: "p1", apelido: "Léo 🌟", criadaEm: T }],
  registros: [
    {
      id: "r1",
      pessoaId: "p1",
      ocorreuEm: T,
      ocorreuDia: "2026-10-12",
      precisao: "exato",
      emAberto: false,
      origem: "me_contaram",
      origemQuem: "avó",
      observacao: "Comeu maçã e pão de queijo",
      detalhe: { categoria: "alimentacao", tipo: "comida", item: "maçã" },
      lancadoEm: T,
      atualizadoEm: T,
      versao: 1,
    },
  ],
  revisoes: [],
  diasAnotados: [{ pessoaId: "p1", dia: "2026-10-11", semCrises: true, lancadoEm: T }],
};

const SENHA = "pão de queijo";
// O menor custo aceito, para o teste rodar rápido; o app usa LOGN_PADRAO.
const opcoes = { aleatorio: (n: number) => new Uint8Array(randomBytes(n)), logN: 14 };

async function falha(promessa: Promise<unknown> | (() => unknown)): Promise<FalhaBackup | null> {
  try {
    await (typeof promessa === "function" ? promessa() : promessa);
    return null;
  } catch (e) {
    if (e instanceof ErroBackup) return e.tipo;
    throw e;
  }
}

test("ida e volta devolve exatamente o mesmo conteúdo, acentos e emojis incluídos", async () => {
  const arquivo = await cifrarBackup(conteudo, SENHA, opcoes);
  assert.deepEqual(await decifrarBackup(lerArquivoDeBackup(arquivo), SENHA), conteudo);
});

test("o arquivo não traz nenhum dado legível", async () => {
  const arquivo = await cifrarBackup(conteudo, SENHA, opcoes);
  for (const trecho of ["Léo", "L\\u00e9o", "queijo", "av\\u00f3", "alimentacao", "me_contaram", "2026-10-12", "2026-10-11"]) {
    assert.equal(arquivo.includes(trecho), false, trecho);
  }
});

test("dois backups do mesmo conteúdo e senha são diferentes (sal e nonce novos)", async () => {
  const a = lerArquivoDeBackup(await cifrarBackup(conteudo, SENHA, opcoes));
  const b = lerArquivoDeBackup(await cifrarBackup(conteudo, SENHA, opcoes));
  assert.notEqual(a.kdf.sal, b.kdf.sal);
  assert.notEqual(a.cifra.nonce, b.cifra.nonce);
  assert.notEqual(a.dados, b.dados);
});

test("senha errada não abre", async () => {
  const envelope = lerArquivoDeBackup(await cifrarBackup(conteudo, SENHA, opcoes));
  assert.equal(await falha(decifrarBackup(envelope, "pao de queijo")), "senha_ou_arquivo");
});

test("a senha vale pela forma do texto, não pela composição do acento", async () => {
  const envelope = lerArquivoDeBackup(await cifrarBackup(conteudo, "pão de queijo", opcoes));
  assert.deepEqual(await decifrarBackup(envelope, "pão de queijo"), conteudo);
});

test("conteúdo ou cabeçalho alterado não abre", async () => {
  const envelope = lerArquivoDeBackup(await cifrarBackup(conteudo, SENHA, opcoes));
  const bytes = Buffer.from(envelope.dados, "base64");
  bytes[10]! ^= 1;
  assert.equal(await falha(decifrarBackup({ ...envelope, dados: bytes.toString("base64") }, SENHA)), "senha_ou_arquivo");
  const nonce = Buffer.from(envelope.cifra.nonce, "base64");
  nonce[0]! ^= 1;
  const outroNonce = { ...envelope, cifra: { ...envelope.cifra, nonce: nonce.toString("base64") } };
  assert.equal(await falha(decifrarBackup(outroNonce, SENHA)), "senha_ou_arquivo");
});

test("não cria backup de conteúdo inválido", async () => {
  const quebrado = { ...conteudo, registros: [{ ...conteudo.registros[0]!, pessoaId: "sumiu" }] };
  await assert.rejects(cifrarBackup(quebrado, SENHA, opcoes));
});

test("reconhece arquivo que não é backup e backup de versão mais nova", async () => {
  assert.equal(await falha(() => lerArquivoDeBackup("%PDF-1.7")), "nao_e_backup");
  assert.equal(await falha(() => lerArquivoDeBackup("null")), "nao_e_backup");
  assert.equal(await falha(() => lerArquivoDeBackup(JSON.stringify({ formato: "outro", versao: 1 }))), "nao_e_backup");
  const atual = JSON.parse(await cifrarBackup(conteudo, SENHA, opcoes));
  assert.equal(await falha(() => lerArquivoDeBackup(JSON.stringify({ ...atual, versao: 99, kdf: { nome: "argon2id" } }))), "versao_nova");
  assert.equal(await falha(() => lerArquivoDeBackup(JSON.stringify({ ...atual, kdf: { ...atual.kdf, logN: 30 } }))), "nao_e_backup");
});

test("conteúdo decifrado mas inválido, ou de versão mais nova, é recusado", async () => {
  // Monta o arquivo à mão, com a mesma cifra, para simular um conteúdo que o app não gravaria.
  const selar = (claro: unknown) => {
    const sal = new Uint8Array(randomBytes(16));
    const nonce = new Uint8Array(randomBytes(12));
    const cabecalho = {
      formato: "afetilu-backup",
      versao: 1,
      kdf: { nome: "scrypt", logN: 14, r: 8, p: 1, sal: Buffer.from(sal).toString("base64") },
      cifra: { nome: "aes-256-gcm", nonce: Buffer.from(nonce).toString("base64") },
    } as const;
    const chave = scrypt(new TextEncoder().encode(SENHA), sal, { N: 2 ** 14, r: 8, p: 1, dkLen: 32 });
    const aad = new TextEncoder().encode(JSON.stringify(cabecalho));
    // O formato guarda o JSON só com ASCII (acentos como \uXXXX), como o app grava.
    const ascii = JSON.stringify(claro).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
    const dados = gcm(chave, nonce, aad).encrypt(new TextEncoder().encode(ascii));
    return lerArquivoDeBackup(JSON.stringify({ ...cabecalho, dados: Buffer.from(dados).toString("base64") }));
  };
  assert.equal(await falha(decifrarBackup(selar({ ...conteudo, pessoas: [] }), SENHA)), "conteudo_invalido");
  assert.equal(await falha(decifrarBackup(selar({ ...conteudo, versao: VERSAO_CONTEUDO_BACKUP + 1 }), SENHA)), "versao_nova");
  // Controle positivo: o mesmo caminho aceita o conteúdo válido.
  assert.deepEqual(await decifrarBackup(selar(conteudo), SENHA), conteudo);
});

test("progresso da derivação chega a 100%", async () => {
  const fracoes: number[] = [];
  await cifrarBackup(conteudo, SENHA, { ...opcoes, aoProgredir: (f) => fracoes.push(f) });
  assert.ok(fracoes.length > 0);
  assert.equal(fracoes.at(-1), 1);
});

test("senha: mínimo de caracteres e confirmação igual", () => {
  assert.equal(problemaDaSenha("123456789", "123456789"), "curta");
  assert.equal(problemaDaSenha("1234567890", "1234567891"), "diferente");
  assert.equal(problemaDaSenha("1234567890", "1234567890"), null);
  // Emojis contam como um caractere cada.
  assert.equal(problemaDaSenha("🌟🌟🌟🌟🌟", "🌟🌟🌟🌟🌟"), "curta");
});

test("nome do arquivo não traz apelido", () => {
  assert.equal(nomeDoArquivoDeBackup("2026-10-13"), "afetilu-backup-2026-10-13.afetilu");
});

test("dias desde o último backup contam dias de calendário", () => {
  const agora = new Date(2026, 9, 13, 8, 0);
  assert.equal(diasDesde(null, agora), null);
  assert.equal(diasDesde("lixo", agora), null);
  assert.equal(diasDesde(new Date(2026, 9, 13, 7, 0).toISOString(), agora), 0);
  // Ontem à noite já é "1 dia", mesmo com menos de 24 h.
  assert.equal(diasDesde(new Date(2026, 9, 12, 23, 0).toISOString(), agora), 1);
  assert.equal(diasDesde(new Date(2026, 8, 13, 9, 0).toISOString(), agora), 30);
  // Relógio do aparelho voltou no tempo: nunca negativo.
  assert.equal(diasDesde(new Date(2026, 9, 20).toISOString(), agora), 0);
});
