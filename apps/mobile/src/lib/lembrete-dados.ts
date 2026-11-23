export const CHAVES_LEMBRETE = {
  ativo: "lembrete_ativo",
  hora: "lembrete_hora",
} as const;

export const HORAS_LEMBRETE = [19, 20, 21, 22] as const;
export type HoraLembrete = (typeof HORAS_LEMBRETE)[number];

export interface PreferenciaLembrete {
  /** Desligado por padrão: só agenda se o responsável ativar em Ajustes. */
  ativo: boolean;
  /** Hora cheia no fuso local do aparelho (minuto 0). */
  hora: HoraLembrete;
}

export const LEMBRETE_PADRAO: PreferenciaLembrete = {
  ativo: false,
  hora: 20,
};

function ehHoraValida(n: number): n is HoraLembrete {
  return (HORAS_LEMBRETE as readonly number[]).includes(n);
}

/** Converte os valores gravados no banco; valores ausentes ou inválidos caem no padrão seguro (desligado). */
export function lembreteDosValores(valores: { ativo?: string | null; hora?: string | null }): PreferenciaLembrete {
  const ativo = valores.ativo === "1";
  const parsed = valores.hora ? Number.parseInt(valores.hora, 10) : NaN;
  const hora: HoraLembrete = ehHoraValida(parsed) ? parsed : LEMBRETE_PADRAO.hora;
  return { ativo, hora };
}

/** Formata a hora escolhida conforme o idioma (12 h em inglês, 24 h em português e espanhol). */
export function formatarHoraLembrete(hora: HoraLembrete, idioma: "pt-BR" | "en" | "es"): string {
  if (idioma === "en") return `${hora - 12}:00 PM`;
  return `${String(hora).padStart(2, "0")}:00`;
}
