import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

// Invariantes verificadas no código-fonte do app.

const RAIZ = join(__dirname, "..");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.(ts|tsx)$/.test(nome) && !nome.endsWith(".test.ts") ? [caminho] : [];
  });
}

const fontes = arquivos(RAIZ).map((caminho) => ({ caminho, texto: readFileSync(caminho, "utf8") }));

test("nenhuma transação abre outra conexão sem a chave da cifra", () => {
  // withExclusiveTransactionAsync cria uma conexão nova, que não recebe o PRAGMA key.
  const usos = fontes.filter((f) => /withExclusiveTransactionAsync\s*\(/.test(f.texto)).map((f) => f.caminho);
  assert.deepEqual(usos, []);
});

test("nenhum log no app (relatos nunca vão para logs)", () => {
  const usos = fontes.filter((f) => /\bconsole\.\w+\s*\(/.test(f.texto)).map((f) => f.caminho);
  assert.deepEqual(usos, []);
});
