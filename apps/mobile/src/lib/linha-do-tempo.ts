import {
  calcularCobertura,
  type Categoria,
  type DiaAnotado,
  type DicionarioDominio,
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

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Verifica se um registro contém o termo buscado (sem diferenciar maiúsculas nem acentos). */
export function registroCombinaComBusca(r: Registro, termo: string, d?: DicionarioDominio): boolean {
  const alvo = normalizar(termo.trim());
  if (!alvo) return true;
  const partes: (string | undefined)[] = [
    r.observacao,
    r.origemQuem,
    r.local && d ? d.local[r.local] : r.local,
    d ? d.categoria[r.detalhe.categoria] : r.detalhe.categoria,
  ];
  const det = r.detalhe;
  switch (det.categoria) {
    case "alimentacao":
      partes.push(det.item, det.comoFicouDepois, d?.tipoAlimento[det.tipo]);
      break;
    case "dor_desconforto":
      partes.push(d?.desconforto[det.tipo], det.regiao ? d?.regiao[det.regiao] : undefined, det.sinais);
      break;
    case "comportamento":
      for (const o of det.observado) partes.push(d?.observado[o] ?? o);
      if (det.episodio) {
        partes.push(
          det.episodio.contextoAntes,
          det.episodio.medidas,
          det.episodio.desfecho,
          ...(det.episodio.ajudou ?? []),
        );
      }
      break;
    case "higiene":
      partes.push(d?.higiene[det.tipo]);
      break;
    case "sono":
      partes.push(d?.tipoSono[det.tipo]);
      break;
    case "evacuacao":
      partes.push(d?.evacuacao[det.tipo], det.onde ? d?.ondeEvacuacao[det.onde] : undefined, det.aspecto);
      break;
    case "positivo":
      partes.push(d?.positivo[det.tipo], det.descricao);
      break;
  }
  return partes.some((p) => (p ? normalizar(p).includes(alvo) : false));
}

/**
 * Dias do período, do mais recente ao mais antigo. A situação do dia (sem
 * informação, sem crises, inconsistente) considera todos os registros, não só
 * os filtrados: filtrar por categoria não transforma um dia em "sem informação".
 * Quando há busca por texto, só os dias com algum registro correspondente aparecem.
 */
export function montarLinhaDoTempo(args: {
  inicio: string;
  fim: string;
  registros: readonly Registro[];
  diasAnotados: readonly DiaAnotado[];
  filtro: FiltroCategoria;
  busca?: string;
  d?: DicionarioDominio;
}): DiaDaLinha[] {
  const cobertura = calcularCobertura(args);
  const temBusca = Boolean(args.busca?.trim());
  const porDia = new Map<string, Registro[]>();
  for (const r of args.registros) {
    if (args.filtro !== "todas" && r.detalhe.categoria !== args.filtro) continue;
    if (temBusca && !registroCombinaComBusca(r, args.busca!, args.d)) continue;
    const lista = porDia.get(r.ocorreuDia) ?? [];
    lista.push(r);
    porDia.set(r.ocorreuDia, lista);
  }
  const dias = cobertura.dias
    .map((situacao) => ({
      situacao,
      registros: (porDia.get(situacao.dia) ?? []).sort(
        (a, b) => Date.parse(b.ocorreuEm) - Date.parse(a.ocorreuEm) || b.lancadoEm.localeCompare(a.lancadoEm),
      ),
    }))
    .reverse();
  return temBusca ? dias.filter((dia) => dia.registros.length > 0) : dias;
}

/** Texto do cabeçalho do dia, sem confundir falta de preenchimento com ausência de crises. */
export function resumoDoDia(s: SituacaoDoDia, t: TextosApp["linha"]): string {
  if (s.semInformacao) return t.semInformacao;
  const partes: string[] = [];
  if (s.registros > 0) partes.push(t.registros(s.registros));
  if (s.semCrisesAnotado) partes.push(t.marcadoSemCrises);
  return partes.join(" · ");
}
