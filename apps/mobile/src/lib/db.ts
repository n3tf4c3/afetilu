import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import { apagarArquivoEChave } from "./exclusao";
import { MIGRACOES } from "./migracoes";

const NOME_BANCO = "afetilu.db";
const CHAVE_SEGURA = "afetilu.chave-banco.v1";

export type FalhaBanco = "sem_cifra" | "nao_abriu";

export class ErroBanco extends Error {
  constructor(readonly tipo: FalhaBanco, readonly causa?: string) {
    super(tipo === "sem_cifra" ? "SQLCipher indisponível nesta build." : "Não foi possível abrir os dados.");
  }
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * A chave do banco é aleatória, fica no Keychain/Keystore e só vale neste
 * aparelho: um backup do sistema leva apenas o arquivo cifrado, sem a chave.
 */
async function obterChave(): Promise<string> {
  const existente = await SecureStore.getItemAsync(CHAVE_SEGURA);
  if (existente) return existente;
  const nova = hex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(CHAVE_SEGURA, nova, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return nova;
}

async function aplicarMigracoes(db: SQLite.SQLiteDatabase): Promise<void> {
  const linha = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const atual = linha?.user_version ?? 0;
  for (let i = atual; i < MIGRACOES.length; i++) {
    // Nunca withExclusiveTransactionAsync: ela abre outra conexão, que não recebe a chave da cifra.
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACOES[i]!);
      await db.execAsync(`PRAGMA user_version = ${i + 1}`);
    });
  }
}

export async function abrirBanco(): Promise<SQLite.SQLiteDatabase> {
  const chave = await obterChave();
  const db = await SQLite.openDatabaseAsync(NOME_BANCO);
  try {
    await db.execAsync(`PRAGMA key = "x'${chave}'"`);
    const cifra = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version");
    if (!cifra?.cipher_version) throw new ErroBanco("sem_cifra");
    // Falha aqui quando o arquivo existe mas foi cifrado com outra chave.
    await db.getFirstAsync("SELECT count(*) AS n FROM sqlite_master");
    await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON;");
    await aplicarMigracoes(db);
    return db;
  } catch (e) {
    await db.closeAsync().catch(() => undefined);
    throw e instanceof ErroBanco ? e : new ErroBanco("nao_abriu", e instanceof Error ? e.message : String(e));
  }
}

/**
 * Apaga o arquivo e a chave. Só por confirmação explícita do responsável. Falha se o arquivo
 * continuar no aparelho, e aí a chave fica (ver `apagarArquivoEChave`).
 */
export async function apagarBancoDoAparelho(db?: SQLite.SQLiteDatabase): Promise<void> {
  await apagarArquivoEChave({
    fechar: db ? () => db.closeAsync() : undefined,
    apagarArquivo: () => SQLite.deleteDatabaseAsync(NOME_BANCO),
    // O expo-sqlite recusa com "Database ... not found" (Android e iOS). A conferência no disco
    // usa o defaultDatabaseDirectory dele, <documentos>/SQLite; na dúvida, a chave fica.
    arquivoAusente: (e) =>
      /not found/i.test(e instanceof Error ? e.message : String(e)) && !new File(Paths.document, "SQLite", NOME_BANCO).exists,
    apagarChave: () => SecureStore.deleteItemAsync(CHAVE_SEGURA),
  });
}

export const novoId = () => Crypto.randomUUID();
