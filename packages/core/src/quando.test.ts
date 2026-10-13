import assert from "node:assert/strict";
import { test } from "node:test";
import { quandoNoFuturo, resolverQuando } from "./quando";

const AGORA = new Date(2026, 9, 13, 14, 30);

test("'agora' é exato e usa o dia local", () => {
  const q = resolverQuando({ tipo: "agora" }, AGORA);
  assert.deepEqual(q, { ocorreuEm: AGORA.toISOString(), ocorreuDia: "2026-10-13", precisao: "exato" });
});

test("'há N minutos' é aproximado e pode cair no dia anterior", () => {
  const madrugada = new Date(2026, 9, 13, 0, 20);
  const q = resolverQuando({ tipo: "minutos_atras", minutos: 60 }, madrugada);
  assert.equal(q.precisao, "aproximado");
  assert.equal(q.ocorreuDia, "2026-10-12");
});

test("data e hora escolhidas respeitam a marcação de aproximado", () => {
  const data = new Date(2026, 9, 12, 22, 10);
  assert.equal(resolverQuando({ tipo: "data_hora", data, aproximado: false }, AGORA).precisao, "exato");
  assert.equal(resolverQuando({ tipo: "data_hora", data, aproximado: true }, AGORA).precisao, "aproximado");
});

test("período do dia e só a data guardam o dia informado, sem inventar horário exato", () => {
  const p = resolverQuando({ tipo: "periodo", dia: "2026-10-12", periodo: "noite" }, AGORA);
  assert.equal(p.precisao, "periodo_do_dia");
  assert.equal(p.periodoDoDia, "noite");
  assert.equal(p.ocorreuDia, "2026-10-12");
  assert.equal(new Date(p.ocorreuEm).getHours(), 21);

  const s = resolverQuando({ tipo: "so_data", dia: "2026-10-11" }, AGORA);
  assert.equal(s.precisao, "so_data");
  assert.equal(s.ocorreuDia, "2026-10-11");
});

test("registros no futuro são recusados, com tolerância de relógio", () => {
  const daqui3 = resolverQuando({ tipo: "data_hora", data: new Date(2026, 9, 13, 14, 33), aproximado: false }, AGORA);
  const daqui30 = resolverQuando({ tipo: "data_hora", data: new Date(2026, 9, 13, 15, 0), aproximado: false }, AGORA);
  assert.equal(quandoNoFuturo(daqui3, AGORA), false);
  assert.equal(quandoNoFuturo(daqui30, AGORA), true);
  // A noite de hoje ainda não chegou, mas o período é aceito porque o dia não é futuro.
  assert.equal(quandoNoFuturo(resolverQuando({ tipo: "periodo", dia: "2026-10-13", periodo: "noite" }, AGORA), AGORA), false);
  assert.equal(quandoNoFuturo(resolverQuando({ tipo: "so_data", dia: "2026-10-14" }, AGORA), AGORA), true);
});
