import { LOCAIS, type Local } from "@afetilu/core";

// Preferências de aparência, guardadas no banco local (tabela preferencia).

export const MODOS_VISUAIS = ["cenario", "simples"] as const;
export type ModoVisual = (typeof MODOS_VISUAIS)[number];

export const PREFERENCIAS_MOVIMENTO = ["auto", "completo", "reduzido", "nenhum"] as const;
export type PreferenciaMovimento = (typeof PREFERENCIAS_MOVIMENTO)[number];

/** Sons desligados até a pessoa escolher; "pendente" = ainda não perguntado/respondido. */
export const PREFERENCIAS_SOM = ["pendente", "ligado", "desligado"] as const;
export type PreferenciaSom = (typeof PREFERENCIAS_SOM)[number];

export interface Aparencia {
  modoVisual: ModoVisual;
  /** "auto" segue o "reduzir movimento" do sistema. */
  movimento: PreferenciaMovimento;
  /** Cenário atual da tela inicial (onde a pessoa está). */
  local: Local;
  som: PreferenciaSom;
}

export const APARENCIA_PADRAO: Aparencia = { modoVisual: "cenario", movimento: "auto", local: "casa", som: "pendente" };

export const CHAVES_APARENCIA: Record<keyof Aparencia, string> = {
  modoVisual: "modo_visual",
  movimento: "movimento",
  local: "local_atual",
  som: "som",
};

const em = <T extends string>(lista: readonly T[], valor: string | null, padrao: T): T =>
  valor !== null && (lista as readonly string[]).includes(valor) ? (valor as T) : padrao;

/** Lê valores salvos; qualquer valor desconhecido volta ao padrão. */
export function aparenciaDosValores(v: Record<keyof Aparencia, string | null>): Aparencia {
  return {
    modoVisual: em(MODOS_VISUAIS, v.modoVisual, APARENCIA_PADRAO.modoVisual),
    movimento: em(PREFERENCIAS_MOVIMENTO, v.movimento, APARENCIA_PADRAO.movimento),
    local: em(LOCAIS, v.local, APARENCIA_PADRAO.local),
    som: em(PREFERENCIAS_SOM, v.som, APARENCIA_PADRAO.som),
  };
}

/** Movimento efetivo do mascote: a preferência do app, ou a do sistema quando "auto". */
export function movimentoEfetivo(p: PreferenciaMovimento, sistemaReduzMovimento: boolean): "completo" | "reduzido" | "nenhum" {
  if (p === "auto") return sistemaReduzMovimento ? "reduzido" : "completo";
  return p;
}
