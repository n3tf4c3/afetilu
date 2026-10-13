import assert from "node:assert/strict";
import { test } from "node:test";
import { APARENCIA_PADRAO, aparenciaDosValores, movimentoEfetivo } from "./aparencia";

test("sem preferência salva, usa cenário, movimento automático e casa", () => {
  assert.deepEqual(aparenciaDosValores({ modoVisual: null, movimento: null, local: null }), APARENCIA_PADRAO);
});

test("valores desconhecidos voltam ao padrão; conhecidos são mantidos", () => {
  assert.deepEqual(aparenciaDosValores({ modoVisual: "simples", movimento: "nenhum", local: "escola" }), {
    modoVisual: "simples",
    movimento: "nenhum",
    local: "escola",
  });
  assert.deepEqual(aparenciaDosValores({ modoVisual: "3d", movimento: "rapido", local: "shopping" }), APARENCIA_PADRAO);
});

test("automático segue o reduzir movimento do sistema; escolha explícita prevalece", () => {
  assert.equal(movimentoEfetivo("auto", false), "completo");
  assert.equal(movimentoEfetivo("auto", true), "reduzido");
  assert.equal(movimentoEfetivo("completo", true), "completo");
  assert.equal(movimentoEfetivo("nenhum", false), "nenhum");
});
