import assert from "node:assert/strict";
import { test } from "node:test";
import { APARENCIA_PADRAO, aparenciaDosValores, movimentoEfetivo } from "./aparencia";

test("sem preferência salva, usa cenário, movimento automático, casa, som ainda não escolhido e slime azul", () => {
  assert.deepEqual(aparenciaDosValores({ modoVisual: null, movimento: null, local: null, som: null, corSlime: null, comemorativas: null }), APARENCIA_PADRAO);
  assert.equal(APARENCIA_PADRAO.comemorativas, "");
  assert.equal(APARENCIA_PADRAO.som, "pendente");
  assert.equal(APARENCIA_PADRAO.corSlime, "azul");
});

test("valores desconhecidos voltam ao padrão; conhecidos são mantidos", () => {
  assert.deepEqual(aparenciaDosValores({ modoVisual: "simples", movimento: "nenhum", local: "escola", som: "ligado", corSlime: "lilas", comemorativas: "natal,bruxas" }), {
    modoVisual: "simples",
    movimento: "nenhum",
    local: "escola",
    som: "ligado",
    corSlime: "lilas",
    comemorativas: "bruxas,natal",
  });
  assert.deepEqual(
    aparenciaDosValores({ modoVisual: "3d", movimento: "rapido", local: "shopping", som: "alto", corSlime: "verde", comemorativas: "carnaval" }),
    APARENCIA_PADRAO,
  );
});

test("automático segue o reduzir movimento do sistema; escolha explícita prevalece", () => {
  assert.equal(movimentoEfetivo("auto", false), "completo");
  assert.equal(movimentoEfetivo("auto", true), "reduzido");
  assert.equal(movimentoEfetivo("completo", true), "completo");
  assert.equal(movimentoEfetivo("nenhum", false), "nenhum");
});
