import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularCobertura } from "./cobertura";
import { calmo, comida, episodio, PESSOA, registro } from "./fixtures.test-util";

const d = (dia: number, h = 12) => new Date(2026, 9, dia, h);

test("dia sem nenhum preenchimento é 'sem informação', nunca 'sem crises'", () => {
  const c = calcularCobertura({ inicio: "2026-10-10", fim: "2026-10-12", registros: [], diasAnotados: [] });
  assert.equal(c.totalDias, 3);
  assert.equal(c.diasSemInformacao, 3);
  assert.equal(c.diasSemCrises, 0);
  assert.equal(c.episodios, 0);
  assert.ok(c.dias.every((x) => x.semInformacao && !x.semCrisesAnotado));
});

test("só a marcação explícita conta como dia sem crises", () => {
  const c = calcularCobertura({
    inicio: "2026-10-10",
    fim: "2026-10-12",
    registros: [registro(d(11), comida())],
    diasAnotados: [{ pessoaId: PESSOA, dia: "2026-10-12", semCrises: true, lancadoEm: d(12).toISOString() }],
  });
  const [d10, d11, d12] = c.dias;
  assert.equal(d10?.semInformacao, true);
  // Dia com registro mas sem marcação: tem informação, mas não é "sem crises".
  assert.equal(d11?.semInformacao, false);
  assert.equal(d11?.semCrisesAnotado, false);
  // Dia marcado sem nenhum outro registro: tem informação.
  assert.equal(d12?.semCrisesAnotado, true);
  assert.equal(d12?.semInformacao, false);
  assert.deepEqual([c.diasComRegistro, c.diasSemCrises, c.diasSemInformacao], [1, 1, 1]);
});

test("marcação com semCrises=false não vale como dia sem crises", () => {
  const c = calcularCobertura({
    inicio: "2026-10-10",
    fim: "2026-10-10",
    registros: [],
    diasAnotados: [{ pessoaId: PESSOA, dia: "2026-10-10", semCrises: false, lancadoEm: d(10).toISOString() }],
  });
  assert.equal(c.diasSemCrises, 0);
  assert.equal(c.diasSemInformacao, 1);
});

test("conta só episódios, não comportamentos calmos, e aponta inconsistência", () => {
  const c = calcularCobertura({
    inicio: "2026-10-10",
    fim: "2026-10-10",
    registros: [registro(d(10, 9), calmo), registro(d(10, 15), episodio)],
    diasAnotados: [{ pessoaId: PESSOA, dia: "2026-10-10", semCrises: true, lancadoEm: d(10, 20).toISOString() }],
  });
  assert.equal(c.episodios, 1);
  assert.equal(c.dias[0]?.registros, 2);
  assert.equal(c.dias[0]?.inconsistente, true);
  assert.equal(c.diasInconsistentes, 1);
});

test("registro fora do período não entra; período invertido fica vazio", () => {
  const c = calcularCobertura({
    inicio: "2026-10-10",
    fim: "2026-10-10",
    registros: [registro(d(9), episodio)],
    diasAnotados: [],
  });
  assert.equal(c.episodios, 0);
  assert.equal(calcularCobertura({ inicio: "2026-10-12", fim: "2026-10-10", registros: [], diasAnotados: [] }).totalDias, 0);
});
