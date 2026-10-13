import { diasDoPeriodo } from "./datas";
import type { DiaAnotado, Registro } from "./tipos";

export interface SituacaoDoDia {
  dia: string;
  registros: number;
  episodios: number;
  /** Marcado explicitamente pelo responsável. */
  semCrisesAnotado: boolean;
  /** Sem nenhum registro e sem marcação: não sabemos o que aconteceu. */
  semInformacao: boolean;
  /** "Sem crises" marcado num dia que também tem episódio registrado. */
  inconsistente: boolean;
}

export interface Cobertura {
  dias: SituacaoDoDia[];
  totalDias: number;
  diasComRegistro: number;
  diasSemCrises: number;
  diasSemInformacao: number;
  episodios: number;
  diasInconsistentes: number;
}

export function ehEpisodio(r: Pick<Registro, "detalhe">): boolean {
  return r.detalhe.categoria === "comportamento" && r.detalhe.ehEpisodio;
}

/**
 * Situação de cada dia do período. A falta de preenchimento é "sem informação",
 * nunca "nenhum episódio".
 */
export function calcularCobertura(args: {
  inicio: string;
  fim: string;
  registros: readonly Registro[];
  diasAnotados: readonly DiaAnotado[];
}): Cobertura {
  const porDia = new Map<string, { registros: number; episodios: number }>();
  for (const r of args.registros) {
    const atual = porDia.get(r.ocorreuDia) ?? { registros: 0, episodios: 0 };
    atual.registros += 1;
    if (ehEpisodio(r)) atual.episodios += 1;
    porDia.set(r.ocorreuDia, atual);
  }
  const semCrises = new Set(args.diasAnotados.filter((d) => d.semCrises).map((d) => d.dia));

  const dias = diasDoPeriodo(args.inicio, args.fim).map((dia): SituacaoDoDia => {
    const contagem = porDia.get(dia) ?? { registros: 0, episodios: 0 };
    const anotado = semCrises.has(dia);
    return {
      dia,
      registros: contagem.registros,
      episodios: contagem.episodios,
      semCrisesAnotado: anotado,
      semInformacao: contagem.registros === 0 && !anotado,
      inconsistente: anotado && contagem.episodios > 0,
    };
  });

  return {
    dias,
    totalDias: dias.length,
    diasComRegistro: dias.filter((d) => d.registros > 0).length,
    diasSemCrises: dias.filter((d) => d.semCrisesAnotado).length,
    diasSemInformacao: dias.filter((d) => d.semInformacao).length,
    episodios: dias.reduce((s, d) => s + d.episodios, 0),
    diasInconsistentes: dias.filter((d) => d.inconsistente).length,
  };
}
