// Reações do mascote (docs/experiencia-avatar.md, seção 3.2). Lógica pura, sem dependência nativa.

export type Reacao = "neutro" | "alimentacao" | "enjoo" | "desconforto" | "sono" | "banho" | "positivo" | "episodio" | "cutucada";

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
  // Toque no slime (não vem de registro): amassa e volta.
  cutucada: "cutucada",
};

/**
 * Cor do corpo escolhida pela pessoa (Ajustes › Aparência). Nenhuma é verde, pêssego, laranja ou
 * amarela: são as cores das reações de enjoo e dor, que precisam continuar perceptíveis.
 */
export const CORES_SLIME = ["azul", "rosa", "lilas", "turquesa"] as const;
export type CorSlime = (typeof CORES_SLIME)[number];

/** Repouso e tom mais claro (banho, momentos positivos) de cada cor, em sRGB. */
export const PALETA_SLIME: Record<CorSlime, { neutro: string; claro: string }> = {
  azul: { neutro: "#79AEE0", claro: "#8CC2F0" },
  rosa: { neutro: "#EE9DBB", claro: "#F5B6CD" },
  lilas: { neutro: "#B3A3E6", claro: "#C6BAF0" },
  turquesa: { neutro: "#6FC9C6", claro: "#8ADAD6" },
};

/** Cores de reação que não dependem da cor escolhida. */
export const COR_FIXA: Partial<Record<Reacao, string>> = { enjoo: "#9ACF94", desconforto: "#F2BE9C" };

/** Cor passageira de cada reação (sRGB). Episódio, alimentação, sono e toque não mudam a cor. */
export function corBaseDaReacao(reacao: Reacao, cor: CorSlime = "azul"): string {
  const fixa = COR_FIXA[reacao];
  if (fixa) return fixa;
  return reacao === "banho" || reacao === "positivo" ? PALETA_SLIME[cor].claro : PALETA_SLIME[cor].neutro;
}

/** Cores com o slime azul (padrão). */
export const COR_DA_REACAO = Object.fromEntries(
  (Object.keys(CLIPE_DA_REACAO) as Reacao[]).map((r) => [r, corBaseDaReacao(r)]),
) as Record<Reacao, string>;

/** Quanto a suspeita clareia a cor do tipo (mistura com branco, em sRGB). */
export const CLAREAMENTO_SUSPEITA = 0.35;

/**
 * Cor da reação na cor de slime escolhida. Suspeita do responsável: a mesma cor do tipo, em tom
 * mais claro (docs/experiencia-avatar.md, 3.2). Episódio e toque nunca mudam a cor.
 */
export function corDaReacao(reacao: Reacao, suspeita = false, cor: CorSlime = "azul"): string {
  const base = corBaseDaReacao(reacao, cor);
  if (!suspeita || reacao === "episodio" || reacao === "cutucada" || reacao === "neutro") return base;
  const h = base.replace("#", "");
  const canal = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16);
    return Math.round(c + (255 - c) * CLAREAMENTO_SUSPEITA)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${canal(0)}${canal(2)}${canal(4)}`.toUpperCase();
}

export type Som = "nham" | "ronco" | "bolhas" | "blop" | "boing";

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
  cutucada: "boing",
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
