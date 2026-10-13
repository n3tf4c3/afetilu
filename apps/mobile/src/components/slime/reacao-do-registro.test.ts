import assert from "node:assert/strict";
import { test } from "node:test";
import type { Detalhe, EntradaRegistro } from "@afetilu/core";
import { reacaoDoRegistro } from "./reacao-do-registro";

const AGORA = new Date(2026, 9, 13, 15, 0);
const r = (detalhe: Detalhe, minutosAtras = 0, precisao: EntradaRegistro["precisao"] = "exato") => ({
  detalhe,
  precisao,
  ocorreuEm: new Date(AGORA.getTime() - minutosAtras * 60000).toISOString(),
});

test("rotina tem reação, inclusive retroativa", () => {
  assert.equal(reacaoDoRegistro(r({ categoria: "sono", tipo: "noturno" }, 600), AGORA), "sono");
  assert.equal(reacaoDoRegistro(r({ categoria: "higiene", tipo: "banho" }), AGORA), "banho");
  assert.equal(reacaoDoRegistro(r({ categoria: "alimentacao", tipo: "comida", item: "x" }), AGORA), "alimentacao");
  assert.equal(reacaoDoRegistro(r({ categoria: "positivo", tipo: "conquista" }), AGORA), "positivo");
});

test("evacuação não anima o slime", () => {
  assert.equal(reacaoDoRegistro(r({ categoria: "evacuacao" }), AGORA), null);
});

test("dor e enjoo só reagem quando recentes e com horário", () => {
  assert.equal(reacaoDoRegistro(r({ categoria: "dor_desconforto", tipo: "enjoo" }, 10), AGORA), "enjoo");
  assert.equal(reacaoDoRegistro(r({ categoria: "dor_desconforto", tipo: "dor" }, 10), AGORA), "desconforto");
  assert.equal(reacaoDoRegistro(r({ categoria: "dor_desconforto", tipo: "enjoo" }, 61), AGORA), null);
  assert.equal(reacaoDoRegistro(r({ categoria: "dor_desconforto", tipo: "dor" }, 0, "periodo_do_dia"), AGORA), null);
});

test("episódio difícil fica neutro; calma vira momento positivo; outras emoções sem reação", () => {
  const episodio: Detalhe = { categoria: "comportamento", observado: ["agressividade"], ehEpisodio: true };
  assert.equal(reacaoDoRegistro(r(episodio), AGORA), "episodio");
  assert.equal(reacaoDoRegistro(r({ categoria: "comportamento", observado: ["calmo"], ehEpisodio: false }), AGORA), "positivo");
  assert.equal(reacaoDoRegistro(r({ categoria: "comportamento", observado: ["choro"], ehEpisodio: false }), AGORA), null);
  assert.equal(reacaoDoRegistro(r({ categoria: "comportamento", observado: ["calmo", "choro"], ehEpisodio: false }), AGORA), null);
});
