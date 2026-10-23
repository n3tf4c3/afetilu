import assert from "node:assert/strict";
import { test } from "node:test";
import { apagarArquivoEChave, confirmacaoConfere, restauracaoLiberada } from "./exclusao";

test("confirmação aceita maiúsculas e espaços diferentes", () => {
  assert.equal(confirmacaoConfere("apagar", "APAGAR"), true);
  assert.equal(confirmacaoConfere("  Exemplo  ", "Exemplo"), true);
  assert.equal(confirmacaoConfere("ana  clara", "Ana Clara"), true);
});

test("confirmação recusa texto parcial, diferente ou vazio", () => {
  assert.equal(confirmacaoConfere("Exem", "Exemplo"), false);
  assert.equal(confirmacaoConfere("Exemplo!", "Exemplo"), false);
  assert.equal(confirmacaoConfere("", "APAGAR"), false);
  assert.equal(confirmacaoConfere("", ""), false);
  assert.equal(confirmacaoConfere("   ", "  "), false);
});

test("acentos contam, mas a forma de compor o acento não", () => {
  assert.equal(confirmacaoConfere("Joao", "João"), false);
  // "ã" composto (um caractere) e decomposto ("a" + til combinante) são o mesmo texto.
  assert.equal(confirmacaoConfere("João", "João"), true);
});

function operacoes(falhaArquivo: boolean, arquivoFica: boolean) {
  const passos: string[] = [];
  return {
    passos,
    op: {
      fechar: async () => {
        passos.push("fechou");
      },
      apagarArquivo: async () => {
        if (falhaArquivo) throw new Error("EIO");
        passos.push("arquivo apagado");
      },
      arquivoAusente: () => !arquivoFica,
      apagarChave: async () => {
        passos.push("chave apagada");
      },
    },
  };
}

test("apagar tudo: arquivo apagado, depois a chave", async () => {
  const { passos, op } = operacoes(false, false);
  await apagarArquivoEChave(op);
  assert.deepEqual(passos, ["fechou", "arquivo apagado", "chave apagada"]);
});

test("apagar tudo: falha ao apagar o arquivo sobe e preserva a chave", async () => {
  const { passos, op } = operacoes(true, true);
  await assert.rejects(apagarArquivoEChave(op), /EIO/);
  assert.deepEqual(passos, ["fechou"]);
});

test("apagar tudo: arquivo que já não existe conta como apagado", async () => {
  const { passos, op } = operacoes(true, false);
  await apagarArquivoEChave(op);
  assert.deepEqual(passos, ["fechou", "chave apagada"]);
});

test("apagar tudo: falha ao fechar não impede a exclusão", async () => {
  const { passos, op } = operacoes(false, false);
  await apagarArquivoEChave({ ...op, fechar: () => Promise.reject(new Error("já fechado")) });
  assert.deepEqual(passos, ["arquivo apagado", "chave apagada"]);
});

test("restauração sem a contagem dos dados atuais fica travada", () => {
  assert.equal(restauracaoLiberada(null, "", "SUBSTITUIR"), false);
  assert.equal(restauracaoLiberada(null, "substituir", "SUBSTITUIR"), false);
});

test("restauração: aparelho vazio dispensa a palavra; com dados, exige", () => {
  assert.equal(restauracaoLiberada({ pessoas: 0 }, "", "SUBSTITUIR"), true);
  assert.equal(restauracaoLiberada({ pessoas: 2 }, "", "SUBSTITUIR"), false);
  assert.equal(restauracaoLiberada({ pessoas: 2 }, "substituir", "SUBSTITUIR"), true);
});
