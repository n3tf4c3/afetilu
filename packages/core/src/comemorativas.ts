// Datas comemorativas do mascote: um acessório embutido no app aparece numa janela curta do ano.
// Calculadas no próprio aparelho, sem rede. Decorativo: nunca recompensa, nunca obrigatório (cada
// data pode ser desligada em Ajustes) e nunca carrega informação sobre os registros.

export const DATAS_COMEMORATIVAS = ["autismo", "orgulho", "bruxas", "natal"] as const;
export type DataComemorativa = (typeof DATAS_COMEMORATIVAS)[number];

/** Mês e dia (1–12, 1–31), inclusive nas duas pontas. Nenhuma janela cruza a virada do ano. */
export const JANELAS_COMEMORATIVAS: Record<DataComemorativa, { inicio: readonly [number, number]; fim: readonly [number, number] }> = {
  // Dia Mundial de Conscientização do Autismo: símbolo do infinito em arco-íris (nunca o quebra-cabeça).
  autismo: { inicio: [4, 2], fim: [4, 2] },
  // Dia do Orgulho Autista, criado pela própria comunidade: infinito dourado.
  orgulho: { inicio: [6, 18], fim: [6, 18] },
  // Dia das Bruxas: chapéu de bruxa, nada assustador.
  bruxas: { inicio: [10, 29], fim: [10, 31] },
  natal: { inicio: [12, 20], fim: [12, 26] },
};

const chave = (mes: number, dia: number) => mes * 100 + dia;

/**
 * Data comemorativa em vigor no dia ("AAAA-MM-DD", no fuso do aparelho), ignorando as desligadas.
 * As janelas não se sobrepõem; sem data em vigor, devolve null.
 */
export function dataComemorativaDoDia(dia: string, desligadas: readonly DataComemorativa[] = []): DataComemorativa | null {
  const [, mes, d] = dia.split("-").map(Number);
  if (!mes || !d) return null;
  const hoje = chave(mes, d);
  for (const data of DATAS_COMEMORATIVAS) {
    const { inicio, fim } = JANELAS_COMEMORATIVAS[data];
    if (hoje >= chave(...inicio) && hoje <= chave(...fim) && !desligadas.includes(data)) return data;
  }
  return null;
}

/** Lista guardada nas preferências ("bruxas,natal"); valores desconhecidos são ignorados. */
export function comemorativasDesligadas(valor: string | null): DataComemorativa[] {
  if (!valor) return [];
  const partes = valor.split(",").map((p) => p.trim());
  return DATAS_COMEMORATIVAS.filter((d) => partes.includes(d));
}
