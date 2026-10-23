/** Normaliza o texto digitado na confirmação: sem espaços nas pontas, espaços simples e sem caixa. */
function normalizar(texto: string): string {
  return texto.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

/**
 * A confirmação digitada confere com o esperado (apelido da pessoa ou a palavra de "apagar tudo").
 * Aceita diferença de maiúsculas e de espaços; acentos contam. Esperado vazio nunca confere.
 */
export function confirmacaoConfere(digitado: string, esperado: string): boolean {
  const alvo = normalizar(esperado);
  return alvo.length > 0 && normalizar(digitado) === alvo;
}

/** Operações de "apagar tudo", separadas do Expo para teste. */
export interface OperacoesApagarBanco {
  fechar?: () => Promise<void>;
  apagarArquivo: () => Promise<void>;
  /** A falha de `apagarArquivo` foi só "o arquivo não existe"? */
  arquivoAusente: (erro: unknown) => Promise<boolean> | boolean;
  apagarChave: () => Promise<void>;
}

/**
 * Apaga o arquivo do banco e só depois a chave. Se o arquivo continuar no aparelho, a falha sobe e a
 * chave fica: apagar a chave de um arquivo que sobrou deixaria o app sem conseguir abri-lo.
 * Arquivo já ausente (nova tentativa depois de uma falha na chave) conta como apagado.
 */
export async function apagarArquivoEChave(op: OperacoesApagarBanco): Promise<void> {
  // Pode falhar por já estar fechado; se ainda estiver aberto, a exclusão do arquivo recusa.
  await op.fechar?.().catch(() => undefined);
  try {
    await op.apagarArquivo();
  } catch (e) {
    if (!(await op.arquivoAusente(e))) throw e;
  }
  await op.apagarChave();
}

/**
 * Restaurar substitui tudo. Sem dados no aparelho, dispensa a palavra digitada; enquanto a contagem
 * não chegou (ou se falhou), não se sabe se há dados, e o botão fica travado.
 */
export function restauracaoLiberada(atuais: { pessoas: number } | null, digitado: string, palavra: string): boolean {
  if (!atuais) return false;
  return atuais.pessoas === 0 || confirmacaoConfere(digitado, palavra);
}
