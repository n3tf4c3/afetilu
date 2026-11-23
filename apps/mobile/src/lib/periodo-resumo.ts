import { diasDoPeriodo, somarDias } from "@afetilu/core";

export const PERIODOS_RESUMO = [7, 30, 90] as const;
export type OpcaoPeriodoResumo = (typeof PERIODOS_RESUMO)[number] | "personalizado";

/** Limite de segurança para manter a geração de PDF rápida no aparelho. */
export const MAX_DIAS_RESUMO = 365;

export type ResultadoPeriodoResumo =
  | { ok: true; inicio: string; fim: string; totalDias: number }
  | { ok: false; erro: "invertido" | "muito_longo" };

/** Resolve e valida o intervalo escolhido na tela de resumo. */
export function resolverPeriodoResumo(args: {
  opcao: OpcaoPeriodoResumo;
  hoje: string;
  inicioPersonalizado: string;
  fimPersonalizado: string;
}): ResultadoPeriodoResumo {
  if (args.opcao !== "personalizado") {
    const inicio = somarDias(args.hoje, -(args.opcao - 1));
    return { ok: true, inicio, fim: args.hoje, totalDias: args.opcao };
  }
  if (args.inicioPersonalizado > args.fimPersonalizado) {
    return { ok: false, erro: "invertido" };
  }
  const dias = diasDoPeriodo(args.inicioPersonalizado, args.fimPersonalizado).length;
  if (dias === 0) return { ok: false, erro: "invertido" };
  if (dias > MAX_DIAS_RESUMO) return { ok: false, erro: "muito_longo" };
  return { ok: true, inicio: args.inicioPersonalizado, fim: args.fimPersonalizado, totalDias: dias };
}
