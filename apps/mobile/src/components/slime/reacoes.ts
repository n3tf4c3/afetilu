// Reações do mascote (docs/experiencia-avatar.md, seção 3.2). Lógica pura, sem dependência nativa.

export type Reacao = "neutro" | "alimentacao" | "enjoo" | "desconforto" | "sono" | "banho" | "positivo" | "episodio";

/** Clipe do slime.glb para cada reação. Episódios difíceis não animam o slime. */
export const CLIPE_DA_REACAO: Record<Reacao, string | null> = {
  neutro: "neutro",
  alimentacao: "alimentacao",
  enjoo: "enjoo",
  desconforto: "desconforto",
  sono: "sono",
  banho: "banho",
  positivo: "quicar",
  episodio: null,
};

/** Cores passageiras (sRGB). Episódio não muda a cor. */
export const COR_DA_REACAO: Record<Reacao, string> = {
  neutro: "#79AEE0",
  alimentacao: "#79AEE0",
  enjoo: "#9ACF94",
  desconforto: "#F2BE9C",
  sono: "#79AEE0",
  banho: "#8CC2F0",
  positivo: "#8CC2F0",
  episodio: "#79AEE0",
};

export type Som = "nham" | "ronco" | "bolhas" | "blop";

/**
 * Som de cada reação (assets/sons, gerados por ferramentas/sons/gerar_sons.mjs), tocado só se a pessoa ativou.
 * Sem som em enjoo, dor, episódios e evacuação (evacuação nem chega a reagir).
 */
export const SOM_DA_REACAO: Record<Reacao, Som | null> = {
  neutro: null,
  alimentacao: "nham",
  enjoo: null,
  desconforto: null,
  sono: "ronco",
  banho: "bolhas",
  positivo: "blop",
  episodio: null,
};

/** Transparência do corpo; igual a ALFA_CORPO em ferramentas/slime/gerar_slime.py. */
export const ALFA_CORPO = 0.8;

const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** "#RRGGBB" → [r, g, b, alfa] linear, como o material do glTF espera. */
export function corLinear(hex: string, alfa = 1): [number, number, number, number] {
  const h = hex.replace("#", "");
  const canal = (i: number) => linear(parseInt(h.slice(i, i + 2), 16) / 255);
  return [canal(0), canal(2), canal(4), alfa];
}
