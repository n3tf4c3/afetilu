/** A senha mudou enquanto o arquivo era cifrado: o resultado não pode ser usado nem guardado. */
export class GeracaoObsoleta extends Error {
  constructor() {
    super("geracao_obsoleta");
    this.name = "GeracaoObsoleta";
  }
}

/**
 * Guarda o arquivo de backup já cifrado com a senha atual (o scrypt leva segundos) e o descarta
 * quando a senha muda. Cada geração lembra a versão da senha em que começou: se a senha mudou
 * durante a cifra, o resultado é recusado em vez de publicado, e a próxima tentativa cifra de novo
 * com a senha nova. A senha em si nunca fica guardada aqui.
 */
export function criarGeracao<T>() {
  let versao = 0;
  let pronto: { versao: number; valor: T } | null = null;
  return {
    /** Chamar a cada edição da senha ou da confirmação. */
    invalidar(): void {
      versao += 1;
      pronto = null;
    },
    /** `produzir` deve usar a senha vigente no momento da chamada. */
    async obter(produzir: () => Promise<T>): Promise<T> {
      if (pronto && pronto.versao === versao) return pronto.valor;
      const minha = versao;
      const valor = await produzir();
      if (minha !== versao) throw new GeracaoObsoleta();
      pronto = { versao: minha, valor };
      return valor;
    },
  };
}
