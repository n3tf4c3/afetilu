import assert from "node:assert/strict";
import { test } from "node:test";
import { criarGeracao, GeracaoObsoleta } from "./geracao-backup";

// Achado 7 (auditoria 06/11/2026): a cifra feita com a senha anterior não pode ser reaproveitada.

/** Cifra falsa que só termina quando o teste manda (simula o scrypt de vários segundos). */
function cifraLenta() {
  let concluir!: () => void;
  const fim = new Promise<void>((r) => (concluir = r));
  return { fim, concluir };
}

test("sem mudança de senha, o arquivo cifrado é reaproveitado", async () => {
  const g = criarGeracao<string>();
  let cifragens = 0;
  const produzir = async () => `cifrado-${++cifragens}`;
  assert.equal(await g.obter(produzir), "cifrado-1");
  assert.equal(await g.obter(produzir), "cifrado-1");
  assert.equal(cifragens, 1);
});

test("senha editada durante a cifra: o resultado antigo é recusado e não fica guardado", async () => {
  const g = criarGeracao<string>();
  let senha = "senha-antiga";
  const lenta = cifraLenta();
  const usada = senha;
  const primeira = g.obter(async () => {
    await lenta.fim;
    return `cifrado-com-${usada}`;
  });
  // O responsável troca a senha enquanto o scrypt roda.
  senha = "senha-nova";
  g.invalidar();
  lenta.concluir();
  await assert.rejects(primeira, GeracaoObsoleta);
  // A próxima tentativa cifra de novo, com a senha nova.
  const segunda = await g.obter(async () => `cifrado-com-${senha}`);
  assert.equal(segunda, "cifrado-com-senha-nova");
});

test("senha editada depois de pronto: a próxima tentativa cifra de novo", async () => {
  const g = criarGeracao<string>();
  let senha = "a";
  assert.equal(await g.obter(async () => `cifrado-com-${senha}`), "cifrado-com-a");
  senha = "b";
  g.invalidar();
  assert.equal(await g.obter(async () => `cifrado-com-${senha}`), "cifrado-com-b");
});

test("falha na cifra não deixa resultado guardado", async () => {
  const g = criarGeracao<string>();
  await assert.rejects(g.obter(async () => Promise.reject(new Error("kdf"))), /kdf/);
  assert.equal(await g.obter(async () => "ok"), "ok");
});
