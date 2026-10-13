import type {
  Categoria,
  Intensidade,
  Local,
  OBSERVADOS,
  Origem,
  PeriodoDoDia,
  QUANTIDADES,
  REGIOES,
  TIPOS_DESCONFORTO,
  TIPOS_HIGIENE,
  TIPOS_POSITIVO,
} from "../tipos";

export const IDIOMAS = ["pt-BR", "en", "es"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export type Genero = "m" | "f" | "n";
export interface Nome {
  nome: string;
  genero: Genero;
}
export const m = (nome: string): Nome => ({ nome, genero: "m" });
export const f = (nome: string): Nome => ({ nome, genero: "f" });
export const n = (nome: string): Nome => ({ nome, genero: "n" });

type Rotulos<T extends readonly string[]> = Record<T[number], string>;

/** Chaves do nome curto de cada tipo de registro (usado nas legendas). */
export type ChaveNome =
  | "comida" | "bebida"
  | "dor" | "enjoo" | "coceira" | "tontura" | "desconforto"
  | "episodio" | "comportamento"
  | "banho" | "escovacao" | "troca" | "higiene"
  | "sono" | "cochilo" | "evacuacao"
  | "comunicacao" | "atividade" | "conquista" | "tranquilo" | "estrategia";

/**
 * Textos do domínio em um idioma. Todos os idiomas implementam o mesmo tipo:
 * faltar uma chave é erro de compilação.
 */
export interface DicionarioDominio {
  categoria: Record<Categoria, string>;
  /** Rótulo curto para botões compactos (o nome completo continua no leitor de tela). */
  categoriaCurta: Record<Categoria, string>;
  origem: Record<Origem, string>;
  periodo: Record<PeriodoDoDia, string>;
  periodoCurto: Record<PeriodoDoDia, string>;
  desconforto: Rotulos<typeof TIPOS_DESCONFORTO>;
  regiao: Rotulos<typeof REGIOES>;
  observado: Rotulos<typeof OBSERVADOS>;
  higiene: Rotulos<typeof TIPOS_HIGIENE>;
  positivo: Rotulos<typeof TIPOS_POSITIVO>;
  quantidade: Rotulos<typeof QUANTIDADES>;
  aceitacao: Record<"aceitou" | "com_ajuda" | "recusou", string>;
  lesao: Record<"sim" | "nao" | "nao_sei", string>;
  tipoAlimento: Record<"comida" | "bebida", string>;
  tipoSono: Record<"noturno" | "cochilo", string>;
  local: Record<Local, string>;
  /** Critérios observáveis, não clínicos (rascunho a validar com profissionais). */
  intensidade: Record<Intensidade, { rotulo: string; criterio: string }>;
  nomeRegistro: Record<ChaveNome, Nome>;
  registrado: (n: Nome) => string;
  suspeitaRegistrada: (n: Nome) => string;
  paraODia: (rotuloDia: string) => string;
  hoje: string;
  ontem: string;
  hora: (d: Date) => string;
  porVoltaDe: (hora: string) => string;
  diaCurto: (dia: number, mes: number) => string;
  diaPorExtenso: (dia: number, mes: number) => string;
  duracao: (minutos: number) => string;
  ultimaRefeicao: (hora: string, distancia: string) => string;
  noMesmoHorario: string;
  antes: (duracao: string) => string;
}
