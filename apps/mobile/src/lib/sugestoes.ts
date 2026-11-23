import type { Registro } from "@afetilu/core";

function chaveNormalizada(texto: string): string {
  return texto
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Alimentos ou bebidas já registrados recentemente, ordenados pelos mais usados (e em caso de
 * empate, pelos mais recentes). Mantém a grafia do uso mais recente.
 */
export function sugestoesDeAlimentos(
  registros: readonly Registro[],
  tipo: "comida" | "bebida",
  limite = 10,
): string[] {
  const contagem = new Map<string, { texto: string; vezes: number; recente: number }>();
  for (const r of registros) {
    if (r.detalhe.categoria !== "alimentacao" || r.detalhe.tipo !== tipo) continue;
    const limpo = r.detalhe.item.trim();
    if (!limpo) continue;
    const chave = chaveNormalizada(limpo);
    const momento = Date.parse(r.ocorreuEm) || 0;
    const atual = contagem.get(chave);
    if (!atual) {
      contagem.set(chave, { texto: limpo, vezes: 1, recente: momento });
    } else {
      atual.vezes += 1;
      if (momento >= atual.recente) {
        atual.texto = limpo;
        atual.recente = momento;
      }
    }
  }
  return [...contagem.values()]
    .sort((a, b) => b.vezes - a.vezes || b.recente - a.recente)
    .slice(0, limite)
    .map((x) => x.texto);
}

/** Estratégias já anotadas em "o que ajudou" nos episódios recentes, sem duplicatas. */
export function sugestoesDeAjudou(registros: readonly Registro[], limite = 12): string[] {
  const vistos = new Map<string, string>();
  for (const r of registros) {
    if (r.detalhe.categoria !== "comportamento") continue;
    for (const s of r.detalhe.episodio?.ajudou ?? []) {
      const limpo = s.trim();
      if (!limpo) continue;
      const chave = chaveNormalizada(limpo);
      if (!vistos.has(chave)) vistos.set(chave, limpo);
    }
  }
  return [...vistos.values()].slice(0, limite);
}
