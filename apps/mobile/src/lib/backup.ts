import {
  chaveDoDia,
  conteudoBackup,
  dataDaChave,
  envelopeBackup,
  FORMATO_BACKUP,
  LIMITES_KDF_BACKUP,
  VERSAO_ARQUIVO_BACKUP,
  VERSAO_CONTEUDO_BACKUP,
  type ConteudoBackup,
  type EnvelopeBackup,
} from "@afetilu/core";
import { gcm } from "@noble/ciphers/aes.js";
import { scryptAsync } from "@noble/hashes/scrypt.js";

// Backup cifrado com senha (docs/viabilidade-e-escopo.md, 5.2): chave derivada por scrypt,
// conteúdo em AES-256-GCM e o cabeçalho autenticado junto. Sem a senha o arquivo não abre,
// e qualquer byte alterado (cabeçalho ou conteúdo) faz a abertura falhar.

/** Senha mais longa compensa o custo menor do scrypt (LOGN_PADRAO). */
export const SENHA_MIN = 10;
/**
 * 2^15 · 8 · 128 bytes = 32 MiB no scrypt. Em JS puro no Hermes (build de release, Galaxy A52s,
 * 13/10/2026): logN 14 = 4,9 s, 15 = 9,7 s, 16 = 19,4 s. Gravado no arquivo: pode subir
 * (ou passar a um KDF nativo) sem quebrar backups antigos.
 */
export const LOGN_PADRAO = 15;
/**
 * O scrypt cede a vez a cada fatia de trabalho. Com a fatia padrão do noble (10 ms), a espera
 * do setTimeout no React Native triplicava o tempo total; 200 ms mantém a tela viva.
 */
const FATIA_MS = 200;
export const TIPO_ARQUIVO_BACKUP = "application/octet-stream";
/** Acima disso o arquivo nem é lido: anos de registros ocupam poucos megabytes. */
export const TAMANHO_MAX_BACKUP = 50 * 1024 * 1024;
/** Preferência com o instante do último backup gerado (ou restaurado), para "último backup há N dias". */
export const PREF_ULTIMO_BACKUP = "ultimo_backup";

export type FalhaBackup = "nao_e_backup" | "versao_nova" | "senha_ou_arquivo" | "conteudo_invalido";

export class ErroBackup extends Error {
  constructor(readonly tipo: FalhaBackup) {
    super(tipo);
  }
}

export function problemaDaSenha(senha: string, confirmacao: string): "curta" | "diferente" | null {
  if ([...senha.normalize("NFC")].length < SENHA_MIN) return "curta";
  if (senha.normalize("NFC") !== confirmacao.normalize("NFC")) return "diferente";
  return null;
}

/** Sem apelido no nome: o arquivo pode ficar visível numa pasta ou num serviço de nuvem. */
export const nomeDoArquivoDeBackup = (hoje: string) => `afetilu-backup-${hoje}.afetilu`;

/** Dias de calendário desde o último backup; null quando nunca houve. */
export function diasDesde(iso: string | null, agora: Date): number | null {
  const quando = iso ? new Date(iso) : null;
  if (!quando || Number.isNaN(quando.getTime())) return null;
  const ms = dataDaChave(chaveDoDia(agora)).getTime() - dataDaChave(chaveDoDia(quando)).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

// Bytes ----------------------------------------------------------------------

function paraBase64(bytes: Uint8Array): string {
  let binario = "";
  for (let i = 0; i < bytes.length; i += 0x2000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  return btoa(binario);
}

function deBase64(texto: string): Uint8Array {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/**
 * JSON só com ASCII (os demais caracteres viram \uXXXX), para converter em bytes sem depender
 * de TextDecoder no Hermes. JSON.parse devolve o texto original, acentos e emojis incluídos.
 */
function jsonAscii(valor: unknown): Uint8Array {
  const texto = JSON.stringify(valor).replace(/[\u007f-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

function textoAscii(bytes: Uint8Array): string {
  let texto = "";
  for (let i = 0; i < bytes.length; i += 0x2000) texto += String.fromCharCode(...bytes.subarray(i, i + 0x2000));
  return texto;
}

// Cifra ----------------------------------------------------------------------

type Cabecalho = Omit<EnvelopeBackup, "dados">;

/** Dados autenticados do GCM: o cabeçalho em ordem fixa de campos. */
function dadosAutenticados(c: Cabecalho): Uint8Array {
  return jsonAscii({
    formato: c.formato,
    versao: c.versao,
    kdf: { nome: c.kdf.nome, logN: c.kdf.logN, r: c.kdf.r, p: c.kdf.p, sal: c.kdf.sal },
    cifra: { nome: c.cifra.nome, nonce: c.cifra.nonce },
  });
}

function derivarChave(senha: string, c: Cabecalho, aoProgredir?: (fracao: number) => void): Promise<Uint8Array> {
  return scryptAsync(new TextEncoder().encode(senha.normalize("NFC")), deBase64(c.kdf.sal), {
    N: 2 ** c.kdf.logN,
    r: c.kdf.r,
    p: c.kdf.p,
    dkLen: 32,
    asyncTick: FATIA_MS,
    onProgress: aoProgredir,
  });
}

/** Valida o conteúdo (nunca grava um backup que não abriria) e devolve o texto do arquivo. */
export async function cifrarBackup(
  conteudo: ConteudoBackup,
  senha: string,
  opcoes: { aleatorio: (n: number) => Uint8Array; logN?: number; aoProgredir?: (fracao: number) => void },
): Promise<string> {
  const valido = conteudoBackup.parse(conteudo);
  const cabecalho: Cabecalho = {
    formato: FORMATO_BACKUP,
    versao: VERSAO_ARQUIVO_BACKUP,
    kdf: {
      nome: "scrypt",
      logN: opcoes.logN ?? LOGN_PADRAO,
      r: LIMITES_KDF_BACKUP.r,
      p: LIMITES_KDF_BACKUP.p,
      sal: paraBase64(opcoes.aleatorio(LIMITES_KDF_BACKUP.sal)),
    },
    cifra: { nome: "aes-256-gcm", nonce: paraBase64(opcoes.aleatorio(LIMITES_KDF_BACKUP.nonce)) },
  };
  const chave = await derivarChave(senha, cabecalho, opcoes.aoProgredir);
  try {
    const cifrado = gcm(chave, deBase64(cabecalho.cifra.nonce), dadosAutenticados(cabecalho)).encrypt(jsonAscii(valido));
    const envelope: EnvelopeBackup = { ...cabecalho, dados: paraBase64(cifrado) };
    return JSON.stringify(envelope);
  } finally {
    chave.fill(0);
  }
}

/** Lê o cabeçalho sem a senha: confere se é um backup do app e se esta versão sabe abri-lo. */
export function lerArquivoDeBackup(texto: string): EnvelopeBackup {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    throw new ErroBackup("nao_e_backup");
  }
  const parcial = bruto as { formato?: unknown; versao?: unknown } | null;
  if (typeof parcial !== "object" || parcial === null || parcial.formato !== FORMATO_BACKUP) throw new ErroBackup("nao_e_backup");
  if (typeof parcial.versao === "number" && parcial.versao > VERSAO_ARQUIVO_BACKUP) throw new ErroBackup("versao_nova");
  const r = envelopeBackup.safeParse(bruto);
  if (!r.success) throw new ErroBackup("nao_e_backup");
  return r.data;
}

/** Senha errada e arquivo alterado são indistinguíveis no GCM: a mensagem cobre os dois. */
export async function decifrarBackup(
  envelope: EnvelopeBackup,
  senha: string,
  aoProgredir?: (fracao: number) => void,
): Promise<ConteudoBackup> {
  const chave = await derivarChave(senha, envelope, aoProgredir);
  let claro: Uint8Array;
  try {
    claro = gcm(chave, deBase64(envelope.cifra.nonce), dadosAutenticados(envelope)).decrypt(deBase64(envelope.dados));
  } catch {
    throw new ErroBackup("senha_ou_arquivo");
  } finally {
    chave.fill(0);
  }
  let bruto: unknown;
  try {
    bruto = JSON.parse(textoAscii(claro));
  } catch {
    throw new ErroBackup("conteudo_invalido");
  }
  const versao = (bruto as { versao?: unknown } | null)?.versao;
  if (typeof versao === "number" && versao > VERSAO_CONTEUDO_BACKUP) throw new ErroBackup("versao_nova");
  const r = conteudoBackup.safeParse(bruto);
  if (!r.success) throw new ErroBackup("conteudo_invalido");
  return r.data;
}
