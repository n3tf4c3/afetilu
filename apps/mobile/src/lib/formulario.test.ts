import assert from "node:assert/strict";
import { test } from "node:test";
import { novoRegistro } from "@afetilu/core";
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
