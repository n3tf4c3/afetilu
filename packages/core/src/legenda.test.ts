import assert from "node:assert/strict";
import { test } from "node:test";
import { comida, enjoo, episodio, registro, sono } from "./fixtures.test-util";
import { dominio, IDIOMAS, type ChaveNome } from "./i18n";
import { chaveDoNome, horarioLegivel, legendaDoRegistro, nomeDoRegistro } from "./legenda";
import type { Detalhe } from "./tipos";

const HOJE = "2026-10-13";
const pt = dominio("pt-BR");
const en = dominio("en");
const es = dominio("es");

test("legenda descreve o registro com o horário do evento", () => {
  const r = registro(new Date(2026, 9, 13, 13, 10), sono);
  assert.equal(legendaDoRegistro(r, HOJE, pt), "Sono registrado · 13:10");
  assert.equal(legendaDoRegistro(r, HOJE, en), "Sleep logged · 1:10 PM");
  assert.equal(legendaDoRegistro(r, HOJE, es), "Sueño registrado · 13:10");
});

test("registro retroativo diz para quando foi registrado", () => {
  const ontem = registro(new Date(2026, 9, 12, 22, 10), sono);
  assert.equal(legendaDoRegistro(ontem, HOJE, pt), "Sono registrado para ontem · 22:10");
  assert.equal(legendaDoRegistro(ontem, HOJE, en), "Sleep logged for yesterday · 10:10 PM");
  assert.equal(legendaDoRegistro(ontem, HOJE, es), "Sueño registrado para ayer · 22:10");
  const antigo = registro(new Date(2026, 9, 8, 12), comida(), { precisao: "so_data" });
  assert.equal(legendaDoRegistro(antigo, HOJE, pt), "Alimentação registrada para 08/10");
  assert.equal(legendaDoRegistro(antigo, HOJE, es), "Comida registrada para 08/10");
});

test("suspeita fica identificada como suspeita em todos os idiomas", () => {
  const r = registro(new Date(2026, 9, 13, 14, 20), enjoo, { origem: "suspeita" });
  assert.equal(legendaDoRegistro(r, HOJE, pt), "Suspeita registrada: enjoo · 14:20");
  assert.equal(legendaDoRegistro(r, HOJE, en), "Suspicion logged: nausea · 2:20 PM");
  assert.equal(legendaDoRegistro(r, HOJE, es), "Sospecha registrada: náusea · 14:20");
});

test("horário aproximado e período do dia aparecem como tal", () => {
  const r = registro(new Date(2026, 9, 13, 15), episodio, { precisao: "periodo_do_dia", periodoDoDia: "tarde" });
  assert.equal(legendaDoRegistro(r, HOJE, pt), "Episódio registrado · à tarde");
  assert.equal(legendaDoRegistro(r, HOJE, en), "Episode logged · in the afternoon");
  const aprox = { ocorreuEm: new Date(2026, 9, 13, 8, 5).toISOString(), precisao: "aproximado" as const };
  assert.equal(horarioLegivel(aprox, pt), "por volta de 08:05");
  assert.equal(horarioLegivel(aprox, es), "alrededor de las 08:05");
  assert.equal(horarioLegivel({ ocorreuEm: r.ocorreuEm, precisao: "periodo_do_dia" }, pt), "");
});

test("concordância de gênero em português e espanhol", () => {
  const casos: [Detalhe, string, string][] = [
    [{ categoria: "alimentacao", tipo: "bebida", item: "água" }, "Bebida registrada", "Bebida registrada"],
    [{ categoria: "dor_desconforto", tipo: "dor" }, "Dor registrada", "Dolor registrado"],
    [{ categoria: "dor_desconforto", tipo: "outro" }, "Desconforto registrado", "Malestar registrado"],
    [{ categoria: "comportamento", observado: ["calmo"], ehEpisodio: false }, "Comportamento registrado", "Conducta registrada"],
    [{ categoria: "higiene", tipo: "banho" }, "Banho registrado", "Baño registrado"],
    [{ categoria: "higiene", tipo: "escovacao" }, "Escovação registrada", "Cepillado registrado"],
    [{ categoria: "sono", tipo: "cochilo" }, "Cochilo registrado", "Siesta registrada"],
    [{ categoria: "evacuacao" }, "Evacuação registrada", "Evacuación registrada"],
    [{ categoria: "positivo", tipo: "conquista" }, "Conquista registrada", "Logro registrado"],
    [{ categoria: "positivo", tipo: "tranquilo" }, "Período tranquilo registrado", "Periodo tranquilo registrado"],
  ];
  for (const [detalhe, emPt, emEs] of casos) {
    const r = registro(new Date(2026, 9, 13, 12), detalhe, { precisao: "so_data" });
    assert.equal(legendaDoRegistro(r, HOJE, pt), emPt);
    assert.equal(legendaDoRegistro(r, HOJE, es), emEs);
  }
  assert.deepEqual(nomeDoRegistro(enjoo, pt), { nome: "Enjoo", genero: "m" });
});

test("todo tipo de registro tem nome em todos os idiomas", () => {
  const detalhes: Detalhe[] = [
    comida(), { categoria: "alimentacao", tipo: "bebida", item: "x" },
    ...(["dor", "enjoo", "coceira", "tontura", "outro"] as const).map((tipo): Detalhe => ({ categoria: "dor_desconforto", tipo })),
    episodio, { categoria: "comportamento", observado: ["calmo"], ehEpisodio: false },
    ...(["banho", "escovacao", "troca", "outro"] as const).map((tipo): Detalhe => ({ categoria: "higiene", tipo })),
    sono, { categoria: "sono", tipo: "cochilo" }, { categoria: "evacuacao" },
    ...(["comunicacao", "atividade", "conquista", "tranquilo", "estrategia"] as const).map((tipo): Detalhe => ({ categoria: "positivo", tipo })),
  ];
  const chaves = new Set<ChaveNome>(detalhes.map(chaveDoNome));
  for (const idioma of IDIOMAS) {
    const t = dominio(idioma);
    for (const d of detalhes) assert.ok(nomeDoRegistro(d, t).nome.trim(), `${idioma}: nome vazio`);
    // Toda chave do dicionário é alcançável por algum registro.
    assert.deepEqual(new Set(Object.keys(t.nomeRegistro)), chaves);
  }
});
