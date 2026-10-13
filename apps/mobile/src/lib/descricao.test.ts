import assert from "node:assert/strict";
import { test } from "node:test";
import { chaveDoDia, type EntradaRegistro } from "@afetilu/core";
import { textos } from "../i18n";
import { descreverRegistro } from "./descricao";

const base: Omit<EntradaRegistro, "detalhe"> = {
  pessoaId: "p1",
  ocorreuEm: new Date(2026, 9, 13, 16).toISOString(),
  ocorreuDia: "2026-10-13",
  precisao: "exato",
  emAberto: false,
  origem: "me_contaram",
  origemQuem: "escola",
};

const descrever = (r: EntradaRegistro, hoje = "2026-10-13", idioma: "pt-BR" | "en" | "es" = "pt-BR") => {
  const { d, t } = textos(idioma);
  return descreverRegistro(r, hoje, chaveDoDia, d, t.descricao);
};

test("episódio é descrito com o critério de intensidade e as palavras do responsável", () => {
  const linhas = descrever({
    ...base,
    detalhe: {
      categoria: "comportamento",
      observado: ["agitacao", "choro"],
      ehEpisodio: true,
      episodio: { duracaoMin: 15, intensidade: "moderada", contextoAntes: "barulho", lesao: "nao", ajudou: ["silêncio"] },
    },
  });
  const mapa = Object.fromEntries(linhas.map((l) => [l.rotulo, l.valor]));
  assert.equal(mapa["Observado"], "Agitação, Choro");
  assert.equal(mapa["Duração"], "15 min");
  assert.match(mapa["Intensidade"]!, /^Moderada — Interrompeu/);
  assert.equal(mapa["Contexto anterior"], "barulho");
  assert.equal(mapa["Origem da informação"], "Me contaram (escola)");
});

test("mesma descrição em inglês e espanhol", () => {
  const r: EntradaRegistro = { ...base, detalhe: { categoria: "dor_desconforto", tipo: "enjoo", regiao: "barriga" } };
  const en = Object.fromEntries(descrever(r, "2026-10-13", "en").map((l) => [l.rotulo, l.valor]));
  assert.equal(en["Perceived type"], "Nausea");
  assert.equal(en["Source of information"], "Someone told me (escola)");
  const es = Object.fromEntries(descrever(r, "2026-10-13", "es").map((l) => [l.rotulo, l.valor]));
  assert.equal(es["Zona"], "Barriga");
});

test("campos vazios não aparecem e término em aberto é explícito", () => {
  const linhas = descrever({
    ...base,
    origemQuem: undefined,
    emAberto: true,
    observacao: "  ",
    detalhe: { categoria: "dor_desconforto", tipo: "enjoo" },
  });
  const rotulos = linhas.map((l) => l.rotulo);
  assert.ok(!rotulos.includes("Região"));
  assert.ok(!rotulos.includes("Observação"));
  assert.equal(linhas.find((l) => l.rotulo === "Término")?.valor, "Em aberto (ainda não registrado)");
});

test("término com horário e demais categorias", () => {
  const sono = descrever(
    { ...base, ocorreuFim: new Date(2026, 9, 14, 6, 30).toISOString(), detalhe: { categoria: "sono", tipo: "noturno", despertares: 2 } },
    "2026-10-14",
  );
  assert.equal(sono.find((l) => l.rotulo === "Término")?.valor, "hoje, 06:30");
  assert.equal(sono.find((l) => l.rotulo === "Despertares")?.valor, "2");
  const outros: EntradaRegistro["detalhe"][] = [
    { categoria: "alimentacao", tipo: "bebida", item: "água", quantidade: "pouco" },
    { categoria: "higiene", tipo: "banho", aceitacao: "com_ajuda" },
    { categoria: "evacuacao", aspecto: "normal" },
    { categoria: "positivo", tipo: "conquista", descricao: "subiu a escada" },
  ];
  for (const detalhe of outros) assert.ok(descrever({ ...base, detalhe }).length >= 3);
});
