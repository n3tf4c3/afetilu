import assert from "node:assert/strict";
import { test } from "node:test";
import { comemorativasDesligadas, DATAS_COMEMORATIVAS, dataComemorativaDoDia, JANELAS_COMEMORATIVAS } from "./comemorativas";

test("cada data vale só dentro da própria janela, nas duas pontas", () => {
  assert.equal(dataComemorativaDoDia("2027-04-01"), null);
  assert.equal(dataComemorativaDoDia("2027-04-02"), "autismo");
  assert.equal(dataComemorativaDoDia("2027-04-03"), null);
  assert.equal(dataComemorativaDoDia("2027-06-18"), "orgulho");
  assert.equal(dataComemorativaDoDia("2026-10-28"), null);
  assert.equal(dataComemorativaDoDia("2026-10-29"), "bruxas");
  assert.equal(dataComemorativaDoDia("2026-10-31"), "bruxas");
  assert.equal(dataComemorativaDoDia("2026-11-01"), null);
  assert.equal(dataComemorativaDoDia("2026-12-19"), null);
  assert.equal(dataComemorativaDoDia("2026-12-20"), "natal");
  assert.equal(dataComemorativaDoDia("2026-12-26"), "natal");
  assert.equal(dataComemorativaDoDia("2026-12-27"), null);
});

test("vale todo ano, inclusive em ano bissexto", () => {
  assert.equal(dataComemorativaDoDia("2028-04-02"), "autismo");
  assert.equal(dataComemorativaDoDia("2028-02-29"), null);
});

test("data desligada não aparece; as outras continuam", () => {
  assert.equal(dataComemorativaDoDia("2026-12-24", ["natal"]), null);
  assert.equal(dataComemorativaDoDia("2026-10-31", ["natal"]), "bruxas");
});

test("janelas não se sobrepõem e não cruzam a virada do ano", () => {
  const dias: string[] = [];
  for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) dias.push(`2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  for (const dia of dias) {
    const [, mes, d] = dia.split("-").map(Number);
    const emVigor = DATAS_COMEMORATIVAS.filter((data) => {
      const { inicio, fim } = JANELAS_COMEMORATIVAS[data];
      return mes! * 100 + d! >= inicio[0] * 100 + inicio[1] && mes! * 100 + d! <= fim[0] * 100 + fim[1];
    });
    assert.ok(emVigor.length <= 1, dia);
  }
  for (const { inicio, fim } of Object.values(JANELAS_COMEMORATIVAS)) assert.ok(inicio[0] * 100 + inicio[1] <= fim[0] * 100 + fim[1]);
});

test("preferência guardada: ignora o que não reconhece", () => {
  assert.deepEqual(comemorativasDesligadas(null), []);
  assert.deepEqual(comemorativasDesligadas(""), []);
  assert.deepEqual(comemorativasDesligadas("natal, bruxas,carnaval"), ["bruxas", "natal"]);
});

test("dia malformado não quebra", () => {
  assert.equal(dataComemorativaDoDia("qualquer"), null);
});
