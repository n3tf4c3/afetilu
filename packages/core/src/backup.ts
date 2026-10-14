import { z } from "zod";
import { dia, entradaMudanca, entradaPergunta, entradaPessoa, entradaRegistro, instante, textoLivre } from "./tipos";

/**
 * Versão do conteúdo do backup. Subir ao mudar o formato e manter a leitura das anteriores:
 * um backup antigo precisa continuar abrindo depois de atualizar o app.
 */
export const VERSAO_CONTEUDO_BACKUP = 2;

const id = z.string().min(1);

const pessoaBackup = entradaPessoa.extend({ id, criadaEm: instante });

// safeExtend mantém as regras cruzadas de entradaRegistro (extend recusaria o objeto refinado).
const registroBackup = entradaRegistro.safeExtend({
  id,
  lancadoEm: instante,
  atualizadoEm: instante,
  versao: z.number().int().min(1),
});

const revisaoBackup = z.object({
  registroId: id,
  versao: z.number().int().min(1),
  conteudoAnterior: entradaRegistro,
  alteradoEm: instante,
});

const diaAnotadoBackup = z.object({
  pessoaId: id,
  dia,
  semCrises: z.boolean(),
  observacao: textoLivre.optional(),
  lancadoEm: instante,
});

const mudancaBackup = entradaMudanca.extend({ id, lancadoEm: instante });
const perguntaBackup = entradaPergunta.extend({ id, criadaEm: instante });

function repetido(chaves: readonly string[]): string | undefined {
  const vistas = new Set<string>();
  for (const c of chaves) {
    if (vistas.has(c)) return c;
    vistas.add(c);
  }
  return undefined;
}

/**
 * Tudo o que o backup leva: pessoas, registros com o histórico de correções, dias anotados,
 * mudanças na rotina e perguntas para a consulta (as duas últimas desde a versão 2; um backup
 * da versão 1 abre com as listas vazias).
 * Preferências do aparelho (idioma, aparência) ficam de fora. A restauração é tudo ou nada,
 * então qualquer referência quebrada ou chave repetida recusa o arquivo inteiro.
 */
export const conteudoBackup = z
  .object({
    versao: z.union([z.literal(1), z.literal(VERSAO_CONTEUDO_BACKUP)]),
    criadoEm: instante,
    pessoas: z.array(pessoaBackup),
    registros: z.array(registroBackup),
    revisoes: z.array(revisaoBackup),
    diasAnotados: z.array(diaAnotadoBackup),
    mudancas: z.array(mudancaBackup).default([]),
    perguntas: z.array(perguntaBackup).default([]),
  })
  .superRefine((c, ctx) => {
    const falha = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
    const pessoas = new Set(c.pessoas.map((p) => p.id));
    const versaoDoRegistro = new Map(c.registros.map((r) => [r.id, r.versao]));

    if (repetido(c.pessoas.map((p) => p.id))) falha(["pessoas"], "Pessoa repetida.");
    if (repetido(c.registros.map((r) => r.id))) falha(["registros"], "Registro repetido.");
    if (repetido(c.revisoes.map((r) => `${r.registroId}#${r.versao}`))) falha(["revisoes"], "Revisão repetida.");
    if (repetido(c.diasAnotados.map((d) => `${d.pessoaId}#${d.dia}`))) falha(["diasAnotados"], "Dia anotado repetido.");
    if (repetido(c.mudancas.map((m) => m.id))) falha(["mudancas"], "Mudança repetida.");
    if (repetido(c.perguntas.map((p) => p.id))) falha(["perguntas"], "Pergunta repetida.");

    c.registros.forEach((r, i) => {
      if (!pessoas.has(r.pessoaId)) falha(["registros", i, "pessoaId"], "Registro de pessoa ausente.");
    });
    c.revisoes.forEach((r, i) => {
      const atual = versaoDoRegistro.get(r.registroId);
      if (atual === undefined) falha(["revisoes", i, "registroId"], "Revisão de registro ausente.");
      else if (r.versao >= atual) falha(["revisoes", i, "versao"], "Revisão posterior à versão atual.");
    });
    c.diasAnotados.forEach((d, i) => {
      if (!pessoas.has(d.pessoaId)) falha(["diasAnotados", i, "pessoaId"], "Dia anotado de pessoa ausente.");
    });
    c.mudancas.forEach((m, i) => {
      if (!pessoas.has(m.pessoaId)) falha(["mudancas", i, "pessoaId"], "Mudança de pessoa ausente.");
    });
    c.perguntas.forEach((p, i) => {
      if (!pessoas.has(p.pessoaId)) falha(["perguntas", i, "pessoaId"], "Pergunta de pessoa ausente.");
    });
  });
export type ConteudoBackup = z.infer<typeof conteudoBackup>;

/** Versão do envelope (cabeçalho do arquivo). Independente da versão do conteúdo cifrado. */
export const VERSAO_ARQUIVO_BACKUP = 1;
export const FORMATO_BACKUP = "afetilu-backup";

/**
 * Limites do scrypt aceitos na leitura. A memória usada é 128 · r · 2^logN bytes: o teto evita
 * que um arquivo adulterado peça mais memória do que um celular de entrada tem.
 */
export const LIMITES_KDF_BACKUP = { logNMin: 14, logNMax: 18, r: 8, p: 1, sal: 16, nonce: 12 } as const;

const base64DeBytes = (n: number) =>
  z
    .string()
    .length(4 * Math.ceil(n / 3))
    .regex(/^[A-Za-z0-9+/]*={0,2}$/);

/** O arquivo de backup: cabeçalho legível (sem dado pessoal) e o conteúdo cifrado em base64. */
export const envelopeBackup = z.object({
  formato: z.literal(FORMATO_BACKUP),
  versao: z.number().int().min(1),
  kdf: z.object({
    nome: z.literal("scrypt"),
    logN: z.number().int().min(LIMITES_KDF_BACKUP.logNMin).max(LIMITES_KDF_BACKUP.logNMax),
    r: z.literal(LIMITES_KDF_BACKUP.r),
    p: z.literal(LIMITES_KDF_BACKUP.p),
    sal: base64DeBytes(LIMITES_KDF_BACKUP.sal),
  }),
  cifra: z.object({
    nome: z.literal("aes-256-gcm"),
    nonce: base64DeBytes(LIMITES_KDF_BACKUP.nonce),
  }),
  dados: z.string().min(1).regex(/^[A-Za-z0-9+/]*={0,2}$/),
});
export type EnvelopeBackup = z.infer<typeof envelopeBackup>;

/** O que a tela mostra antes de substituir os dados do aparelho. */
export interface PreviaBackup {
  criadoEm: string;
  pessoas: { apelido: string; registros: number }[];
  registros: number;
  diasSemCrises: number;
  /** Primeiro e último dia com registro ou marcação; null quando não há nenhum. */
  periodo: { inicio: string; fim: string } | null;
}

export function previaDoBackup(c: ConteudoBackup): PreviaBackup {
  const dias = [
    ...c.registros.map((r) => r.ocorreuDia),
    ...c.diasAnotados.filter((d) => d.semCrises).map((d) => d.dia),
  ].sort();
  return {
    criadoEm: c.criadoEm,
    pessoas: c.pessoas.map((p) => ({ apelido: p.apelido, registros: c.registros.filter((r) => r.pessoaId === p.id).length })),
    registros: c.registros.length,
    diasSemCrises: c.diasAnotados.filter((d) => d.semCrises).length,
    periodo: dias.length > 0 ? { inicio: dias[0]!, fim: dias[dias.length - 1]! } : null,
  };
}
