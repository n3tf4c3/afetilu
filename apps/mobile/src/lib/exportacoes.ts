import { Directory, File, Paths } from "expo-file-system";
import { limparResiduos, PASTA_RESUMOS } from "./residuos";

/**
 * PDFs do resumo e arquivos de backup ficam no cache só para a folha de compartilhamento. O app de
 * destino pode ler o arquivo depois que a folha fecha (envio ao Drive em segundo plano), então não
 * se apaga logo após compartilhar: os resíduos saem na próxima exportação, ao abrir o app e ao
 * apagar ou substituir os dados.
 */

function apagar(item: File | Directory): void {
  if (item.exists) item.delete();
}

/** Arquivo novo para o PDF do resumo, numa pasta só dele, sem os PDFs anteriores. */
export function arquivoDoResumo(nome: string): File {
  const pasta = new Directory(Paths.cache, PASTA_RESUMOS);
  try {
    apagar(pasta);
  } catch {
    // Cache: o que não sair agora sai na próxima abertura do app.
  }
  pasta.create({ idempotent: true });
  return new File(pasta, nome);
}

/**
 * Apaga do cache todos os PDFs de resumo e arquivos de backup. False quando algum ficou (ou o cache
 * não pôde ser listado): a tela avisa, e a próxima abertura do app tenta de novo.
 */
export function limparExportacoes(): boolean {
  return limparResiduos(
    () => Paths.cache.list(),
    (item) => item instanceof Directory,
    apagar,
  );
}
