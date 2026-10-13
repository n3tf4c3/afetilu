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
