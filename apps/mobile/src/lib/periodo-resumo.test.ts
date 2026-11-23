import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_DIAS_RESUMO, resolverPeriodoResumo } from "./periodo-resumo";

test("períodos prontos calculam início inclusivo até hoje", () => {
  const r = resolverPeriodoResumo({
    opcao: 30,
    hoje: "2026-10-14",
    inicioPersonalizado: "2026-10-01",
    fimPersonalizado: "2026-10-14",
  });
  assert.deepEqual(r, { ok: true, inicio: "2026-09-15", fim: "2026-10-14", totalDias: 30 });
});

test("período personalizado aceita um único dia ou vários meses", () => {
  const umDia = resolverPeriodoResumo({
    opcao: "personalizado",
    hoje: "2026-10-14",
    inicioPersonalizado: "2026-10-10",
    fimPersonalizado: "2026-10-10",
  });
  assert.deepEqual(umDia, { ok: true, inicio: "2026-10-10", fim: "2026-10-10", totalDias: 1 });

  const quarentaECinco = resolverPeriodoResumo({
    opcao: "personalizado",
    hoje: "2026-10-14",
    inicioPersonalizado: "2026-08-31",
    fimPersonalizado: "2026-10-14",
  });
  assert.deepEqual(quarentaECinco, { ok: true, inicio: "2026-08-31", fim: "2026-10-14", totalDias: 45 });
});

test("período invertido é recusado", () => {
  const r = resolverPeriodoResumo({
    opcao: "personalizado",
    hoje: "2026-10-14",
    inicioPersonalizado: "2026-10-15",
    fimPersonalizado: "2026-10-10",
  });
  assert.deepEqual(r, { ok: false, erro: "invertido" });
});

test("período maior que o máximo é recusado", () => {
  const r = resolverPeriodoResumo({
    opcao: "personalizado",
    hoje: "2026-10-14",
    inicioPersonalizado: "2025-10-01",
    fimPersonalizado: "2026-10-14",
  });
  assert.deepEqual(r, { ok: false, erro: "muito_longo" });
  assert.equal(MAX_DIAS_RESUMO, 365);
});
