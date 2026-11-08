import assert from "node:assert/strict";
import { test } from "node:test";
import { chaveDoDia, novoRegistro, somarDias } from "@afetilu/core";
import { formularioDoRegistro, formularioNovo, montarEntrada } from "./formulario";

const AGORA = new Date(2026, 9, 13, 14, 30);

test("registro mínimo: tocar na categoria, preencher o essencial e salvar", () => {
  const f = formularioNovo("evacuacao", AGORA);
  f.rascunho = { ...f.rascunho, tipo: "xixi" };
  const r = montarEntrada(f, "p1", AGORA);
  assert.ok(r.ok);
  assert.equal(r.entrada.precisao, "exato");
  assert.equal(r.entrada.origem, "vi");
  assert.equal(r.entrada.observacao, undefined);
});

test("campos essenciais faltando geram mensagem clara", () => {
  const alimento = montarEntrada(formularioNovo("alimentacao", AGORA), "p1", AGORA);
  assert.deepEqual(alimento, { ok: false, erro: "item" });
  const dor = montarEntrada(formularioNovo("dor_desconforto", AGORA), "p1", AGORA);
  assert.deepEqual(dor, { ok: false, erro: "tipo" });
  const comp = montarEntrada(formularioNovo("comportamento", AGORA), "p1", AGORA);
  assert.deepEqual(comp, { ok: false, erro: "observado" });
});

test("horário no futuro é recusado", () => {
  const f = { ...formularioNovo("sono", AGORA), quando: { tipo: "data_hora" as const, data: new Date(2026, 9, 13, 18), aproximado: false } };
  assert.deepEqual(montarEntrada(f, "p1", AGORA), { ok: false, erro: "futuro" });
});

test("término só vale para categorias com duração", () => {
  const sono = { ...formularioNovo("sono", AGORA), quando: { tipo: "minutos_atras" as const, minutos: 120 }, termino: "em_aberto" as const };
  const r1 = montarEntrada(sono, "p1", AGORA);
  assert.ok(r1.ok && r1.entrada.emAberto);
  const banho = { ...formularioNovo("higiene", AGORA), rascunho: { categoria: "higiene" as const, tipo: "banho" }, termino: "em_aberto" as const };
  const r2 = montarEntrada(banho, "p1", AGORA);
  assert.ok(r2.ok && !r2.entrada.emAberto);
});

test("detalhes de episódio somem se o comportamento não for marcado como episódio", () => {
  const f = {
    ...formularioNovo("comportamento", AGORA),
    rascunho: { categoria: "comportamento" as const, observado: ["calmo"], ehEpisodio: false, episodio: { intensidade: "leve" } },
  };
  const r = montarEntrada(f, "p1", AGORA);
  assert.ok(r.ok);
  assert.equal(r.entrada.detalhe.categoria === "comportamento" && r.entrada.detalhe.episodio, undefined);
});

test("xixi ou cocô é escolha obrigatória; aspecto só fica no cocô", () => {
  const f = formularioNovo("evacuacao", AGORA);
  assert.deepEqual(montarEntrada(f, "p1", AGORA), { ok: false, erro: "tipo" });
  const coco = montarEntrada({ ...f, rascunho: { ...f.rascunho, tipo: "coco", onde: "fralda", aspecto: " pastoso " } }, "p1", AGORA);
  assert.ok(coco.ok);
  assert.deepEqual(coco.entrada.detalhe, { categoria: "evacuacao", tipo: "coco", onde: "fralda", aspecto: "pastoso" });
  // Trocar para xixi depois de escrever o aspecto descarta o aspecto.
  const xixi = montarEntrada({ ...f, rascunho: { ...f.rascunho, tipo: "xixi", aspecto: "pastoso" } }, "p1", AGORA);
  assert.ok(xixi.ok);
  assert.deepEqual(xixi.entrada.detalhe, { categoria: "evacuacao", tipo: "xixi" });
});

test("'me contaram' guarda quem contou; outras origens descartam", () => {
  const f = { ...formularioNovo("evacuacao", AGORA), origem: "me_contaram" as const, origemQuem: " escola " };
  f.rascunho = { ...f.rascunho, tipo: "xixi" };
  const r = montarEntrada(f, "p1", AGORA);
  assert.ok(r.ok && r.entrada.origemQuem === "escola");
  const s = montarEntrada({ ...f, origem: "suspeita" }, "p1", AGORA);
  assert.ok(s.ok && s.entrada.origemQuem === undefined);
});

test("abrir para correção reconstrói o formulário com a mesma precisão", () => {
  const casos = [
    { precisao: "aproximado" as const },
    { precisao: "periodo_do_dia" as const, periodoDoDia: "tarde" as const },
    { precisao: "so_data" as const },
  ];
  for (const extra of casos) {
    const r = novoRegistro(
      {
        pessoaId: "p1",
        ocorreuEm: new Date(2026, 9, 12, 15).toISOString(),
        ocorreuDia: "2026-10-12",
        emAberto: false,
        origem: "vi",
        detalhe: { categoria: "evacuacao", tipo: "coco" },
        ...extra,
      },
      "r1",
      AGORA.toISOString(),
    );
    const volta = montarEntrada(formularioDoRegistro(r, AGORA), "p1", AGORA);
    assert.ok(volta.ok);
    assert.equal(volta.entrada.precisao, extra.precisao);
    assert.equal(volta.entrada.ocorreuDia, "2026-10-12");
  }
});

test("local do cenário vai para o registro e pode ser removido", () => {
  const f = formularioNovo("comportamento", AGORA, "escola");
  const r = montarEntrada({ ...f, rascunho: { categoria: "comportamento", observado: ["calmo"], ehEpisodio: false } }, "p1", AGORA);
  assert.ok(r.ok && r.entrada.local === "escola");
  const sem = montarEntrada({ ...f, local: undefined, rascunho: { categoria: "comportamento", observado: ["calmo"], ehEpisodio: false } }, "p1", AGORA);
  assert.ok(sem.ok && sem.entrada.local === undefined);
});

// Achado 8 (auditoria 06/11/2026): registro lançado em outro fuso. O dia salvo difere do dia que
// o fuso atual calcularia para o mesmo instante; corrigir só o texto não pode mudar o dia.
function lancadoEmOutroFuso(extra: Partial<Parameters<typeof novoRegistro>[0]> = {}) {
  const instante = new Date(2026, 9, 12, 1, 0);
  const diaDeOutroFuso = somarDias(chaveDoDia(instante), -1);
  return novoRegistro(
    {
      pessoaId: "p1",
      ocorreuEm: instante.toISOString(),
      ocorreuDia: diaDeOutroFuso,
      precisao: "exato",
      emAberto: false,
      origem: "vi",
      detalhe: { categoria: "evacuacao", tipo: "xixi" },
      ...extra,
    },
    "r1",
    AGORA.toISOString(),
  );
}

test("corrigir só a observação mantém instante, dia e precisão salvos, mesmo após troca de fuso", () => {
  for (const precisao of ["exato", "aproximado"] as const) {
    const r = lancadoEmOutroFuso({ precisao });
    const f = { ...formularioDoRegistro(r, AGORA), observacao: "texto corrigido" };
    const volta = montarEntrada(f, "p1", AGORA);
    assert.ok(volta.ok);
    assert.equal(volta.entrada.ocorreuDia, r.ocorreuDia, precisao);
    assert.equal(volta.entrada.ocorreuEm, r.ocorreuEm, precisao);
    assert.equal(volta.entrada.precisao, precisao);
    assert.equal(volta.entrada.observacao, "texto corrigido");
  }
});

test("período do dia sem alteração mantém o instante salvo", () => {
  const r = lancadoEmOutroFuso({ precisao: "periodo_do_dia", periodoDoDia: "madrugada", ocorreuEm: "2026-10-11T07:00:00.000Z", ocorreuDia: "2026-10-11" });
  const volta = montarEntrada({ ...formularioDoRegistro(r, AGORA), observacao: "x" }, "p1", AGORA);
  assert.ok(volta.ok);
  assert.equal(volta.entrada.ocorreuEm, "2026-10-11T07:00:00.000Z");
  assert.equal(volta.entrada.periodoDoDia, "madrugada");
});

test("mudar o quando de propósito recalcula no fuso atual", () => {
  const r = lancadoEmOutroFuso();
  const nova = new Date(2026, 9, 13, 10, 0);
  const f = { ...formularioDoRegistro(r, AGORA), quando: { tipo: "data_hora" as const, data: nova, aproximado: false } };
  const volta = montarEntrada(f, "p1", AGORA);
  assert.ok(volta.ok);
  assert.equal(volta.entrada.ocorreuEm, nova.toISOString());
  assert.equal(volta.entrada.ocorreuDia, chaveDoDia(nova));
  // Voltar para "aproximado" no mesmo instante também é mudança: recalcula a precisão.
  const g = { ...formularioDoRegistro(r, AGORA), quando: { tipo: "data_hora" as const, data: new Date(r.ocorreuEm), aproximado: true } };
  const aprox = montarEntrada(g, "p1", AGORA);
  assert.ok(aprox.ok);
  assert.equal(aprox.entrada.precisao, "aproximado");
  assert.equal(aprox.entrada.ocorreuDia, chaveDoDia(new Date(r.ocorreuEm)));
});
