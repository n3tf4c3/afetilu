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

/**
 * Apaga os resíduos de exportação do cache. True só se o cache foi listado e todos saíram: quem
 * apaga ou substitui dados não pode dizer que as cópias exportadas sumiram quando alguma ficou.
 * Uma falha não interrompe as outras remoções; o que ficou é tentado de novo na próxima abertura.
 */
export function limparResiduos<T extends { name: string }>(listar: () => T[], ehPasta: (item: T) => boolean, apagar: (item: T) => void): boolean {
  let itens: T[];
  try {
    itens = listar();
  } catch {
    return false;
  }
  let tudo = true;
  for (const item of itens) {
    if (!ehResiduoDeExportacao(item.name, ehPasta(item))) continue;
    try {
      apagar(item);
    } catch {
      tudo = false;
    }
  }
  return tudo;
}
