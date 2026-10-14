import { z } from "zod";

// Limites compartilhados entre validação, banco e telas: declarados só aqui.
export const LIMITES = {
  apelido: 30,
  textoCurto: 80,
  observacao: 1000,
  itensAjudou: 10,
  duracaoMaxMin: 24 * 60,
} as const;

export const CATEGORIAS = [
  "alimentacao",
  "dor_desconforto",
  "comportamento",
  "higiene",
  "sono",
  "evacuacao",
  "positivo",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Origem da informação: o que o responsável viu, o que contaram e o que é suspeita dele. */
export const ORIGENS = ["vi", "me_contaram", "suspeita"] as const;
export type Origem = (typeof ORIGENS)[number];

/** Precisão do horário informado, para registros retroativos honestos. */
export const PRECISOES = ["exato", "aproximado", "periodo_do_dia", "so_data"] as const;
export type Precisao = (typeof PRECISOES)[number];

export const PERIODOS_DO_DIA = ["madrugada", "manha", "tarde", "noite"] as const;
export type PeriodoDoDia = (typeof PERIODOS_DO_DIA)[number];

export const INTENSIDADES = ["leve", "moderada", "intensa", "nao_sei"] as const;
export type Intensidade = (typeof INTENSIDADES)[number];

export const TIPOS_DESCONFORTO = ["dor", "enjoo", "coceira", "tontura", "outro"] as const;
export const REGIOES = [
  "cabeca",
  "boca_dentes",
  "ouvido",
  "garganta",
  "peito",
  "barriga",
  "costas",
  "bracos",
  "pernas",
  "pele",
  "outra",
  "nao_sei",
] as const;
export const OBSERVADOS = [
  "calmo",
  "choro",
  "irritacao",
  "agitacao",
  "isolamento",
  "agressividade",
  "autoagressao",
  "outro",
] as const;
export const TIPOS_HIGIENE = ["banho", "escovacao", "troca", "outro"] as const;
export const TIPOS_POSITIVO = ["comunicacao", "atividade", "conquista", "tranquilo", "estrategia"] as const;
export const QUANTIDADES = ["pouco", "metade", "tudo", "recusou"] as const;

/** Onde a pessoa estava (cenário da tela inicial). Informação literal, opcional; nunca uma causa. */
export const LOCAIS = ["casa", "escola", "parque", "terapia"] as const;
export type Local = (typeof LOCAIS)[number];

const textoCurto = z.string().trim().min(1).max(LIMITES.textoCurto);
export const textoLivre = z.string().trim().max(LIMITES.observacao);
export const instante = z.iso.datetime({ offset: true });
export const dia = z.iso.date();

export const detalheAlimentacao = z.object({
  categoria: z.literal("alimentacao"),
  tipo: z.enum(["comida", "bebida"]),
  item: textoCurto,
  quantidade: z.enum(QUANTIDADES).optional(),
  comoFicouDepois: textoLivre.optional(),
});

export const detalheDorDesconforto = z.object({
  categoria: z.literal("dor_desconforto"),
  tipo: z.enum(TIPOS_DESCONFORTO),
  regiao: z.enum(REGIOES).optional(),
  intensidade: z.enum(INTENSIDADES).optional(),
  sinais: textoLivre.optional(),
});

export const detalheEpisodio = z.object({
  duracaoMin: z.number().int().min(0).max(LIMITES.duracaoMaxMin).optional(),
  intensidade: z.enum(INTENSIDADES).optional(),
  contextoAntes: textoLivre.optional(),
  medidas: textoLivre.optional(),
  desfecho: textoLivre.optional(),
  lesao: z.enum(["sim", "nao", "nao_sei"]).optional(),
  ajudou: z.array(textoCurto).max(LIMITES.itensAjudou).optional(),
});

export const detalheComportamento = z.object({
  categoria: z.literal("comportamento"),
  observado: z.array(z.enum(OBSERVADOS)).min(1),
  ehEpisodio: z.boolean(),
  episodio: detalheEpisodio.optional(),
});

export const detalheHigiene = z.object({
  categoria: z.literal("higiene"),
  tipo: z.enum(TIPOS_HIGIENE),
  aceitacao: z.enum(["aceitou", "com_ajuda", "recusou"]).optional(),
});

export const detalheSono = z.object({
  categoria: z.literal("sono"),
  tipo: z.enum(["noturno", "cochilo"]),
  despertares: z.number().int().min(0).max(50).optional(),
});

export const detalheEvacuacao = z.object({
  categoria: z.literal("evacuacao"),
  aspecto: textoLivre.optional(),
});

export const detalhePositivo = z.object({
  categoria: z.literal("positivo"),
  tipo: z.enum(TIPOS_POSITIVO),
  descricao: textoLivre.optional(),
});

export const detalhe = z.discriminatedUnion("categoria", [
  detalheAlimentacao,
  detalheDorDesconforto,
  detalheComportamento,
  detalheHigiene,
  detalheSono,
  detalheEvacuacao,
  detalhePositivo,
]);
export type Detalhe = z.infer<typeof detalhe>;
export type DetalheDe<C extends Categoria> = Extract<Detalhe, { categoria: C }>;

/** Campos que o responsável informa ao criar ou corrigir um registro. */
export const entradaRegistro = z
  .object({
    pessoaId: z.string().min(1),
    ocorreuEm: instante,
    ocorreuDia: dia,
    precisao: z.enum(PRECISOES),
    periodoDoDia: z.enum(PERIODOS_DO_DIA).optional(),
    ocorreuFim: instante.optional(),
    emAberto: z.boolean(),
    origem: z.enum(ORIGENS),
    origemQuem: textoCurto.optional(),
    local: z.enum(LOCAIS).optional(),
    observacao: textoLivre.optional(),
    detalhe,
  })
  .superRefine((r, ctx) => {
    if (r.precisao === "periodo_do_dia" && !r.periodoDoDia) {
      ctx.addIssue({ code: "custom", path: ["periodoDoDia"], message: "Informe o período do dia." });
    }
    if (r.ocorreuFim && Date.parse(r.ocorreuFim) < Date.parse(r.ocorreuEm)) {
      ctx.addIssue({ code: "custom", path: ["ocorreuFim"], message: "O término não pode ser antes do início." });
    }
    if (r.ocorreuFim && r.emAberto) {
      ctx.addIssue({ code: "custom", path: ["emAberto"], message: "Um registro com término não fica em aberto." });
    }
    if (r.detalhe.categoria === "comportamento" && !r.detalhe.ehEpisodio && r.detalhe.episodio) {
      ctx.addIssue({ code: "custom", path: ["detalhe", "episodio"], message: "Detalhes de episódio exigem marcar como episódio." });
    }
  });
export type EntradaRegistro = z.infer<typeof entradaRegistro>;

export interface Registro extends EntradaRegistro {
  id: string;
  /** Quando o responsável lançou. Nunca muda depois da criação. */
  lancadoEm: string;
  atualizadoEm: string;
  versao: number;
}

export interface RevisaoRegistro {
  registroId: string;
  /** Versão que foi substituída. */
  versao: number;
  conteudoAnterior: EntradaRegistro;
  alteradoEm: string;
}

export const entradaPessoa = z.object({
  apelido: z.string().trim().min(1).max(LIMITES.apelido),
});
export type EntradaPessoa = z.infer<typeof entradaPessoa>;

export interface Pessoa extends EntradaPessoa {
  id: string;
  criadaEm: string;
}

/** Marcação explícita feita pelo responsável. A ausência dela nunca significa "sem crises". */
export interface DiaAnotado {
  pessoaId: string;
  dia: string;
  semCrises: boolean;
  observacao?: string;
  lancadoEm: string;
}
