import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ALFA_CORPO, CLIPE_DA_REACAO, COR_DA_REACAO, corLinear, SOM_DA_REACAO } from "./reacoes";

// Contrato entre o app e o slime.glb versionado (gerado por ferramentas/slime/gerar_slime.py).

function lerGlb() {
  const buf = readFileSync(join(__dirname, "../../../assets/slime/slime.glb"));
  assert.equal(buf.toString("ascii", 0, 4), "glTF");
  const tamanho = buf.readUInt32LE(12);
  return JSON.parse(buf.toString("utf8", 20, 20 + tamanho)) as {
    animations: { name: string }[];
    nodes: { name: string }[];
    materials: { name: string; alphaMode?: string; pbrMetallicRoughness?: { baseColorFactor?: number[] } }[];
  };
}

test("todo clipe usado pelas reações existe no modelo", () => {
  const nomes = new Set(lerGlb().animations.map((a) => a.name));
  for (const clipe of Object.values(CLIPE_DA_REACAO)) if (clipe) assert.ok(nomes.has(clipe), `clipe ausente: ${clipe}`);
  assert.ok(nomes.has("respirar") && nomes.has("neutro"));
});

test("episódio difícil não anima nem muda a cor do slime", () => {
  assert.equal(CLIPE_DA_REACAO.episodio, null);
  assert.equal(COR_DA_REACAO.episodio, COR_DA_REACAO.neutro);
});

test("sem som em episódio, enjoo e dor; todo som usado existe em assets/sons", () => {
  assert.equal(SOM_DA_REACAO.episodio, null);
  assert.equal(SOM_DA_REACAO.enjoo, null);
  assert.equal(SOM_DA_REACAO.desconforto, null);
  assert.equal(SOM_DA_REACAO.neutro, null);
  for (const som of Object.values(SOM_DA_REACAO)) {
    if (!som) continue;
    const wav = readFileSync(join(__dirname, `../../../assets/sons/${som}.wav`));
    assert.equal(wav.toString("ascii", 0, 4), "RIFF");
    const segundos = wav.readUInt32LE(40) / wav.readUInt32LE(28);
    assert.ok(segundos < 1, `${som} dura ${segundos} s`);
  }
});

test("alfa do corpo é o mesmo no modelo e no app", () => {
  const corpo = lerGlb().materials.find((m) => m.name === "corpo");
  assert.equal(corpo?.alphaMode, "BLEND");
  assert.ok(Math.abs((corpo?.pbrMetallicRoughness?.baseColorFactor?.[3] ?? 0) - ALFA_CORPO) < 1e-3);
  assert.ok(lerGlb().nodes.some((n) => n.name === "corpo"));
});

test("conversão de cor para o espaço linear do material", () => {
  assert.deepEqual(corLinear("#FFFFFF"), [1, 1, 1, 1]);
  assert.deepEqual(corLinear("#000000", 0.5), [0, 0, 0, 0.5]);
  const [r] = corLinear("#808080");
  assert.ok(Math.abs(r - 0.2158605) < 1e-6);
});
