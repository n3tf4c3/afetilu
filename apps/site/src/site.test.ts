import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CAMINHO_POLITICA, SITE } from "./config.ts";
import { BANDEIRAS, esc, nomeDaCaptura, paginaInicial, paginaPolitica } from "./paginas.ts";
import { textosDoSite } from "./textos/index.ts";
import { IDIOMAS_SITE } from "./textos/tipo.ts";

const PUBLICO = join(dirname(fileURLToPath(import.meta.url)), "..", "publico");
const paginas = IDIOMAS_SITE.flatMap((i) => [
  { idioma: i, nome: `inicial ${i}`, html: paginaInicial(i) },
  { idioma: i, nome: `política ${i}`, html: paginaPolitica(i) },
]);

test("nenhum script, cookie, fonte ou recurso de terceiros", () => {
  for (const p of paginas) {
    assert.ok(!/<script/i.test(p.html), `${p.nome}: script`);
    assert.ok(!/<iframe/i.test(p.html), `${p.nome}: iframe`);
    // Recursos carregados pela página (src, stylesheet, ícone) só do próprio site.
    for (const [, url] of p.html.matchAll(/\ssrc="([^"]+)"/g)) assert.ok(url!.startsWith("/"), `${p.nome}: src externo ${url}`);
    for (const [, url] of p.html.matchAll(/<link rel="(?:stylesheet|icon)" href="([^"]+)"/g)) assert.ok(url!.startsWith("/"), `${p.nome}: ${url}`);
    // Links externos permitidos: o repositório, a página de doações e, depois da publicação, as lojas.
    const permitidos = [SITE.repositorio, SITE.url, SITE.apoio, SITE.lojas.googlePlay, SITE.lojas.appStore].filter((x): x is string => !!x);
    for (const [, url] of p.html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      assert.ok(permitidos.some((x) => url!.startsWith(x)), `${p.nome}: link externo ${url}`);
    }
  }
});

test("idioma declarado e seletor apontando para os outros idiomas", () => {
  for (const p of paginas) {
    assert.ok(p.html.includes(`<html lang="${p.idioma}">`), p.nome);
    for (const outro of IDIOMAS_SITE.filter((i) => i !== p.idioma)) assert.ok(p.html.includes(`hreflang="${outro}" lang="${outro}"`), p.nome);
  }
});

test("todas as capturas referenciadas existem em publico/", () => {
  for (const idioma of IDIOMAS_SITE) {
    for (const r of textosDoSite(idioma).recursos) {
      assert.ok(existsSync(join(PUBLICO, nomeDaCaptura(r.imagem, idioma))), `${idioma}: ${r.imagem}`);
    }
  }
});

test("a página inicial leva à política de privacidade do mesmo idioma", () => {
  for (const idioma of IDIOMAS_SITE) assert.ok(paginaInicial(idioma).includes(`href="${CAMINHO_POLITICA[idioma]}"`), idioma);
});

test("SAMU (192) só em pt-BR; nos outros idiomas, o número de emergência local", () => {
  assert.ok(paginaInicial("pt-BR").includes("192 (SAMU)"));
  for (const idioma of ["en", "es"] as const) {
    assert.ok(!/SAMU|\b192\b/.test(paginaInicial(idioma)), idioma);
  }
});

test("antes da publicação: 'em breve', sem selos nem aviso de marcas", () => {
  if (SITE.lojas.googlePlay || SITE.lojas.appStore) return;
  for (const idioma of IDIOMAS_SITE) {
    const html = paginaInicial(idioma);
    assert.ok(html.includes(esc(textosDoSite(idioma).lojas.emBreve)), idioma);
    assert.ok(!html.includes('class="selos"'), idioma);
    assert.ok(!html.includes(esc(textosDoSite(idioma).rodape.marcas)), idioma);
  }
});

test("cada idioma do seletor tem bandeira decorativa e o nome escrito", () => {
  for (const p of paginas) {
    for (const i of IDIOMAS_SITE) {
      assert.ok(p.html.includes(`${BANDEIRAS[i]}${esc(textosDoSite(i).nomeDoIdioma)}`), `${p.nome}: ${i}`);
    }
  }
  for (const i of IDIOMAS_SITE) assert.ok(BANDEIRAS[i].includes('aria-hidden="true"'), i);
});

test("link de doações só no rodapé e só quando configurado", () => {
  for (const p of paginas) {
    const vezes = SITE.apoio ? p.html.split(`href="${esc(SITE.apoio)}"`).length - 1 : 0;
    assert.equal(vezes, SITE.apoio ? 1 : 0, p.nome);
    if (SITE.apoio) assert.ok(p.html.indexOf(SITE.apoio) > p.html.indexOf('<footer class="rodape">'), p.nome);
  }
});

test("texto é escapado", () => {
  assert.equal(esc(`<a href="x">'&'</a>`), "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
});

test("e-mail de contato só aparece quando configurado", () => {
  for (const idioma of IDIOMAS_SITE) {
    const html = paginaPolitica(idioma);
    if (SITE.contato) assert.ok(html.includes(`href="mailto:${esc(SITE.contato)}"`), idioma);
    else assert.ok(!html.includes("mailto:"), idioma);
  }
});
