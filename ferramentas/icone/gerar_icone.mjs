// Gera os ícones do app (folha de registro com a gota do mascote) a partir de SVG.
//
// Uso (na raiz, Windows com Microsoft Edge):
//   node ferramentas/icone/gerar_icone.mjs
//
// Grava os SVGs em ferramentas/icone/ (fonte versionada) e os PNGs em apps/mobile/assets/,
// rasterizados pelo Edge sem interface. Não editar os PNGs à mão: mudar aqui e gerar de novo.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(AQUI, "../../apps/mobile/assets");

// Cores do app (apps/mobile/src/lib/tema.ts) e do mascote.
const COR = {
  fundoClaro: "#E3EEFA",
  fundoEscuro: "#C7DCF2",
  folha: "#FFFFFF",
  linha: "#D3E1F1",
  primaria: "#2F5F96",
  rosa: "#E58AA8",
  slime: "#79AEE0",
  slimeSombra: "#4C82BE",
  tinta: "#1B2A40",
};

/** Gota do mascote (mesmo desenho do site e do PDF), em coordenadas 0–24. */
const GOTA = "M12 3C8.2 3 4 9 4 14c0 4.4 3.6 7 8 7s8-2.6 8-7c0-5-4.2-11-8-11z";

/** Desenho em coordenadas 0–100: prancheta com linhas de registro e a gota no canto. */
function desenho({ monocromatico = false } = {}) {
  if (monocromatico) {
    // Ícone temático do Android: uma cor só; o sistema aplica o tom do tema.
    return (
      `<rect x="14" y="8" width="58" height="80" rx="8" fill="none" stroke="#fff" stroke-width="5"/>` +
      `<rect x="31" y="2" width="24" height="11" rx="4" fill="#fff"/>` +
      [30, 43, 56].map((y) => `<rect x="25" y="${y}" width="36" height="5" rx="2.5" fill="#fff"/>`).join("") +
      `<g transform="translate(55 52) scale(1.9)"><path d="${GOTA}" fill="#fff"/></g>`
    );
  }
  const linhas = [30, 43, 56, 69]
    .map((y, i) =>
      i === 0
        ? `<rect x="25" y="${y}" width="6" height="5" rx="2.5" fill="${COR.rosa}"/><rect x="34" y="${y}" width="27" height="5" rx="2.5" fill="${COR.linha}"/>`
        : `<rect x="25" y="${y}" width="${i === 3 ? 22 : 36}" height="5" rx="2.5" fill="${COR.linha}"/>`,
    )
    .join("");
  return (
    `<defs><filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="${COR.tinta}" flood-opacity="0.18"/></filter></defs>` +
    `<rect x="14" y="8" width="58" height="80" rx="8" fill="${COR.folha}" filter="url(#s)"/>` +
    `<rect x="31" y="2" width="24" height="11" rx="4" fill="${COR.primaria}"/>` +
    linhas +
    `<g transform="translate(55 52) scale(1.9)" filter="url(#s)">` +
    `<path d="${GOTA}" fill="${COR.slime}" stroke="${COR.slimeSombra}" stroke-width=".6"/>` +
    `<ellipse cx="9" cy="8.6" rx="1.6" ry="1" fill="#fff" opacity=".7" transform="rotate(-35 9 8.6)"/>` +
    `<circle cx="9.4" cy="14.2" r="1.2" fill="${COR.tinta}"/><circle cx="14.6" cy="14.2" r="1.2" fill="${COR.tinta}"/>` +
    `<path d="M10.8 16.7q.6.7 1.2 0q.6.7 1.2 0" fill="none" stroke="${COR.tinta}" stroke-width=".7" stroke-linecap="round"/>` +
    `</g>`
  );
}

/**
 * SVG 1024 × 1024. `escala` é o lado do desenho em px: o ícone do iOS usa a tela quase toda; o
 * primeiro plano adaptativo do Android fica dentro do círculo seguro (66 de 108 dp ≈ 625 px).
 */
function svg({ fundo, escala, monocromatico = false }) {
  const desloc = (1024 - escala) / 2;
  const camadaFundo = fundo
    ? `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COR.fundoClaro}"/><stop offset="1" stop-color="${COR.fundoEscuro}"/></linearGradient></defs><rect width="1024" height="1024" fill="url(#f)"/>`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">` +
    camadaFundo +
    (escala > 0 ? `<g transform="translate(${desloc} ${desloc}) scale(${escala / 100})">${desenho({ monocromatico })}</g>` : "") +
    `</svg>`
  );
}

const SAIDAS = {
  // iOS e ícone padrão: sem transparência.
  icon: svg({ fundo: true, escala: 700 }),
  // Android adaptativo: o fundo e o primeiro plano são camadas separadas.
  "android-icon-background": svg({ fundo: true, escala: 0 }),
  "android-icon-foreground": svg({ fundo: false, escala: 500 }),
  "android-icon-monochrome": svg({ fundo: false, escala: 500, monocromatico: true }),
};

/** Regrava o PNG em RGB de 24 bits: a App Store recusa ícone com canal alfa, mesmo opaco. */
function semAlfa(png) {
  const script =
    "Add-Type -AssemblyName System.Drawing; " +
    `$o = [System.Drawing.Bitmap]::new('${png}'); ` +
    "$n = [System.Drawing.Bitmap]::new($o.Width, $o.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb); " +
    "$g = [System.Drawing.Graphics]::FromImage($n); $g.DrawImage($o, 0, 0, $o.Width, $o.Height); $g.Dispose(); $o.Dispose(); " +
    `$n.Save('${png}', [System.Drawing.Imaging.ImageFormat]::Png); $n.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", script], { stdio: "ignore" });
}

function edge() {
  const candidatos = [
    join(process.env["ProgramFiles(x86)"] ?? "", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "", "Microsoft/Edge/Application/msedge.exe"),
  ];
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error("Microsoft Edge não encontrado (usado para rasterizar os SVGs).");
  return achado;
}

const temp = mkdtempSync(join(tmpdir(), "afetilu-icone-"));
try {
  const navegador = edge();
  for (const [nome, conteudo] of Object.entries(SAIDAS)) {
    writeFileSync(join(AQUI, `${nome}.svg`), conteudo);
    const html = join(temp, `${nome}.html`);
    writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent">${conteudo}</body></html>`);
    execFileSync(navegador, [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      `--user-data-dir=${join(temp, "perfil")}`,
      "--default-background-color=00000000",
      "--window-size=1024,1024",
      `--screenshot=${join(ASSETS, `${nome}.png`)}`,
      pathToFileURL(html).href,
    ], { stdio: "ignore" });
    if (nome === "icon") semAlfa(join(ASSETS, `${nome}.png`));
    process.stdout.write(`${nome}.png\n`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
