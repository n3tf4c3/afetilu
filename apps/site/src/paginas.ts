// Páginas do site: HTML estático, sem JavaScript, sem cookies, sem fontes ou scripts de terceiros.
// Todo texto passa por esc(); as imagens são locais e as capturas mostram só dados fictícios.

import { CAMINHO_POLITICA, caminhoInicial, SITE } from "./config.ts";
import { textosDoSite } from "./textos/index.ts";
import { IDIOMAS_SITE, type IdiomaSite, type TextosSite } from "./textos/tipo.ts";

export function esc(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Ícone do app (o mesmo das lojas, gerado por ferramentas/icone), só decorativo: o nome vem ao lado. */
export const ICONE_APP = '<img class="marca-icone" src="/favicon.svg" alt="" width="36" height="36">';

/** Listras vermelhas da bandeira dos EUA: 13 listras numa altura de 20, as pares em vermelho. */
const LISTRAS_EUA = Array.from({ length: 7 }, (_, k) => `<rect y="${((k * 2 * 20) / 13).toFixed(2)}" width="30" height="1.54" fill="#B22234"/>`).join("");

/**
 * Bandeira ao lado do nome de cada idioma no seletor (o nome continua escrito: a bandeira é só
 * decorativa). SVG embutido em 3:2, porque o Windows não desenha bandeiras em emoji.
 */
export const BANDEIRAS: Record<IdiomaSite, string> = {
  "pt-BR":
    '<svg class="bandeira" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#009C3B"/>' +
    '<path d="M15 2.4 27.6 10 15 17.6 2.4 10z" fill="#FFDF00"/><circle cx="15" cy="10" r="5.2" fill="#002776"/>' +
    '<path d="M10 9.1q5.2-1.4 9.9 1.6" fill="none" stroke="#fff" stroke-width=".9"/></svg>',
  en:
    `<svg class="bandeira" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/>${LISTRAS_EUA}` +
    '<rect width="12" height="10.77" fill="#3C3B6E"/></svg>',
  // Espanhol neutro, latino-americano (o mesmo do app e da ficha es-MX): bandeira do México.
  es:
    '<svg class="bandeira" viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/>' +
    '<rect width="10" height="20" fill="#006847"/><rect x="20" width="10" height="20" fill="#CE1126"/>' +
    '<ellipse cx="15" cy="10" rx="2.6" ry="2.9" fill="#8C5A2B"/></svg>',
};

const LOGO_APPLE =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>';
const LOGO_PLAY =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.2 2.6c-.3.3-.4.7-.4 1.2v16.4c0 .5.1.9.4 1.2l9.3-9.4L4.2 2.6zm10.6 10.7 2.9 2.9-11.2 6.4c-.4.2-.8.3-1.1.2l9.4-9.5zm4.2-3.6 2.4 1.4c.8.5.8 1.3 0 1.8L19 14.3l-3-3.3 3-3.3zM5.4 1.7c.3-.1.7 0 1.1.2l11.2 6.4-2.9 2.9-9.4-9.5z"/></svg>';

const temLoja = () => SITE.lojas.googlePlay !== null || SITE.lojas.appStore !== null;

function selo(href: string, logo: string, topo: string, loja: string, claro: boolean): string {
  return (
    `<a class="selo${claro ? " selo-claro" : ""}" href="${esc(href)}" rel="noopener noreferrer">` +
    `${logo}<span><small>${esc(topo)}</small><strong>${esc(loja)}</strong></span></a>`
  );
}

/** Selos das lojas publicadas ou, antes da publicação, o aviso de "em breve". */
function lojas(t: TextosSite, claro = false): string {
  if (!temLoja()) return `<p class="em-breve">${esc(t.lojas.emBreve)}</p>`;
  const selos = [
    SITE.lojas.appStore ? selo(SITE.lojas.appStore, LOGO_APPLE, t.lojas.appStoreTopo, "App Store", claro) : "",
    SITE.lojas.googlePlay ? selo(SITE.lojas.googlePlay, LOGO_PLAY, t.lojas.googlePlayTopo, "Google Play", claro) : "",
  ];
  return `<div class="selos">${selos.join("")}</div>`;
}

export const nomeDaCaptura = (imagem: string, idioma: IdiomaSite) => `/telas/${imagem}-${idioma}.jpg`;
/**
 * Tamanho das capturas em publico/telas: telas do app sem as barras do sistema (1080 × 2178 reduzido à
 * metade) e a primeira página do PDF, em proporção A4.
 */
export const tamanhoDaCaptura = (imagem: string) =>
  imagem === "pdf" ? ({ largura: 540, altura: 763, classe: "recurso recurso-doc" } as const) : ({ largura: 540, altura: 1089, classe: "recurso" } as const);

type Pagina = "inicial" | "politica";
const caminhoDe = (pagina: Pagina, idioma: IdiomaSite) => (pagina === "inicial" ? caminhoInicial(idioma) : CAMINHO_POLITICA[idioma]);

function documento(o: { idioma: IdiomaSite; pagina: Pagina; titulo: string; descricao: string; corpo: string }): string {
  const t = textosDoSite(o.idioma);
  const alternativas = IDIOMAS_SITE.map(
    (i) => `<link rel="alternate" hreflang="${i}" href="${SITE.url}${caminhoDe(o.pagina, i)}">`,
  ).join("\n");
  const seletor = IDIOMAS_SITE.map((i) =>
    i === o.idioma
      ? `<li><span class="atual" aria-current="true">${BANDEIRAS[i]}${esc(textosDoSite(i).nomeDoIdioma)}</span></li>`
      : `<li><a href="${caminhoDe(o.pagina, i)}" hreflang="${i}" lang="${i}">${BANDEIRAS[i]}${esc(textosDoSite(i).nomeDoIdioma)}</a></li>`,
  ).join("");
  return `<!doctype html>
<html lang="${o.idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.titulo)}</title>
<meta name="description" content="${esc(o.descricao)}">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#FAF7F2">
<link rel="canonical" href="${SITE.url}${caminhoDe(o.pagina, o.idioma)}">
${alternativas}
<link rel="alternate" hreflang="x-default" href="${SITE.url}${caminhoDe(o.pagina, "pt-BR")}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(o.titulo)}">
<meta property="og:description" content="${esc(o.descricao)}">
<meta property="og:url" content="${SITE.url}${caminhoDe(o.pagina, o.idioma)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/estilo.css">
</head>
<body>
<a class="pular" href="#conteudo">${esc(t.nav.pularParaConteudo)}</a>
<header class="topo">
  <a class="marca" href="${caminhoInicial(o.idioma)}">${ICONE_APP}<span>Afetilu</span></a>
  <div class="topo-acoes">
    <nav aria-label="${esc(t.nav.idiomas)}"><ul class="idiomas">${seletor}</ul></nav>
    ${temLoja() ? `<a class="botao" href="${caminhoInicial(o.idioma)}#baixar">${esc(t.nav.baixar)}</a>` : ""}
  </div>
</header>
<main id="conteudo">
${o.corpo}
</main>
<footer class="rodape">
  <div class="rodape-linha">
    <div class="rodape-marca">
      <p class="marca">${ICONE_APP}<span>Afetilu</span></p>
      <p>${esc(t.rodape.descricao)}</p>
    </div>
    ${lojas(t, true)}
  </div>
  <div class="rodape-base">
    <p>© 2026 Afetilu. ${esc(t.rodape.licenca)}${temLoja() ? `<br><small>${esc(t.rodape.marcas)}</small>` : ""}</p>
    <ul>
      <li><a href="${caminhoInicial(o.idioma)}">${esc(t.nav.inicio)}</a></li>
      <li><a href="${CAMINHO_POLITICA[o.idioma]}">${esc(t.nav.privacidade)}</a></li>
      <li><a href="${SITE.repositorio}" rel="noopener noreferrer">${esc(t.rodape.codigo)}</a></li>
      ${SITE.contato ? `<li><a href="mailto:${esc(SITE.contato)}">${esc(t.rodape.contato)}</a></li>` : ""}
      ${SITE.apoio ? `<li><a class="apoio" href="${esc(SITE.apoio)}" rel="noopener noreferrer">${esc(t.rodape.apoiar)}</a></li>` : ""}
    </ul>
  </div>
</footer>
</body>
</html>
`;
}

export function paginaInicial(idioma: IdiomaSite): string {
  const t = textosDoSite(idioma);
  const recursos = t.recursos
    .map((r) => {
      const tam = tamanhoDaCaptura(r.imagem);
      return (
        `<figure class="${tam.classe}"><img src="${nomeDaCaptura(r.imagem, idioma)}" alt="${esc(t.capturaAlt(r.titulo))}" ` +
        `width="${tam.largura}" height="${tam.altura}" loading="lazy" decoding="async">` +
        `<figcaption><strong>${esc(r.titulo)}</strong>${esc(r.descricao)}</figcaption></figure>`
      );
    })
    .join("\n");
  const corpo = `
<section class="hero">
  <p class="selo-topo">${esc(t.hero.selo)}</p>
  <h1>${esc(t.hero.titulo)}</h1>
  <p class="subtitulo">${esc(t.hero.subtitulo)}</p>
  <div id="baixar" class="baixar">${lojas(t)}</div>
  <p class="gratuito">${esc(t.hero.gratuito)}</p>
</section>
<section class="recursos" aria-labelledby="titulo-recursos">
  <h2 id="titulo-recursos">${esc(t.recursosTitulo)}</h2>
  <div class="grade">
${recursos}
  </div>
</section>
<section class="faixa">
  <div class="cartao">
    <h2>${esc(t.privacidade.titulo)}</h2>
    <ul class="lista">${t.privacidade.itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
    <p><a href="${CAMINHO_POLITICA[idioma]}">${esc(t.privacidade.link)}</a></p>
  </div>
  <div class="cartao">
    <h2>${esc(t.limites.titulo)}</h2>
    <p>${esc(t.limites.texto)}</p>
    <p class="emergencia">${esc(t.limites.emergencia)}</p>
  </div>
  <div class="cartao">
    <h2>${esc(t.codigoAberto.titulo)}</h2>
    <p>${esc(t.codigoAberto.texto)}</p>
    <p><a href="${SITE.repositorio}" rel="noopener noreferrer">${esc(t.codigoAberto.link)}</a></p>
  </div>
</section>`;
  return documento({ idioma, pagina: "inicial", titulo: t.meta.titulo, descricao: t.meta.descricao, corpo });
}

export function paginaPolitica(idioma: IdiomaSite): string {
  const t = textosDoSite(idioma);
  const p = t.politica;
  const secoes = p.secoes
    .map((s) => `<section><h2>${esc(s.titulo)}</h2>${s.paragrafos.map((x) => `<p>${esc(x)}</p>`).join("")}</section>`)
    .join("\n");
  const contato =
    `<p><a href="${SITE.repositorio}/issues" rel="noopener noreferrer">${esc(SITE.repositorio.replace("https://", ""))}</a></p>` +
    (SITE.contato ? `<p>${esc(p.contatoEmail)} <a href="mailto:${esc(SITE.contato)}">${esc(SITE.contato)}</a></p>` : "");
  const corpo = `
<article class="politica">
  <h1>${esc(p.titulo)}</h1>
  <p class="data">${esc(p.atualizadaEm)}</p>
  <p class="introducao">${esc(p.introducao)}</p>
${secoes}
${contato}
</article>`;
  return documento({ idioma, pagina: "politica", titulo: t.meta.tituloPolitica, descricao: p.introducao, corpo });
}
