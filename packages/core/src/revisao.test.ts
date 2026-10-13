import assert from "node:assert/strict";
import { test } from "node:test";
import { comida, episodio, registro } from "./fixtures.test-util";
import { corrigirRegistro, extrairEntrada, novoRegistro } from "./revisao";

const AGORA = "2026-10-13T18:00:00.000Z";

test("novo registro começa na versão 1 com lançamento = agora", () => {
  const base = registro(new Date(2026, 9, 13, 12), comida());
  const r = novoRegistro(extrairEntrada(base), "novo", AGORA);
  assert.deepEqual([r.id, r.versao, r.lancadoEm, r.atualizadoEm], ["novo", 1, AGORA, AGORA]);
});

test("correção guarda a versão anterior e preserva o horário de lançamento", () => {
  const atual = registro(new Date(2026, 9, 13, 12), episodio);
  const nova = { ...extrairEntrada(atual), ocorreuEm: new Date(2026, 9, 13, 11).toISOString() };
  const resultado = corrigirRegistro(atual, nova, AGORA);
  assert.ok(resultado);
  assert.equal(resultado.registro.versao, 2);
  assert.equal(resultado.registro.lancadoEm, atual.lancadoEm);
  assert.equal(resultado.registro.atualizadoEm, AGORA);
  assert.equal(resultado.revisao.versao, 1);
  assert.equal(resultado.revisao.conteudoAnterior.ocorreuEm, atual.ocorreuEm);
});

test("salvar sem mudança não cria revisão, mesmo com chaves em outra ordem", () => {
  const atual = registro(new Date(2026, 9, 13, 12), comida());
  const { detalhe, ...resto } = extrairEntrada(atual);
  assert.equal(corrigirRegistro(atual, { detalhe: { ...detalhe }, ...resto }, AGORA), null);
});

test("correção não pode trocar a pessoa", () => {
  const atual = registro(new Date(2026, 9, 13, 12), comida());
  assert.throws(() => corrigirRegistro(atual, { ...extrairEntrada(atual), pessoaId: "outra" }, AGORA));
});
