import assert from "node:assert/strict";
import { test } from "node:test";
import { contextoDaUltimaRefeicao } from "./contexto";
import { comida, enjoo, registro } from "./fixtures.test-util";
import { dominio } from "./i18n";

const h = (hora: number, min = 0) => new Date(2026, 9, 13, hora, min);
const pt = dominio("pt-BR");

test("mostra a refeição anterior mais recente com a distância no tempo", () => {
  const refeicoes = [registro(h(8), comida("pão")), registro(h(12, 30), comida("arroz"))];
  const desconforto = registro(h(13, 10), enjoo);
  const todos = [...refeicoes, desconforto];
  assert.equal(contextoDaUltimaRefeicao(desconforto, todos, pt), "Última refeição registrada: 12:30 (40 min antes)");
  assert.equal(contextoDaUltimaRefeicao(desconforto, todos, dominio("en")), "Last logged meal: 12:30 PM (40 min before)");
  assert.equal(contextoDaUltimaRefeicao(desconforto, todos, dominio("es")), "Última comida registrada: 12:30 (40 min antes)");
});

test("não cita o alimento, para não sugerir causa", () => {
  const texto = contextoDaUltimaRefeicao(registro(h(14), enjoo), [registro(h(12), comida("leite"))], pt);
  assert.ok(texto && !texto.includes("leite"));
});

test("ignora refeições depois do evento, fora da janela, bebidas e de outra pessoa", () => {
  const ref = registro(h(13), enjoo);
  const outras = [
    registro(h(13, 30), comida()),
    registro(h(5), comida()),
    registro(h(12, 50), { categoria: "alimentacao", tipo: "bebida", item: "suco" }),
    registro(h(12, 45), comida(), { pessoaId: "outra-pessoa" }),
  ];
  assert.equal(contextoDaUltimaRefeicao(ref, outras, pt), null);
});

test("sem horário confiável, não mostra contexto", () => {
  const porPeriodo = registro(h(15), enjoo, { precisao: "periodo_do_dia", periodoDoDia: "tarde" });
  assert.equal(contextoDaUltimaRefeicao(porPeriodo, [registro(h(14), comida())], pt), null);
  const refeicaoSemHora = registro(h(12), comida(), { precisao: "so_data" });
  assert.equal(contextoDaUltimaRefeicao(registro(h(13), enjoo), [refeicaoSemHora], pt), null);
});

test("aproximação e horários iguais são descritos sem exagero", () => {
  const ref = registro(h(13), enjoo);
  assert.equal(
    contextoDaUltimaRefeicao(ref, [registro(h(11), comida(), { precisao: "aproximado" })], pt),
    "Última refeição registrada: por volta de 11:00 (2 h antes)",
  );
  assert.equal(contextoDaUltimaRefeicao(ref, [registro(h(13), comida())], pt), "Última refeição registrada: 13:00 (no mesmo horário)");
});
