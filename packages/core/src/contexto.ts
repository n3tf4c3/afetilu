import { minutosEntre } from "./datas";
import type { DicionarioDominio } from "./i18n/tipo";
import type { Registro } from "./tipos";

/** Janela em que uma refeição anterior ainda é mostrada como contexto. */
const JANELA_CONTEXTO_MIN = 6 * 60;

const temHorario = (r: Pick<Registro, "precisao">) => r.precisao === "exato" || r.precisao === "aproximado";

/**
 * Contexto temporal para dor e desconforto: "Última refeição registrada: 12:30 (40 min antes)".
 * Mostra só a ordem no tempo, nunca uma causa nem o alimento. Sem horário confiável, não mostra nada.
 */
export function contextoDaUltimaRefeicao(
  referencia: Pick<Registro, "pessoaId" | "ocorreuEm" | "precisao"> & { id?: string },
  registros: readonly Registro[],
  t: DicionarioDominio,
): string | null {
  if (!temHorario(referencia)) return null;
  const instante = new Date(referencia.ocorreuEm);

  let ultima: Registro | undefined;
  for (const r of registros) {
    if (r.id === referencia.id || r.pessoaId !== referencia.pessoaId) continue;
    if (r.detalhe.categoria !== "alimentacao" || r.detalhe.tipo !== "comida" || !temHorario(r)) continue;
    const minutos = minutosEntre(new Date(r.ocorreuEm), instante);
    if (minutos < 0 || minutos > JANELA_CONTEXTO_MIN) continue;
    if (!ultima || Date.parse(r.ocorreuEm) > Date.parse(ultima.ocorreuEm)) ultima = r;
  }
  if (!ultima) return null;

  const minutos = minutosEntre(new Date(ultima.ocorreuEm), instante);
  const hora = t.hora(new Date(ultima.ocorreuEm));
  const quando = ultima.precisao === "aproximado" ? t.porVoltaDe(hora) : hora;
  const distancia = minutos === 0 ? t.noMesmoHorario : t.antes(t.duracao(minutos));
  return t.ultimaRefeicao(quando, distancia);
}
