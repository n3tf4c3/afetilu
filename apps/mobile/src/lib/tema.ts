// Cores com contraste AA sobre o fundo. O azul do mascote (#79AEE0) é decorativo;
// texto e botões usam o azul escuro.
export const cor = {
  fundo: "#FAF7F2",
  superficie: "#FFFFFF",
  texto: "#22324A",
  textoSuave: "#4F5A6B",
  borda: "#E1DBD0",
  primaria: "#2F5F96",
  primariaClara: "#DCEAF8",
  sobrePrimaria: "#FFFFFF",
  alerta: "#8A5A00",
  alertaFundo: "#FFF4DC",
  perigo: "#A33A3A",
  perigoFundo: "#FBE9E9",
} as const;

export const espaco = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const raio = { s: 8, m: 14, l: 20 } as const;

/** Alvo mínimo de toque (dp), conforme as diretrizes de acessibilidade. */
export const ALVO_MINIMO = 48;

export const texto = {
  titulo: { fontSize: 22, fontWeight: "700", color: cor.texto },
  subtitulo: { fontSize: 17, fontWeight: "600", color: cor.texto },
  corpo: { fontSize: 16, color: cor.texto },
  suave: { fontSize: 14, color: cor.textoSuave },
} as const;
