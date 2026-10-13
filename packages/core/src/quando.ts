import { chaveDoDia, dataDaChave } from "./datas";
import type { PeriodoDoDia, Precisao } from "./tipos";

/** Hora representativa usada só para ordenar registros sem horário exato. */
const HORA_DO_PERIODO: Record<PeriodoDoDia, number> = { madrugada: 3, manha: 9, tarde: 15, noite: 21 };
const HORA_SO_DATA = 12;

/** Tolerância para relógios levemente adiantados ao marcar "agora". */
const TOLERANCIA_FUTURO_MS = 5 * 60 * 1000;

export type EscolhaDeQuando =
  | { tipo: "agora" }
  | { tipo: "minutos_atras"; minutos: number }
  | { tipo: "data_hora"; data: Date; aproximado: boolean }
  | { tipo: "periodo"; dia: string; periodo: PeriodoDoDia }
  | { tipo: "so_data"; dia: string };

export interface Quando {
  ocorreuEm: string;
  ocorreuDia: string;
  precisao: Precisao;
  periodoDoDia?: PeriodoDoDia;
}

export function resolverQuando(escolha: EscolhaDeQuando, agora: Date): Quando {
  switch (escolha.tipo) {
    case "agora":
      return { ocorreuEm: agora.toISOString(), ocorreuDia: chaveDoDia(agora), precisao: "exato" };
    case "minutos_atras": {
      const data = new Date(agora.getTime() - escolha.minutos * 60000);
      return { ocorreuEm: data.toISOString(), ocorreuDia: chaveDoDia(data), precisao: "aproximado" };
    }
    case "data_hora":
      return {
        ocorreuEm: escolha.data.toISOString(),
        ocorreuDia: chaveDoDia(escolha.data),
        precisao: escolha.aproximado ? "aproximado" : "exato",
      };
    case "periodo": {
      const data = dataDaChave(escolha.dia);
      data.setHours(HORA_DO_PERIODO[escolha.periodo]);
      return {
        ocorreuEm: data.toISOString(),
        ocorreuDia: escolha.dia,
        precisao: "periodo_do_dia",
        periodoDoDia: escolha.periodo,
      };
    }
    case "so_data": {
      const data = dataDaChave(escolha.dia);
      data.setHours(HORA_SO_DATA);
      return { ocorreuEm: data.toISOString(), ocorreuDia: escolha.dia, precisao: "so_data" };
    }
  }
}

/** Um registro não pode estar no futuro. Para períodos, basta o dia não ser futuro. */
export function quandoNoFuturo(q: Quando, agora: Date): boolean {
  if (q.precisao === "periodo_do_dia" || q.precisao === "so_data") return q.ocorreuDia > chaveDoDia(agora);
  return Date.parse(q.ocorreuEm) > agora.getTime() + TOLERANCIA_FUTURO_MS;
}
