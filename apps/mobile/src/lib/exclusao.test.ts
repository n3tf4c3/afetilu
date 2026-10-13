import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmacaoConfere } from "./exclusao";

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
