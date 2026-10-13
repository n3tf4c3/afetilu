import { CATEGORIAS, type Categoria, type Local } from "@eloazul/core";

// Cenários da tela inicial: o lugar onde a pessoa está. Cada um mostra só as ações mais
// prováveis daquele momento, em pílulas nos cantos superiores; "Todas" leva às demais.

export type Acao = Categoria | "sem_crises" | "todas";

export interface Cenario {
  local: Local;
  esquerda: readonly Acao[];
  direita: readonly Acao[];
}

/** Ordem de deslize na tela inicial. */
export const CENARIOS: readonly Cenario[] = [
  {
    local: "casa",
    esquerda: ["alimentacao", "sono", "higiene", "evacuacao"],
    direita: ["dor_desconforto", "comportamento", "positivo", "sem_crises"],
  },
  {
    local: "escola",
    esquerda: ["alimentacao", "comportamento", "positivo"],
    direita: ["dor_desconforto", "evacuacao", "todas"],
  },
  {
    local: "parque",
    esquerda: ["positivo", "comportamento", "alimentacao"],
    direita: ["dor_desconforto", "todas"],
  },
  {
    local: "terapia",
    esquerda: ["comportamento", "positivo"],
    direita: ["dor_desconforto", "todas"],
  },
];

/** Máximo de pílulas por lado, para não encher a tela. */
export const MAXIMO_POR_LADO = 4;

/** Categorias que o cenário mostra diretamente (as demais ficam em "Todas"). */
export function categoriasVisiveis(c: Cenario): Categoria[] {
  return [...c.esquerda, ...c.direita].filter((a): a is Categoria => (CATEGORIAS as readonly string[]).includes(a));
}

export function cenarioDoLocal(local: Local): Cenario {
  return CENARIOS.find((c) => c.local === local) ?? CENARIOS[0]!;
}
