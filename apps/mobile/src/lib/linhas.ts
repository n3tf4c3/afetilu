import {
  entradaRegistro,
  type DiaAnotado,
  type EntradaRegistro,
  type MudancaRotina,
  type PerguntaConsulta,
  type Pessoa,
  type Registro,
  type RevisaoRegistro,
} from "@afetilu/core";

// Conversão entre linhas do SQLite e objetos do domínio. Todo conteúdo lido
// passa pela validação do core: um registro corrompido não entra na tela.

export interface LinhaPessoa {
  id: string;
  apelido: string;
  criada_em: string;
}

export interface LinhaRegistro {
  id: string;
  pessoa_id: string;
  categoria: string;
  ocorreu_em: string;
  ocorreu_dia: string;
  conteudo: string;
  lancado_em: string;
  atualizado_em: string;
  versao: number;
}

export interface LinhaRevisao {
  registro_id: string;
  versao: number;
  conteudo_anterior: string;
  alterado_em: string;
}

export interface LinhaDiaAnotado {
  pessoa_id: string;
  dia: string;
  sem_crises: number;
  observacao: string | null;
  lancado_em: string;
}

export const pessoaDaLinha = (l: LinhaPessoa): Pessoa => ({ id: l.id, apelido: l.apelido, criadaEm: l.criada_em });

function entradaDoJson(json: string): EntradaRegistro | null {
  try {
    const r = entradaRegistro.safeParse(JSON.parse(json));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** Devolve null quando o conteúdo não é válido ou não confere com as colunas. */
export function registroDaLinha(l: LinhaRegistro): Registro | null {
  const entrada = entradaDoJson(l.conteudo);
  if (!entrada || entrada.pessoaId !== l.pessoa_id || entrada.detalhe.categoria !== l.categoria) return null;
  return { ...entrada, id: l.id, lancadoEm: l.lancado_em, atualizadoEm: l.atualizado_em, versao: l.versao };
}

export function linhaDoRegistro(r: Registro): LinhaRegistro {
  const { id, lancadoEm, atualizadoEm, versao, ...entrada } = r;
  return {
    id,
    pessoa_id: r.pessoaId,
    categoria: r.detalhe.categoria,
    ocorreu_em: r.ocorreuEm,
    ocorreu_dia: r.ocorreuDia,
    conteudo: JSON.stringify(entrada),
    lancado_em: lancadoEm,
    atualizado_em: atualizadoEm,
    versao,
  };
}

export function revisaoDaLinha(l: LinhaRevisao): RevisaoRegistro | null {
  const conteudoAnterior = entradaDoJson(l.conteudo_anterior);
  if (!conteudoAnterior) return null;
  return { registroId: l.registro_id, versao: l.versao, conteudoAnterior, alteradoEm: l.alterado_em };
}

export const diaAnotadoDaLinha = (l: LinhaDiaAnotado): DiaAnotado => ({
  pessoaId: l.pessoa_id,
  dia: l.dia,
  semCrises: l.sem_crises === 1,
  ...(l.observacao ? { observacao: l.observacao } : {}),
  lancadoEm: l.lancado_em,
});

export interface LinhaMudanca {
  id: string;
  pessoa_id: string;
  dia: string;
  texto: string;
  lancado_em: string;
}

export interface LinhaPergunta {
  id: string;
  pessoa_id: string;
  texto: string;
  criada_em: string;
}

export const mudancaDaLinha = (l: LinhaMudanca): MudancaRotina => ({
  id: l.id,
  pessoaId: l.pessoa_id,
  dia: l.dia,
  texto: l.texto,
  lancadoEm: l.lancado_em,
});

export const perguntaDaLinha = (l: LinhaPergunta): PerguntaConsulta => ({
  id: l.id,
  pessoaId: l.pessoa_id,
  texto: l.texto,
  criadaEm: l.criada_em,
});
