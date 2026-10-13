import type { EntradaRegistro } from "@eloazul/core";
import type { Reacao } from "./reacoes";

/** Dor e enjoo registrados há mais tempo que isto não animam o slime (não parecem estar acontecendo agora). */
export const LIMITE_DESCONFORTO_RETROATIVO_MIN = 60;

/**
 * Reação do mascote para um registro recém-salvo (docs/experiencia-avatar.md, 3.2).
 * Representa o registro, nunca o estado da pessoa. `null` = sem reação (só a legenda).
 */
export function reacaoDoRegistro(r: Pick<EntradaRegistro, "detalhe" | "ocorreuEm" | "precisao">, agora: Date): Reacao | null {
  const d = r.detalhe;
  const minutos = (agora.getTime() - Date.parse(r.ocorreuEm)) / 60000;
  const semHorario = r.precisao === "periodo_do_dia" || r.precisao === "so_data";
  switch (d.categoria) {
    case "alimentacao":
      return "alimentacao";
    case "sono":
      return "sono";
    case "higiene":
      return "banho";
    case "positivo":
      return "positivo";
    case "evacuacao":
      return null;
    case "dor_desconforto":
      if (semHorario || minutos > LIMITE_DESCONFORTO_RETROATIVO_MIN) return null;
      return d.tipo === "enjoo" ? "enjoo" : "desconforto";
    case "comportamento":
      // Episódios difíceis nunca animam o slime: sinal neutro.
      if (d.ehEpisodio) return "episodio";
      return d.observado.every((o) => o === "calmo") ? "positivo" : null;
  }
}
