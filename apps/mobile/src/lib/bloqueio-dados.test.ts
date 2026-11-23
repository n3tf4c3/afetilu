import assert from "node:assert/strict";
import { test } from "node:test";
import { bloqueioDoValor, deveTrancarAoVoltar, TOLERANCIA_BLOQUEIO_MS } from "./bloqueio-dados";

test("bloqueio vem desligado por padrão", () => {
  assert.equal(bloqueioDoValor(null), false);
  assert.equal(bloqueioDoValor(undefined), false);
  assert.equal(bloqueioDoValor("0"), false);
  assert.equal(bloqueioDoValor("1"), true);
});

test("tranca ao voltar somente se ativo e após a tolerância", () => {
  const t0 = 1_000_000;
  assert.equal(deveTrancarAoVoltar({ bloqueioAtivo: false, saiuEmMs: t0, agoraMs: t0 + 60_000 }), false);
  assert.equal(deveTrancarAoVoltar({ bloqueioAtivo: true, saiuEmMs: null, agoraMs: t0 + 60_000 }), false);
  assert.equal(deveTrancarAoVoltar({ bloqueioAtivo: true, saiuEmMs: t0, agoraMs: t0 + TOLERANCIA_BLOQUEIO_MS - 1 }), false);
  assert.equal(deveTrancarAoVoltar({ bloqueioAtivo: true, saiuEmMs: t0, agoraMs: t0 + TOLERANCIA_BLOQUEIO_MS }), true);
  assert.equal(deveTrancarAoVoltar({ bloqueioAtivo: true, saiuEmMs: t0, agoraMs: t0 + 120_000 }), true);
});
