import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIAS, LOCAIS } from "@eloazul/core";
import { categoriasVisiveis, CENARIOS, cenarioDoLocal, MAXIMO_POR_LADO } from "./cenarios";

test("há um cenário para cada local, sem repetição", () => {
  assert.deepEqual(CENARIOS.map((c) => c.local).sort(), [...LOCAIS].sort());
});

test("nenhum lado passa do limite de pílulas", () => {
  for (const c of CENARIOS) {
    assert.ok(c.esquerda.length <= MAXIMO_POR_LADO && c.direita.length <= MAXIMO_POR_LADO, c.local);
  }
});

test("toda categoria continua alcançável em qualquer cenário", () => {
  for (const c of CENARIOS) {
    const visiveis = new Set(categoriasVisiveis(c));
    const temTodas = [...c.esquerda, ...c.direita].includes("todas");
    const faltam = CATEGORIAS.filter((cat) => !visiveis.has(cat));
    assert.ok(faltam.length === 0 || temTodas, `${c.local}: faltam ${faltam.join(", ")} e não há "Todas"`);
  }
});

test("sem ações repetidas no mesmo cenário", () => {
  for (const c of CENARIOS) {
    const acoes = [...c.esquerda, ...c.direita];
    assert.equal(new Set(acoes).size, acoes.length, c.local);
  }
});

test("local desconhecido cai no primeiro cenário", () => {
  assert.equal(cenarioDoLocal("escola").local, "escola");
});
