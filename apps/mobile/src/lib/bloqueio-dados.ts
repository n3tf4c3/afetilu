export const CHAVE_BLOQUEIO = "bloqueio_ativo";

/**
 * Tolerância ao alternar rapidamente para outro app (ex.: folha de compartilhamento do PDF/backup).
 * Passado esse tempo em segundo plano, o app volta trancado.
 */
export const TOLERANCIA_BLOQUEIO_MS = 15_000;

/** Desligado por padrão: só tranca se o responsável ativar em Ajustes. */
export function bloqueioDoValor(valor: string | null | undefined): boolean {
  return valor === "1";
}

/** Decide se o app deve exigir autenticação ao retornar para primeiro plano. */
export function deveTrancarAoVoltar(args: {
  bloqueioAtivo: boolean;
  saiuEmMs: number | null;
  agoraMs: number;
  toleranciaMs?: number;
}): boolean {
  if (!args.bloqueioAtivo || args.saiuEmMs === null) return false;
  const limite = args.toleranciaMs ?? TOLERANCIA_BLOQUEIO_MS;
  return args.agoraMs - args.saiuEmMs >= limite;
}
