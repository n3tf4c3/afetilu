import assert from "node:assert/strict";
import { test } from "node:test";
import { calmo, comida, PESSOA } from "./fixtures.test-util";
import { entradaPessoa, entradaRegistro, LIMITES } from "./tipos";

const base = {
  pessoaId: PESSOA,
  ocorreuEm: "2026-10-13T15:00:00.000Z",
  ocorreuDia: "2026-10-13",
  precisao: "exato" as const,
  emAberto: false,
  origem: "vi" as const,
  detalhe: comida(),
};

test("aceita um registro mínimo válido", () => {
  assert.equal(entradaRegistro.safeParse(base).success, true);
});

test("período do dia exige o período", () => {
  assert.equal(entradaRegistro.safeParse({ ...base, precisao: "periodo_do_dia" }).success, false);
  assert.equal(entradaRegistro.safeParse({ ...base, precisao: "periodo_do_dia", periodoDoDia: "tarde" }).success, true);
});

test("término antes do início e término com 'em aberto' são recusados", () => {
  assert.equal(entradaRegistro.safeParse({ ...base, ocorreuFim: "2026-10-13T14:00:00.000Z" }).success, false);
  assert.equal(
    entradaRegistro.safeParse({ ...base, ocorreuFim: "2026-10-13T16:00:00.000Z", emAberto: true }).success,
    false,
  );
});

test("detalhes de episódio só com episódio marcado", () => {
  const semMarcar = { ...calmo, episodio: { intensidade: "leve" } };
  assert.equal(entradaRegistro.safeParse({ ...base, detalhe: semMarcar }).success, false);
});

test("comportamento exige ao menos uma observação", () => {
  const vazio = { categoria: "comportamento", observado: [], ehEpisodio: false };
  assert.equal(entradaRegistro.safeParse({ ...base, detalhe: vazio }).success, false);
});

test("limites de texto e apelido", () => {
  const longo = "a".repeat(LIMITES.observacao + 1);
  assert.equal(entradaRegistro.safeParse({ ...base, observacao: longo }).success, false);
  assert.equal(entradaPessoa.safeParse({ apelido: "  " }).success, false);
  assert.equal(entradaPessoa.safeParse({ apelido: "Lia" }).success, true);
  assert.equal(entradaPessoa.safeParse({ apelido: "x".repeat(LIMITES.apelido + 1) }).success, false);
});

test("local é opcional e só aceita os lugares conhecidos", () => {
  assert.equal(entradaRegistro.safeParse({ ...base, local: "escola" }).success, true);
  assert.equal(entradaRegistro.safeParse({ ...base, local: "shopping" }).success, false);
  assert.equal(entradaRegistro.safeParse(base).success, true);
});
