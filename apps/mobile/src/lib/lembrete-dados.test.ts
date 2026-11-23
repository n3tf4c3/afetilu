import assert from "node:assert/strict";
import { test } from "node:test";
import { formatarHoraLembrete, LEMBRETE_PADRAO, lembreteDosValores } from "./lembrete-dados";

test("lembrete vem desligado por padrão e ignora valores inválidos", () => {
  assert.deepEqual(lembreteDosValores({}), LEMBRETE_PADRAO);
  assert.deepEqual(lembreteDosValores({ ativo: null, hora: null }), { ativo: false, hora: 20 });
  assert.deepEqual(lembreteDosValores({ ativo: "sim", hora: "99" }), { ativo: false, hora: 20 });
});

test("lembrete lê valores válidos gravados", () => {
  assert.deepEqual(lembreteDosValores({ ativo: "1", hora: "21" }), { ativo: true, hora: 21 });
  assert.deepEqual(lembreteDosValores({ ativo: "0", hora: "19" }), { ativo: false, hora: 19 });
});

test("formatação da hora respeita 12h no inglês e 24h em pt-BR/es", () => {
  assert.equal(formatarHoraLembrete(20, "pt-BR"), "20:00");
  assert.equal(formatarHoraLembrete(20, "es"), "20:00");
  assert.equal(formatarHoraLembrete(20, "en"), "8:00 PM");
  assert.equal(formatarHoraLembrete(22, "en"), "10:00 PM");
});
