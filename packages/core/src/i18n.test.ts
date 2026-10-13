import assert from "node:assert/strict";
import { test } from "node:test";
import { dominio, ehIdioma, IDIOMAS, resolverIdioma } from "./i18n";

test("idioma vem das preferências do aparelho, na ordem", () => {
  assert.equal(resolverIdioma(["pt-BR"]), "pt-BR");
  assert.equal(resolverIdioma(["pt-PT"]), "pt-BR");
  assert.equal(resolverIdioma(["es-MX", "en-US"]), "es");
  assert.equal(resolverIdioma(["fr-FR", "es_AR"]), "es");
  assert.equal(resolverIdioma(["en-GB"]), "en");
});

test("idioma sem tradução cai no inglês", () => {
  assert.equal(resolverIdioma(["fr-FR", "de-DE"]), "en");
  assert.equal(resolverIdioma([]), "en");
});

test("validação do valor salvo nas preferências", () => {
  assert.equal(ehIdioma("es"), true);
  assert.equal(ehIdioma("fr"), false);
  assert.equal(ehIdioma(undefined), false);
});

test("nenhum texto vazio em nenhum idioma", () => {
  for (const idioma of IDIOMAS) {
    const t = dominio(idioma);
    const pilha: unknown[] = [t];
    while (pilha.length) {
      const v = pilha.pop();
      if (typeof v === "string") assert.ok(v.trim().length > 0, `${idioma}: texto vazio`);
      else if (v && typeof v === "object") pilha.push(...Object.values(v));
    }
  }
});
