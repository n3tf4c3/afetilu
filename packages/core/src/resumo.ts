import { calcularCobertura, ehEpisodio, type Cobertura } from "./cobertura";
import { diasDoPeriodo } from "./datas";
import {
  CATEGORIAS,
  INTENSIDADES,
  ORIGENS,
  type Categoria,
  type DiaAnotado,
  type Intensidade,
  type MudancaRotina,
  type Origem,
  type PerguntaConsulta,
  type Registro,
} from "./tipos";

/** "O que ajudou" anotado nos episódios: contagem literal, nunca ranking de eficácia. */
export interface AjudouAnotado {
  texto: string;
  /** Em quantos episódios foi anotado. */
  episodios: number;
}

/** Números e listas do resumo para consulta (docs/viabilidade-e-escopo.md, 3.2). Só descreve o registrado. */
export interface Resumo {
  inicio: string;
  fim: string;
  totalDias: number;
  categorias: Categoria[];
  /** Calculada com todos os registros do período: filtrar categorias não esvazia dias. */
  cobertura: Cobertura;
  /** Registros por categoria incluída, no período. */
  porCategoria: Record<Categoria, number>;
  /** Episódios, em ordem cronológica (vazio se "comportamento" não foi incluído). */
  episodios: Registro[];
  intensidades: Record<Intensidade | "nao_informada", number>;
  ajudou: AjudouAnotado[];
  /** Episódios com pelo menos um "o que ajudou" anotado. */
  episodiosComAjudou: number;
  positivos: Registro[];
  /** Os demais registros das categorias incluídas (fora episódios e positivos), em ordem cronológica. */
  demais: Registro[];
  origens: Record<Origem, number>;
  corrigidos: number;
  /** Mudanças na rotina do período, em ordem cronológica. Independem das categorias escolhidas. */
  mudancas: MudancaRotina[];
  /** Perguntas para a consulta, na ordem em que foram anotadas. */
  perguntas: PerguntaConsulta[];
  /** Nenhum registro das categorias escolhidas e nenhum dia marcado sem crises. */
  vazio: boolean;
}

const cronologico = (a: Registro, b: Registro) => a.ocorreuEm.localeCompare(b.ocorreuEm) || a.lancadoEm.localeCompare(b.lancadoEm);

export function montarResumo(args: {
  inicio: string;
  fim: string;
  categorias: readonly Categoria[];
  registros: readonly Registro[];
  diasAnotados: readonly DiaAnotado[];
  mudancas?: readonly MudancaRotina[];
  perguntas?: readonly PerguntaConsulta[];
}): Resumo {
  const noPeriodo = args.registros.filter((r) => r.ocorreuDia >= args.inicio && r.ocorreuDia <= args.fim);
  const anotados = args.diasAnotados.filter((d) => d.dia >= args.inicio && d.dia <= args.fim);
  const categorias = CATEGORIAS.filter((c) => args.categorias.includes(c));
  const incluidos = noPeriodo.filter((r) => categorias.includes(r.detalhe.categoria)).sort(cronologico);

  const porCategoria = Object.fromEntries(CATEGORIAS.map((c) => [c, 0])) as Record<Categoria, number>;
  const origens = Object.fromEntries(ORIGENS.map((o) => [o, 0])) as Record<Origem, number>;
  for (const r of incluidos) {
    porCategoria[r.detalhe.categoria] += 1;
    origens[r.origem] += 1;
  }

  const episodios = incluidos.filter(ehEpisodio);
  const intensidades = Object.fromEntries([...INTENSIDADES, "nao_informada"].map((i) => [i, 0])) as Resumo["intensidades"];
  const ajudouMapa = new Map<string, AjudouAnotado>();
  let episodiosComAjudou = 0;
  for (const r of episodios) {
    const ep = r.detalhe.categoria === "comportamento" ? r.detalhe.episodio : undefined;
    intensidades[ep?.intensidade ?? "nao_informada"] += 1;
    // Mesmo texto anotado duas vezes no mesmo episódio conta uma vez; a comparação ignora caixa e espaços.
    const vistos = new Set<string>();
    for (const bruto of ep?.ajudou ?? []) {
      const texto = bruto.trim().replace(/\s+/g, " ");
      const chave = texto.toLocaleLowerCase();
      if (!texto || vistos.has(chave)) continue;
      vistos.add(chave);
      const atual = ajudouMapa.get(chave) ?? { texto, episodios: 0 };
      atual.episodios += 1;
      ajudouMapa.set(chave, atual);
    }
    if (vistos.size > 0) episodiosComAjudou += 1;
  }

  const positivos = incluidos.filter((r) => r.detalhe.categoria === "positivo");
  const demais = incluidos.filter((r) => !ehEpisodio(r) && r.detalhe.categoria !== "positivo");

  return {
    inicio: args.inicio,
    fim: args.fim,
    totalDias: diasDoPeriodo(args.inicio, args.fim).length,
    categorias,
    cobertura: calcularCobertura({ inicio: args.inicio, fim: args.fim, registros: noPeriodo, diasAnotados: anotados }),
    porCategoria,
    episodios,
    intensidades,
    // Ordem alfabética de propósito: ordenar por contagem sugeriria "o que funciona melhor".
    ajudou: [...ajudouMapa.values()].sort((a, b) => a.texto.localeCompare(b.texto)),
    episodiosComAjudou,
    positivos,
    demais,
    origens,
    corrigidos: incluidos.filter((r) => r.versao > 1).length,
    mudancas: (args.mudancas ?? [])
      .filter((m) => m.dia >= args.inicio && m.dia <= args.fim)
      .sort((a, b) => a.dia.localeCompare(b.dia) || a.lancadoEm.localeCompare(b.lancadoEm)),
    perguntas: [...(args.perguntas ?? [])].sort((a, b) => a.criadaEm.localeCompare(b.criadaEm)),
    vazio: incluidos.length === 0 && !anotados.some((d) => d.semCrises),
  };
}
