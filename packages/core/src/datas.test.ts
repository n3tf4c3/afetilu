import assert from "node:assert/strict";
import { test } from "node:test";
import { chaveDoDia, diaPorExtenso, diasDoPeriodo, rotuloDoDia, somarDias } from "./datas";
import { dominio } from "./i18n";

const pt = dominio("pt-BR");
const en = dominio("en");
const es = dominio("es");

test("chave do dia usa o fuso local e soma dias atravessando meses", () => {
  assert.equal(chaveDoDia(new Date(2026, 9, 13, 23, 59)), "2026-10-13");
  assert.equal(somarDias("2026-10-31", 1), "2026-11-01");
  assert.equal(somarDias("2026-03-01", -1), "2026-02-28");
  assert.deepEqual(diasDoPeriodo("2026-10-30", "2026-11-01"), ["2026-10-30", "2026-10-31", "2026-11-01"]);
});

test("rótulos de dia nos três idiomas", () => {
  assert.equal(rotuloDoDia("2026-10-13", "2026-10-13", pt), "hoje");
  assert.equal(rotuloDoDia("2026-10-12", "2026-10-13", en), "yesterday");
  assert.equal(rotuloDoDia("2026-10-01", "2026-10-13", pt), "01/10");
  assert.equal(rotuloDoDia("2026-10-01", "2026-10-13", en), "10/1");
  assert.equal(rotuloDoDia("2026-10-01", "2026-10-13", es), "01/10");
  assert.equal(diaPorExtenso("2026-10-03", pt), "3 de outubro");
  assert.equal(diaPorExtenso("2026-10-03", en), "October 3");
  assert.equal(diaPorExtenso("2026-10-03", es), "3 de octubre");
});

test("duração e hora por idioma", () => {
  assert.equal(pt.duracao(45), "45 min");
  assert.equal(pt.duracao(120), "2 h");
  assert.equal(pt.duracao(95), "1 h 35 min");
  assert.equal(pt.hora(new Date(2026, 9, 13, 13, 5)), "13:05");
  assert.equal(en.hora(new Date(2026, 9, 13, 13, 5)), "1:05 PM");
  assert.equal(en.hora(new Date(2026, 9, 13, 0, 30)), "12:30 AM");
  assert.equal(en.hora(new Date(2026, 9, 13, 12, 0)), "12:00 PM");
});
