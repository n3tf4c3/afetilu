import { Directory, File, Paths } from "expo-file-system";
import { ehResiduoDeExportacao, PASTA_RESUMOS } from "./residuos";

/**
 * PDFs do resumo e arquivos de backup ficam no cache só para a folha de compartilhamento. O app de
 * destino pode ler o arquivo depois que a folha fecha (envio ao Drive em segundo plano), então não
 * se apaga logo após compartilhar: os resíduos saem na próxima exportação, ao abrir o app e ao
 * apagar ou substituir os dados.
 */

function apagar(item: File | Directory): void {
  try {
    if (item.exists) item.delete();
  } catch {
    // Cache: o que não sair agora sai na próxima abertura do app.
  }
}

/** Arquivo novo para o PDF do resumo, numa pasta só dele, sem os PDFs anteriores. */
export function arquivoDoResumo(nome: string): File {
  const pasta = new Directory(Paths.cache, PASTA_RESUMOS);
  apagar(pasta);
  pasta.create({ idempotent: true });
  return new File(pasta, nome);
}

/** Apaga do cache todos os PDFs de resumo e arquivos de backup. */
export function limparExportacoes(): void {
  let itens: (File | Directory)[];
  try {
    itens = Paths.cache.list();
  } catch {
    return;
  }
  for (const item of itens) {
    if (ehResiduoDeExportacao(item.name, item instanceof Directory)) apagar(item);
  }
}
