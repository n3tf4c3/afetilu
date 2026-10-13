import type { EntradaRegistro, Registro, RevisaoRegistro } from "./tipos";

export function novoRegistro(entrada: EntradaRegistro, id: string, agora: string): Registro {
  return { ...entrada, id, lancadoEm: agora, atualizadoEm: agora, versao: 1 };
}

export function extrairEntrada(r: Registro): EntradaRegistro {
  const { id: _id, lancadoEm: _l, atualizadoEm: _a, versao: _v, ...entrada } = r;
  return entrada;
}

/** Serialização estável (chaves ordenadas, sem undefined) para comparar conteúdos. */
function estavel(valor: unknown): string {
  return JSON.stringify(valor, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

/**
 * Correção preserva a cronologia: a versão anterior vira revisão, `lancadoEm`
 * nunca muda e a versão sobe. Sem mudança real, devolve null.
 */
export function corrigirRegistro(
  atual: Registro,
  nova: EntradaRegistro,
  agora: string,
): { registro: Registro; revisao: RevisaoRegistro } | null {
  if (nova.pessoaId !== atual.pessoaId) throw new Error("Uma correção não pode mudar a pessoa do registro.");
  const anterior = extrairEntrada(atual);
  if (estavel(anterior) === estavel(nova)) return null;
  return {
    registro: { ...nova, id: atual.id, lancadoEm: atual.lancadoEm, atualizadoEm: agora, versao: atual.versao + 1 },
    revisao: { registroId: atual.id, versao: atual.versao, conteudoAnterior: anterior, alteradoEm: agora },
  };
}
