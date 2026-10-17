// Gera o site estático em dist/ (publicado pela Vercel; ver vercel.json na raiz).
// Roda direto no Node 24 (remoção de tipos), sem dependências.

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAMINHO_POLITICA, caminhoInicial, SITE } from "./config.ts";
import { esc, paginaInicial, paginaPolitica } from "./paginas.ts";
import { IDIOMAS_SITE } from "./textos/tipo.ts";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");

/** Caminho do site ("/en/privacy") → arquivo ("dist/en/privacy/index.html"). */
function gravar(caminho: string, html: string): void {
  const pasta = join(DIST, ...caminho.split("/").filter(Boolean));
  mkdirSync(pasta, { recursive: true });
  writeFileSync(join(pasta, "index.html"), html);
}

export function gerarSite(): string[] {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  cpSync(join(RAIZ, "publico"), DIST, { recursive: true });

  const caminhos: string[] = [];
  for (const idioma of IDIOMAS_SITE) {
    gravar(caminhoInicial(idioma), paginaInicial(idioma));
    gravar(CAMINHO_POLITICA[idioma], paginaPolitica(idioma));
    caminhos.push(caminhoInicial(idioma), CAMINHO_POLITICA[idioma]);
  }

  writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      caminhos.map((c) => `  <url><loc>${esc(SITE.url + c)}</loc></url>`).join("\n") +
      `\n</urlset>\n`,
  );
  return caminhos;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const caminhos = gerarSite();
  process.stdout.write(`Site gerado em dist/: ${caminhos.length} páginas.\n`);
}
