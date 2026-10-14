import assert from "node:assert/strict";
import { test } from "node:test";
import { destinoDeLinkExterno } from "./links";

const MALICIOSOS = [
  "afetilu://apagar?tudo=1",
  "afetilu://restaurar",
  "afetilu://detalhe/abc?x=%E0%A4%A",
  `afetilu://?q=${"%".repeat(5000)}`,
  "/registro/comportamento?ehEpisodio=%%%",
];

test("link externo ao abrir o app leva sempre ao início, sem repassar path nem query", () => {
  for (const path of MALICIOSOS) assert.equal(destinoDeLinkExterno({ path, initial: true }), "/");
});

test("link externo com o app aberto não navega", () => {
  for (const path of MALICIOSOS) assert.equal(destinoDeLinkExterno({ path, initial: false }), null);
});
