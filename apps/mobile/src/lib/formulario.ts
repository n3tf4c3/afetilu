import {
  entradaRegistro,
  quandoNoFuturo,
  resolverQuando,
  type Categoria,
  type EntradaRegistro,
  type EscolhaDeQuando,
  type Local,
  type Origem,
  type Registro,
} from "@afetilu/core";

/** Detalhe ainda em edição: os campos só são exigidos na hora de salvar. */
export type Rascunho = { categoria: Categoria } & Record<string, unknown>;

export type Termino = "nao_informado" | "em_aberto" | "horario";

export interface Formulario {
  quando: EscolhaDeQuando;
  origem: Origem;
  origemQuem: string;
  observacao: string;
  termino: Termino;
  terminoEm: Date;
  /** Onde a pessoa estava; vem do cenário da tela inicial e pode ser removido. */
  local?: Local;
  rascunho: Rascunho;
}

/** Categorias em que faz sentido registrar término ou deixar em aberto. */
export const TEM_TERMINO: ReadonlySet<Categoria> = new Set(["sono", "dor_desconforto"]);

export function rascunhoInicial(categoria: Categoria): Rascunho {
  switch (categoria) {
    case "alimentacao":
      return { categoria, tipo: "comida", item: "" };
    case "comportamento":
      return { categoria, observado: [], ehEpisodio: false };
    case "sono":
      return { categoria, tipo: "noturno" };
    default:
      return { categoria };
  }
}

export function formularioNovo(categoria: Categoria, agora: Date, local?: Local): Formulario {
  return {
    local,
    quando: { tipo: "agora" },
    origem: "vi",
    origemQuem: "",
    observacao: "",
    termino: "nao_informado",
    terminoEm: agora,
    rascunho: rascunhoInicial(categoria),
  };
}

export function formularioDoRegistro(r: Registro, agora: Date): Formulario {
  const quando: EscolhaDeQuando =
    r.precisao === "periodo_do_dia" && r.periodoDoDia
      ? { tipo: "periodo", dia: r.ocorreuDia, periodo: r.periodoDoDia }
      : r.precisao === "so_data"
        ? { tipo: "so_data", dia: r.ocorreuDia }
        : { tipo: "data_hora", data: new Date(r.ocorreuEm), aproximado: r.precisao === "aproximado" };
  return {
    quando,
    origem: r.origem,
    origemQuem: r.origemQuem ?? "",
    observacao: r.observacao ?? "",
    termino: r.emAberto ? "em_aberto" : r.ocorreuFim ? "horario" : "nao_informado",
    terminoEm: r.ocorreuFim ? new Date(r.ocorreuFim) : agora,
    local: r.local,
    rascunho: { ...r.detalhe } as Rascunho,
  };
}

/** Remove textos vazios e chaves indefinidas, inclusive dentro do episódio. */
function limpar(valor: Record<string, unknown>): Record<string, unknown> {
  const saida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(valor)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      if (v.trim()) saida[k] = v.trim();
      continue;
    }
    if (typeof v === "object" && !Array.isArray(v)) {
      const interno = limpar(v as Record<string, unknown>);
      if (Object.keys(interno).length) saida[k] = interno;
      continue;
    }
    saida[k] = v;
  }
  return saida;
}

/** Erros que a tela traduz. */
export type ErroFormulario = "item" | "tipo" | "observado" | "fim" | "periodo" | "futuro" | "generico";

const ERRO_POR_CAMPO: Record<string, ErroFormulario> = {
  "detalhe.item": "item",
  "detalhe.tipo": "tipo",
  "detalhe.observado": "observado",
  ocorreuFim: "fim",
  periodoDoDia: "periodo",
};

export type ResultadoFormulario = { ok: true; entrada: EntradaRegistro } | { ok: false; erro: ErroFormulario };

export function montarEntrada(f: Formulario, pessoaId: string, agora: Date): ResultadoFormulario {
  const q = resolverQuando(f.quando, agora);
  if (quandoNoFuturo(q, agora)) return { ok: false, erro: "futuro" };

  const categoria = f.rascunho.categoria;
  const comTermino = TEM_TERMINO.has(categoria);
  const detalhe = limpar(f.rascunho);
  // Detalhes de episódio só existem quando o comportamento foi marcado como episódio.
  if (categoria === "comportamento" && detalhe.ehEpisodio !== true) delete detalhe.episodio;

  const bruto = limpar({
    pessoaId,
    ...q,
    ocorreuFim: comTermino && f.termino === "horario" ? f.terminoEm.toISOString() : undefined,
    origem: f.origem,
    origemQuem: f.origem === "me_contaram" ? f.origemQuem : undefined,
    observacao: f.observacao,
    local: f.local,
  });
  const r = entradaRegistro.safeParse({ ...bruto, emAberto: comTermino && f.termino === "em_aberto", detalhe });
  if (r.success) return { ok: true, entrada: r.data };
  const caminho = r.error.issues[0]?.path.join(".") ?? "";
  return { ok: false, erro: ERRO_POR_CAMPO[caminho] ?? "generico" };
}
