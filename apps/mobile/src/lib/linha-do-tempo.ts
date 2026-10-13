import {
  calcularCobertura,
  type Categoria,
  type DiaAnotado,
  type Registro,
  type SituacaoDoDia,
} from "@afetilu/core";
import type { TextosApp } from "../i18n/tipo";

export type FiltroCategoria = Categoria | "todas";

export interface DiaDaLinha {
  situacao: SituacaoDoDia;
  /** Registros do dia que passam no filtro, do mais recente ao mais antigo. */
  registros: Registro[];
}

/**
 * Dias do período, do mais recente ao mais antigo. A situação do dia (sem
 * informação, sem crises, inconsistente) considera todos os registros, não só
 * os filtrados: filtrar por categoria não transforma um dia em "sem informação".
 */
export function montarLinhaDoTempo(args: {
  inicio: string;
  fim: string;
  registros: readonly Registro[];
  diasAnotados: readonly DiaAnotado[];
  filtro: FiltroCategoria;
}): DiaDaLinha[] {
  const cobertura = calcularCobertura(args);
  const porDia = new Map<string, Registro[]>();
  for (const r of args.registros) {
    if (args.filtro !== "todas" && r.detalhe.categoria !== args.filtro) continue;
    const lista = porDia.get(r.ocorreuDia) ?? [];
    lista.push(r);
    porDia.set(r.ocorreuDia, lista);
  }
  return cobertura.dias
    .map((situacao) => ({
      situacao,
      registros: (porDia.get(situacao.dia) ?? []).sort(
        (a, b) => Date.parse(b.ocorreuEm) - Date.parse(a.ocorreuEm) || b.lancadoEm.localeCompare(a.lancadoEm),
      ),
    }))
    .reverse();
}

/** Texto do cabeçalho do dia, sem confundir falta de preenchimento com ausência de crises. */
export function resumoDoDia(s: SituacaoDoDia, t: TextosApp["linha"]): string {
  if (s.semInformacao) return t.semInformacao;
  const partes: string[] = [];
  if (s.registros > 0) partes.push(t.registros(s.registros));
  if (s.semCrisesAnotado) partes.push(t.marcadoSemCrises);
  return partes.join(" · ");
}
