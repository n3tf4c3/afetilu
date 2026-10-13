import assert from "node:assert/strict";
import { test } from "node:test";
import { entradaRegistro, novoRegistro, type Registro } from "@eloazul/core";
import { gerarDadosFicticios } from "./dados-ficticios";
import { textos } from "../i18n";
import { montarLinhaDoTempo, resumoDoDia } from "./linha-do-tempo";

const pt = textos("pt-BR").t.linha;

const HOJE = new Date(2026, 9, 13, 20, 0);

function registrosFicticios(): { registros: Registro[]; diasSemCrises: string[] } {
  const { registros, diasSemCrises } = gerarDadosFicticios("p1", HOJE, 14);
  return { registros: registros.map((e, i) => novoRegistro(e, `r${i}`, e.ocorreuEm)), diasSemCrises };
}

test("dados fictícios são válidos, não estão no futuro e incluem dias sem informação", () => {
  const { registros, diasSemCrises } = gerarDadosFicticios("p1", HOJE, 14);
  assert.ok(registros.length > 20);
  for (const e of registros) {
    assert.equal(entradaRegistro.safeParse(e).success, true);
    assert.ok(Date.parse(e.ocorreuEm) <= HOJE.getTime());
  }
  const linha = montarLinhaDoTempo({
    inicio: "2026-09-30",
    fim: "2026-10-13",
    registros: registrosFicticios().registros,
    diasAnotados: diasSemCrises.map((dia) => ({ pessoaId: "p1", dia, semCrises: true, lancadoEm: "x" })),
    filtro: "todas",
  });
  assert.ok(linha.some((d) => d.situacao.semInformacao));
  assert.ok(linha.some((d) => d.situacao.semCrisesAnotado));
});

test("linha do tempo vem do dia mais recente ao mais antigo", () => {
  const linha = montarLinhaDoTempo({ inicio: "2026-10-11", fim: "2026-10-13", registros: [], diasAnotados: [], filtro: "todas" });
  assert.deepEqual(linha.map((d) => d.situacao.dia), ["2026-10-13", "2026-10-12", "2026-10-11"]);
});

test("filtrar por categoria não transforma o dia em 'sem informação'", () => {
  const { registros } = registrosFicticios();
  const dia = registros.find((r) => r.detalhe.categoria === "alimentacao")!.ocorreuDia;
  const linha = montarLinhaDoTempo({ inicio: dia, fim: dia, registros, diasAnotados: [], filtro: "evacuacao" });
  assert.equal(linha[0]?.registros.length, 0);
  assert.equal(linha[0]?.situacao.semInformacao, false);
});

test("registros do dia ficam do mais recente ao mais antigo", () => {
  const { registros } = registrosFicticios();
  const dia = registros[0]!.ocorreuDia;
  const lista = montarLinhaDoTempo({ inicio: dia, fim: dia, registros, diasAnotados: [], filtro: "todas" })[0]!.registros;
  for (let i = 1; i < lista.length; i++) assert.ok(Date.parse(lista[i - 1]!.ocorreuEm) >= Date.parse(lista[i]!.ocorreuEm));
});

test("resumo do dia distingue sem informação, registros e sem crises", () => {
  const base = { dia: "2026-10-13", episodios: 0, inconsistente: false };
  assert.match(resumoDoDia({ ...base, registros: 0, semCrisesAnotado: false, semInformacao: true }, pt), /sem informação/);
  assert.equal(resumoDoDia({ ...base, registros: 1, semCrisesAnotado: false, semInformacao: false }, pt), "1 registro");
  assert.equal(
    resumoDoDia({ ...base, registros: 3, semCrisesAnotado: true, semInformacao: false }, pt),
    "3 registros · marcado como dia sem crises",
  );
  assert.equal(
    resumoDoDia({ ...base, registros: 0, semCrisesAnotado: true, semInformacao: false }, pt),
    "marcado como dia sem crises",
  );
});
