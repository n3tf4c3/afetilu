import assert from "node:assert/strict";
import { test } from "node:test";
import { novoRegistro, type Detalhe, type Registro } from "@afetilu/core";
import { sugestoesDeAjudou, sugestoesDeAlimentos } from "./sugestoes";

let seq = 0;
function reg(dia: string, hora: number, detalhe: Detalhe): Registro {
  seq += 1;
  const iso = `${dia}T${String(hora).padStart(2, "0")}:00:00.000Z`;
  return novoRegistro(
    {
      pessoaId: "p1",
      ocorreuEm: iso,
      ocorreuDia: dia,
      precisao: "exato",
      emAberto: false,
      origem: "vi",
      detalhe,
    },
    `r${seq}`,
    iso,
  );
}

test("sugestoesDeAlimentos prioriza os mais frequentes, separa comida de bebida e unifica acentos/caixa", () => {
  const lista = [
    reg("2026-10-10", 8, { categoria: "alimentacao", tipo: "comida", item: "banana" }),
    reg("2026-10-11", 8, { categoria: "alimentacao", tipo: "comida", item: "Maçã" }),
    reg("2026-10-12", 8, { categoria: "alimentacao", tipo: "comida", item: "Banana" }),
    reg("2026-10-13", 8, { categoria: "alimentacao", tipo: "comida", item: "maca" }),
    reg("2026-10-13", 12, { categoria: "alimentacao", tipo: "comida", item: "Banana" }),
    reg("2026-10-13", 15, { categoria: "alimentacao", tipo: "bebida", item: "Água" }),
  ];

  assert.deepEqual(sugestoesDeAlimentos(lista, "comida"), ["Banana", "maca"]);
  assert.deepEqual(sugestoesDeAlimentos(lista, "bebida"), ["Água"]);
});

test("sugestoesDeAjudou devolve itens únicos respeitando limite", () => {
  const lista = [
    reg("2026-10-10", 10, {
      categoria: "comportamento",
      observado: ["agitacao"],
      ehEpisodio: true,
      episodio: { ajudou: ["Fone abafador", "Ambiente silencioso"] },
    }),
    reg("2026-10-11", 10, {
      categoria: "comportamento",
      observado: ["choro"],
      ehEpisodio: true,
      episodio: { ajudou: ["fone abafador", "Abraço firme"] },
    }),
  ];

  assert.deepEqual(sugestoesDeAjudou(lista), ["Fone abafador", "Ambiente silencioso", "Abraço firme"]);
  assert.deepEqual(sugestoesDeAjudou(lista, 2), ["Fone abafador", "Ambiente silencioso"]);
});
