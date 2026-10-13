import assert from "node:assert/strict";
import { test } from "node:test";
import type { Registro } from "@afetilu/core";
import { diaAnotadoDaLinha, linhaDoRegistro, registroDaLinha, revisaoDaLinha } from "./linhas";

const r: Registro = {
  id: "r1",
  pessoaId: "p1",
  ocorreuEm: "2026-10-13T15:00:00.000Z",
  ocorreuDia: "2026-10-13",
  precisao: "exato",
  emAberto: false,
  origem: "vi",
  detalhe: { categoria: "sono", tipo: "cochilo" },
  lancadoEm: "2026-10-13T15:05:00.000Z",
  atualizadoEm: "2026-10-13T15:05:00.000Z",
  versao: 1,
};

test("ida e volta da linha preserva o registro", () => {
  assert.deepEqual(registroDaLinha(linhaDoRegistro(r)), r);
});

test("conteúdo inválido ou divergente das colunas não entra na tela", () => {
  const l = linhaDoRegistro(r);
  assert.equal(registroDaLinha({ ...l, conteudo: "{nao é json" }), null);
  assert.equal(registroDaLinha({ ...l, conteudo: JSON.stringify({ foo: 1 }) }), null);
  assert.equal(registroDaLinha({ ...l, pessoa_id: "outra" }), null);
  assert.equal(registroDaLinha({ ...l, categoria: "alimentacao" }), null);
});

test("revisão e dia anotado são convertidos", () => {
  const { id: _i, lancadoEm: _l, atualizadoEm: _a, versao: _v, ...entrada } = r;
  const rev = revisaoDaLinha({ registro_id: "r1", versao: 1, conteudo_anterior: JSON.stringify(entrada), alterado_em: "x" });
  assert.equal(rev?.conteudoAnterior.detalhe.categoria, "sono");
  assert.equal(revisaoDaLinha({ registro_id: "r1", versao: 1, conteudo_anterior: "{}", alterado_em: "x" }), null);
  assert.deepEqual(
    diaAnotadoDaLinha({ pessoa_id: "p1", dia: "2026-10-13", sem_crises: 1, observacao: null, lancado_em: "x" }),
    { pessoaId: "p1", dia: "2026-10-13", semCrises: true, lancadoEm: "x" },
  );
});
