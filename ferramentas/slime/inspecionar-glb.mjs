// Confere a estrutura do slime.glb que o app espera. Uso: node inspecionar-glb.mjs caminho/slime.glb
// Sai com código 1 se faltar algo (pode ser usado na CI quando o arquivo existir).
import { readFileSync } from "node:fs";

const caminho = process.argv[2];
const buf = readFileSync(caminho);
if (buf.toString("ascii", 0, 4) !== "glTF") throw new Error("não é GLB");
const tamJson = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.toString("utf8", 20, 20 + tamJson));

const ESPERADO = {
  animacoes: ["neutro", "respirar", "sono", "quicar", "enjoo", "desconforto", "alimentacao", "banho"],
  deformacoes: ["achatar", "esticar", "amassar", "respirar"],
  partes: [
    "olhos_abertos", "olhos_cansados", "olhos_sono", "olhos_alegres", "sobrancelhas_preocupadas",
    "bochechas", "boca_neutra", "boca_sorriso", "boca_ondulada", "boca_preocupada", "boca_o", "maca", "bolhas_banho",
  ],
};

const falhas = [];
const nos = new Set(gltf.nodes.map((n) => n.name));
const animacoes = (gltf.animations ?? []).map((a) => a.name);
const corpo = gltf.meshes.find((m) => m.name === "corpo" || m.name?.startsWith("Sphere"));
const malhaCorpo = gltf.nodes.find((n) => n.name === "corpo");
const nomesDeformacoes = gltf.meshes[malhaCorpo?.mesh ?? -1]?.extras?.targetNames ?? [];
const matCorpo = gltf.materials.find((m) => m.name === "corpo");

for (const a of ESPERADO.animacoes) if (!animacoes.includes(a)) falhas.push(`animação ausente: ${a}`);
for (const d of ESPERADO.deformacoes) if (!nomesDeformacoes.includes(d)) falhas.push(`deformação ausente: ${d}`);
for (const p of ESPERADO.partes) if (!nos.has(p)) falhas.push(`parte ausente: ${p}`);
// O app usa transparência por alfa (o Filament do RN não implementa KHR_materials_transmission).
if (matCorpo?.alphaMode !== "BLEND") falhas.push("material do corpo sem alphaMode BLEND");
const alfa = matCorpo?.pbrMetallicRoughness?.baseColorFactor?.[3];
if (!(alfa > 0.5 && alfa < 0.95)) falhas.push(`alfa do corpo fora da faixa (${alfa})`);
if (!nos.has("rosto")) falhas.push("nó 'rosto' ausente");

const duracoes = (gltf.animations ?? []).map((a) => {
  const maximo = Math.max(...a.samplers.map((s) => gltf.accessors[s.input].max?.[0] ?? 0));
  return `${a.name} ${maximo.toFixed(2)}s (${a.channels.length} canais)`;
});

console.log(`arquivo: ${(buf.length / 1024).toFixed(0)} KB`);
console.log(`animações: ${duracoes.join(" | ")}`);
console.log(`deformações do corpo: ${nomesDeformacoes.join(", ")}`);
console.log(`extensões: ${(gltf.extensionsUsed ?? []).join(", ")}`);
console.log(`malhas: ${gltf.meshes.length}, nós: ${gltf.nodes.length}, materiais: ${gltf.materials.map((m) => m.name).join(", ")}`);
if (corpo === undefined) falhas.push("malha do corpo não encontrada");
// Pose de repouso: só os grupos de partes (liga/desliga) podem ter escala 0; peças internas nunca.
for (const n of gltf.nodes) {
  if (!ESPERADO.partes.includes(n.name) && n.scale && n.scale.every((s) => s === 0)) falhas.push(`nó ${n.name} com escala 0 na pose de repouso`);
}
// Cada clipe precisa definir o estado inteiro (partes, rosto e deformações) para poder ser interrompido.
const canaisEsperados = ESPERADO.partes.length + 3;
for (const a of gltf.animations ?? []) {
  if (a.channels.length < canaisEsperados) falhas.push(`clipe ${a.name} com ${a.channels.length} canais (esperado ${canaisEsperados})`);
}
if (falhas.length) {
  console.error(`FALHAS:\n- ${falhas.join("\n- ")}`);
  process.exit(1);
}
console.log("OK: estrutura conforme o esperado pelo app.");
