/** Pasta dos PDFs de resumo dentro do cache. */
export const PASTA_RESUMOS = "resumos";
/** Pasta onde o expo-print grava o PDF antes de o app movê-lo (Android e iOS). */
export const PASTA_PRINT = "Print";
/** Prefixo dos arquivos de backup gerados para compartilhar. */
export const PREFIXO_BACKUP = "afetilu-backup-";

/**
 * Item da raiz do cache que veio de uma exportação: a pasta dos resumos, a do expo-print, um backup
 * ou um PDF solto (versões anteriores gravavam o resumo direto na raiz).
 */
export function ehResiduoDeExportacao(nome: string, ehPasta: boolean): boolean {
  if (ehPasta) return nome === PASTA_RESUMOS || nome === PASTA_PRINT;
  return nome.startsWith(PREFIXO_BACKUP) || nome.toLowerCase().endsWith(".pdf");
}
