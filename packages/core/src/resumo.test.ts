import assert from "node:assert/strict";
import { test } from "node:test";
import { calmo, comida, enjoo, episodio, PESSOA, registro, sono } from "./fixtures.test-util";
import { montarResumo } from "./resumo";
import { CATEGORIAS, type Detalhe } from "./tipos";

const d = (dia: number, h = 12) => new Date(2026, 9, dia, h);
const ep = (extra: Partial<Extract<Detalhe, { categoria: "comportamento" }>["episodio"]>): Detalhe => ({
  categoria: "comportamento",
  observado: ["agitacao"],
  ehEpisodio: true,
  episodio: { ...extra },
});
const positivo: Detalhe = { categoria: "positivo", tipo: "conquista", descricao: "Pediu água com palavras" };

const base = { inicio: "2026-10-10", fim: "2026-10-16", categorias: CATEGORIAS, diasAnotados: [] };

test("separa episódios, momentos positivos e demais registros, em ordem cronológica", () => {
  const r = montarResumo({
    ...base,
    registros: [registro(d(12, 18), comida()), registro(d(11), episodio), registro(d(12, 8), positivo), registro(d(10), sono)],
  });
  assert.equal(r.episodios.length, 1);
  assert.equal(r.positivos.length, 1);
  assert.deepEqual(
    r.demais.map((x) => x.detalhe.categoria),
    ["sono", "alimentacao"],
  );
  assert.equal(r.porCategoria.comportamento, 1);
  assert.equal(r.porCategoria.alimentacao, 1);
  assert.equal(r.totalDias, 7);
  assert.equal(r.vazio, false);
});

test("comportamento calmo não é episódio e fica nos demais", () => {
  const r = montarResumo({ ...base, registros: [registro(d(11), calmo)] });
  assert.equal(r.episodios.length, 0);
  assert.equal(r.demais.length, 1);
});

test("filtrar categorias não esvazia a cobertura: dia com registro de outra categoria continua com registro", () => {
  const r = montarResumo({ ...base, categorias: ["comportamento"], registros: [registro(d(11), comida())] });
  assert.equal(r.demais.length, 0);
  assert.equal(r.porCategoria.alimentacao, 0);
  assert.equal(r.cobertura.diasComRegistro, 1);
  assert.equal(r.vazio, true);
});

test("intensidade conta cada episódio; sem intensidade vira 'não informada'", () => {
  const r = montarResumo({
    ...base,
    registros: [registro(d(10), ep({ intensidade: "leve" })), registro(d(11), ep({ intensidade: "leve" })), registro(d(12), ep({}))],
  });
  assert.equal(r.intensidades.leve, 2);
  assert.equal(r.intensidades.nao_informada, 1);
  assert.equal(r.intensidades.intensa, 0);
});

test("'o que ajudou' é contagem literal em ordem alfabética, sem ranking", () => {
  const r = montarResumo({
    ...base,
    registros: [
      registro(d(10), ep({ ajudou: ["Música", "abraço"] })),
      registro(d(11), ep({ ajudou: ["música ", "Música"] })),
      registro(d(12), ep({ ajudou: ["Música"] })),
      registro(d(13), ep({})),
    ],
  });
  assert.deepEqual(r.ajudou, [
    { texto: "abraço", episodios: 1 },
    { texto: "Música", episodios: 3 },
  ]);
  assert.equal(r.episodiosComAjudou, 3);
});

test("conta origens e registros corrigidos das categorias incluídas", () => {
  const r = montarResumo({
    ...base,
    registros: [
      registro(d(10), enjoo, { origem: "suspeita" }),
      registro(d(11), comida(), { origem: "me_contaram", versao: 3 }),
      registro(d(12), sono),
    ],
  });
  assert.deepEqual(r.origens, { vi: 1, me_contaram: 1, suspeita: 1 });
  assert.equal(r.corrigidos, 1);
});

test("registros fora do período não entram", () => {
  const r = montarResumo({ ...base, registros: [registro(d(9), comida()), registro(d(17), comida())] });
  assert.equal(r.porCategoria.alimentacao, 0);
  assert.equal(r.cobertura.diasComRegistro, 0);
  assert.equal(r.vazio, true);
});

test("período só com dias marcados sem crises não é vazio", () => {
  const r = montarResumo({
    ...base,
    registros: [],
    diasAnotados: [{ pessoaId: PESSOA, dia: "2026-10-12", semCrises: true, lancadoEm: d(12).toISOString() }],
  });
  assert.equal(r.vazio, false);
  assert.equal(r.cobertura.diasSemCrises, 1);
  assert.equal(r.cobertura.diasSemInformacao, 6);
});
