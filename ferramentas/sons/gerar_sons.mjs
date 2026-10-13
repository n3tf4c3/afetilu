// Gera os sons do slime por síntese (sem gravações nem bancos de terceiros): sons próprios, sem licença a declarar.
// Uso: node ferramentas/sons/gerar_sons.mjs <pasta de saída>
// Regras (docs/experiencia-avatar.md, seção 5): curtos (< 1 s), suaves, sem ataque brusco.
// Tons acima de ~400 Hz: o alto-falante do celular quase não reproduz graves (um "nham" em 200–260 Hz
// ficou inaudível no Galaxy A52s).
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const TAXA = 22050;
/** Pico de cada arquivo (~ -12 dBFS): o volume baixo já vem no próprio som. */
const PICO = 0.25;

/** Gerador pseudoaleatório com semente: o mesmo comando gera os mesmos arquivos. */
function aleatorio(semente) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const amostras = (seg) => new Float32Array(Math.round(seg * TAXA));

/** Envelope com subida e descida em cosseno (sem estalo). */
function envelope(t, dur, subida, descida) {
  if (t < 0 || t > dur) return 0;
  if (t < subida) return 0.5 - 0.5 * Math.cos((Math.PI * t) / subida);
  if (t > dur - descida) return 0.5 - 0.5 * Math.cos((Math.PI * (dur - t)) / descida);
  return 1;
}

/** Soma um tom com frequência variável (fase integrada) e harmônicos opcionais. */
function tom(buf, { inicio, dur, freq, subida = 0.01, descida = 0.05, ganho = 1, harmonicos = [1] }) {
  let fase = 0;
  const i0 = Math.round(inicio * TAXA);
  for (let i = 0; i < Math.round(dur * TAXA) && i0 + i < buf.length; i++) {
    const t = i / TAXA;
    fase += (2 * Math.PI * freq(t / dur)) / TAXA;
    let v = 0;
    harmonicos.forEach((a, h) => (v += a * Math.sin((h + 1) * fase)));
    buf[i0 + i] += ganho * envelope(t, dur, subida, descida) * v;
  }
}

const deslize = (de, para) => (x) => de * (para / de) ** x;

const SONS = {
  // "Blop" alegre (calma e momentos positivos): bolha que sobe, e um eco menor.
  blop() {
    const b = amostras(0.32);
    tom(b, { inicio: 0, dur: 0.12, freq: deslize(520, 1100), subida: 0.004, descida: 0.08, harmonicos: [1, 0.3] });
    tom(b, { inicio: 0.13, dur: 0.1, freq: deslize(650, 1300), subida: 0.004, descida: 0.07, ganho: 0.35, harmonicos: [1, 0.3] });
    return b;
  },
  // "Nham" curto (alimentação): tom arredondado que cai um pouco, como uma mordida.
  nham() {
    const b = amostras(0.34);
    tom(b, { inicio: 0, dur: 0.3, freq: deslize(520, 400), subida: 0.03, descida: 0.15, harmonicos: [1, 0.6, 0.35, 0.2] });
    return b;
  },
  // Bolhas (banho): estalinhos agudos e curtos em momentos sorteados.
  bolhas() {
    const b = amostras(0.7);
    const r = aleatorio(7);
    for (let k = 0; k < 6; k++) {
      const base = 700 + r() * 500;
      tom(b, { inicio: 0.03 + k * 0.1 + r() * 0.04, dur: 0.05, freq: deslize(base, base * 1.9), subida: 0.003, descida: 0.035, ganho: 0.5 + r() * 0.5 });
    }
    return b;
  },
  // Ronco muito suave (sono): sopro grave que sobe e desce devagar.
  ronco() {
    const b = amostras(0.9);
    const r = aleatorio(3);
    let filtrado = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / TAXA;
      filtrado += 0.04 * (r() * 2 - 1 - filtrado); // ruído passa-baixa (sopro)
      const zumbido = 0.25 * Math.sin(2 * Math.PI * 85 * t);
      b[i] = envelope(t, 0.9, 0.35, 0.45) * (filtrado * 6 + zumbido);
    }
    return b;
  },
};

function normalizar(buf) {
  let pico = 0;
  for (const v of buf) pico = Math.max(pico, Math.abs(v));
  return buf.map((v) => (v / pico) * PICO);
}

function wav(buf) {
  const dados = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => dados.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const cab = Buffer.alloc(44);
  cab.write("RIFF", 0);
  cab.writeUInt32LE(36 + dados.length, 4);
  cab.write("WAVEfmt ", 8);
  cab.writeUInt32LE(16, 16);
  cab.writeUInt16LE(1, 20); // PCM
  cab.writeUInt16LE(1, 22); // mono
  cab.writeUInt32LE(TAXA, 24);
  cab.writeUInt32LE(TAXA * 2, 28);
  cab.writeUInt16LE(2, 32);
  cab.writeUInt16LE(16, 34);
  cab.write("data", 36);
  cab.writeUInt32LE(dados.length, 40);
  return Buffer.concat([cab, dados]);
}

const pasta = process.argv[2];
if (!pasta) {
  process.stderr.write("uso: node gerar_sons.mjs <pasta de saída>\n");
  process.exit(1);
}
mkdirSync(resolve(pasta), { recursive: true });
for (const [nome, gerar] of Object.entries(SONS)) {
  const buf = normalizar(gerar());
  writeFileSync(join(resolve(pasta), `${nome}.wav`), wav(buf));
  process.stdout.write(`${nome}.wav  ${(buf.length / TAXA).toFixed(2)} s\n`);
}
