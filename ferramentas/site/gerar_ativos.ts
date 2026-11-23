// Gera ativos estáticos do site a partir do próprio código do app e SVGs:
// - apps/site/publico/og-{pt-BR,en,es}.png (1200×630, prévia para WhatsApp/redes sociais)
// - apps/site/publico/exemplos/resumo-{pt-BR,en,es}.pdf (PDF real com dados fictícios da Lia)
// - apps/site/publico/telas/pdf-{pt-BR,en,es}.jpg (540×763, primeira página do PDF da Lia para o site)
//
// Uso (na raiz, Windows com Microsoft Edge):
//   pnpm exec tsx ferramentas/site/gerar_ativos.ts

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CATEGORIAS, chaveDoDia, dominio, montarResumo, novoRegistro, somarDias, type Idioma } from "../../packages/core/src/index.ts";
import { textos } from "../../apps/mobile/src/i18n/index.ts";
import { gerarDadosFicticios } from "../../apps/mobile/src/lib/dados-ficticios.ts";
import { montarResumoHtml } from "../../apps/mobile/src/lib/resumo-html.ts";

const AQUI = dirname(fileURLToPath(import.meta.url));
const PUBLICO = resolve(AQUI, "../../apps/site/publico");
const EXEMPLOS = join(PUBLICO, "exemplos");
const TELAS = join(PUBLICO, "telas");

const COR = {
  fundoClaro: "#E3EEFA",
  fundoEscuro: "#C7DCF2",
  folha: "#FFFFFF",
  linha: "#D3E1F1",
  primaria: "#2F5F96",
  rosa: "#E58AA8",
  rosaTexto: "#A8345E",
  slime: "#79AEE0",
  slimeSombra: "#4C82BE",
  tinta: "#1B2A40",
  suave: "#4F5A6B",
};

const GOTA = "M12 3C8.2 3 4 9 4 14c0 4.4 3.6 7 8 7s8-2.6 8-7c0-5-4.2-11-8-11z";

const TEXTOS_OG: Record<Idioma, { selo: string; titulo1: string; titulo2: string; rodape: string; apelido: string }> = {
  "pt-BR": {
    selo: "DIÁRIO PARA AUTISMO (TEA) E CONSULTAS",
    titulo1: "O dia a dia anotado com calma,",
    titulo2: "em PDF pronto para a consulta.",
    rodape: "Gratuito · Sem conta · Sem anúncios · Dados só no aparelho",
    apelido: "Lia",
  },
  en: {
    selo: "AUTISM (ASD) CAREGIVER JOURNAL",
    titulo1: "Day-to-day life noted calmly,",
    titulo2: "in a PDF ready for appointments.",
    rodape: "Free · No account · No ads · Data stays on your device",
    apelido: "Lia",
  },
  es: {
    selo: "DIARIO DE AUTISMO (TEA) Y CONSULTAS",
    titulo1: "El día a día anotado con calma,",
    titulo2: "en PDF listo para la consulta.",
    rodape: "Gratuita · Sin cuenta · Sin anuncios · Datos solo en el dispositivo",
    apelido: "Lía",
  },
};

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function svgOg(idioma: Idioma): string {
  const tx = TEXTOS_OG[idioma];
  const linhas = [30, 43, 56, 69]
    .map((y, i) =>
      i === 0
        ? `<rect x="25" y="${y}" width="6" height="5" rx="2.5" fill="${COR.rosa}"/><rect x="34" y="${y}" width="27" height="5" rx="2.5" fill="${COR.linha}"/>`
        : `<rect x="25" y="${y}" width="${i === 3 ? 22 : 36}" height="5" rx="2.5" fill="${COR.linha}"/>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">` +
    `<defs>` +
    `<linearGradient id="f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COR.fundoClaro}"/><stop offset="1" stop-color="${COR.fundoEscuro}"/></linearGradient>` +
    `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${COR.tinta}" flood-opacity="0.16"/></filter>` +
    `</defs>` +
    `<rect width="1200" height="630" fill="url(#f)"/>` +
    `<rect x="52" y="52" width="1096" height="526" rx="32" fill="#FFFFFF" fill-opacity="0.92"/>` +
    `<g transform="translate(96 150) scale(2.8)">` +
    `<rect x="14" y="8" width="58" height="80" rx="8" fill="${COR.folha}" filter="url(#s)"/>` +
    `<rect x="31" y="2" width="24" height="11" rx="4" fill="${COR.primaria}"/>` +
    linhas +
    `<g transform="translate(55 52) scale(1.9)" filter="url(#s)">` +
    `<path d="${GOTA}" fill="${COR.slime}" stroke="${COR.slimeSombra}" stroke-width=".6"/>` +
    `<ellipse cx="9" cy="8.6" rx="1.6" ry="1" fill="#fff" opacity=".7" transform="rotate(-35 9 8.6)"/>` +
    `<circle cx="9.4" cy="14.2" r="1.2" fill="${COR.tinta}"/><circle cx="14.6" cy="14.2" r="1.2" fill="${COR.tinta}"/>` +
    `<path d="M10.8 16.7q.6.7 1.2 0q.6.7 1.2 0" fill="none" stroke="${COR.tinta}" stroke-width=".7" stroke-linecap="round"/>` +
    `</g></g>` +
    `<text x="396" y="182" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="2.2" fill="${COR.rosaTexto}">${esc(tx.selo)}</text>` +
    `<text x="396" y="252" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="68" font-weight="800" letter-spacing="-1.5" fill="${COR.tinta}">Afetilu</text>` +
    `<rect x="396" y="274" width="96" height="7" rx="3.5" fill="${COR.rosa}"/>` +
    `<text x="396" y="344" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="${COR.primaria}">${esc(tx.titulo1)}</text>` +
    `<text x="396" y="396" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="38" font-weight="700" fill="${COR.primaria}">${esc(tx.titulo2)}</text>` +
    `<text x="396" y="492" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="600" fill="${COR.suave}">${esc(tx.rodape)}</text>` +
    `</svg>`
  );
}

/** Converte PNG para JPEG (qualidade 92) e redimensiona para a largura/altura desejadas. */
function salvarJpg(origemPng: string, destinoJpg: string, largura: number, altura: number): void {
  const script =
    "Add-Type -AssemblyName System.Drawing; " +
    `$o = [System.Drawing.Bitmap]::new('${origemPng}'); ` +
    `$n = [System.Drawing.Bitmap]::new(${largura}, ${altura}); ` +
    "$g = [System.Drawing.Graphics]::FromImage($n); " +
    "$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; " +
    "$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality; " +
    `$g.DrawImage($o, 0, 0, ${largura}, ${altura}); $g.Dispose(); $o.Dispose(); ` +
    "$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }; " +
    "$enc = New-Object System.Drawing.Imaging.EncoderParameters(1); " +
    "$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L); " +
    `$n.Save('${destinoJpg}', $codec, $enc); $n.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", script], { stdio: "ignore" });
}

function edge(): string {
  const candidatos = [
    join(process.env["ProgramFiles(x86)"] ?? "", "Microsoft/Edge/Application/msedge.exe"),
    join(process.env.ProgramFiles ?? "", "Microsoft/Edge/Application/msedge.exe"),
  ];
  const achado = candidatos.find((c) => existsSync(c));
  if (!achado) throw new Error("Microsoft Edge não encontrado.");
  return achado;
}

const navegador = edge();
const temp = mkdtempSync(join(tmpdir(), "afetilu-site-ativos-"));
const hoje = new Date(2026, 9, 14, 18, 0);
const hojeChave = chaveDoDia(hoje);
const inicio = somarDias(hojeChave, -29);

try {
  mkdirSync(EXEMPLOS, { recursive: true });
  mkdirSync(TELAS, { recursive: true });
  for (const idioma of ["pt-BR", "en", "es"] as const) {
    // 1. Imagem OG 1200×630
    const ogHtml = join(temp, `og-${idioma}.html`);
    writeFileSync(ogHtml, `<!doctype html><html><body style="margin:0;padding:0;overflow:hidden">${svgOg(idioma)}</body></html>`);
    execFileSync(
      navegador,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--user-data-dir=${join(temp, "perfil")}`,
        "--window-size=1200,630",
        `--screenshot=${join(PUBLICO, `og-${idioma}.png`)}`,
        pathToFileURL(ogHtml).href,
      ],
      { stdio: "ignore" },
    );
    process.stdout.write(`og-${idioma}.png\n`);

    // 2. PDF real de exemplo com dados fictícios da Lia
    const fict = gerarDadosFicticios("pessoa-exemplo", hoje, 14, idioma);
    const registros = fict.registros.map((e, i) => novoRegistro(e, `r${i + 1}`, e.ocorreuEm));
    const resumo = montarResumo({
      inicio,
      fim: hojeChave,
      categorias: CATEGORIAS,
      registros,
      diasAnotados: fict.diasSemCrises.map((dia) => ({
        pessoaId: "pessoa-exemplo",
        dia,
        semCrises: true,
        lancadoEm: hoje.toISOString(),
      })),
      mudancas: fict.mudancas.map((m, i) => ({
        id: `m${i + 1}`,
        pessoaId: "pessoa-exemplo",
        dia: m.dia,
        texto: m.texto,
        lancadoEm: hoje.toISOString(),
      })),
      perguntas: fict.perguntas.map((texto, i) => ({
        id: `q${i + 1}`,
        pessoaId: "pessoa-exemplo",
        texto,
        criadaEm: hoje.toISOString(),
      })),
    });
    const htmlResumo = montarResumoHtml({
      resumo,
      apelido: TEXTOS_OG[idioma].apelido,
      geradoEm: hoje,
      d: dominio(idioma),
      t: textos(idioma).t,
      idioma,
    });
    const pdfHtml = join(temp, `resumo-${idioma}.html`);
    writeFileSync(pdfHtml, htmlResumo);
    execFileSync(
      navegador,
      [
        "--headless=new",
        "--disable-gpu",
        `--user-data-dir=${join(temp, "perfil")}`,
        "--no-pdf-header-footer",
        `--print-to-pdf=${join(EXEMPLOS, `resumo-${idioma}.pdf`)}`,
        pathToFileURL(pdfHtml).href,
      ],
      { stdio: "ignore" },
    );
    process.stdout.write(`exemplos/resumo-${idioma}.pdf\n`);

    // 3. Imagem A4 da 1ª página do PDF (540×763) para o site (apps/site/publico/telas/pdf-*.jpg)
    const paginaHtml = join(temp, `pdf-pagina-${idioma}.html`);
    writeFileSync(
      paginaHtml,
      htmlResumo.replace(
        "</style>",
        `body{padding:36px 48px 0;width:794px;height:1123px;overflow:hidden;position:relative}` +
          `.conteudo{gap:12px}` +
          `.cartao,section.bloco:nth-of-type(n+5){display:none}` +
          `.rodape{position:absolute;bottom:0;left:48px;right:48px;padding:10px 0 26px;background:#ffffff}</style>`,
      ),
    );
    const pngTmp = join(temp, `pdf-pagina-${idioma}.png`);
    execFileSync(
      navegador,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        `--user-data-dir=${join(temp, "perfil")}`,
        "--window-size=794,1123",
        `--screenshot=${pngTmp}`,
        pathToFileURL(paginaHtml).href,
      ],
      { stdio: "ignore" },
    );
    salvarJpg(pngTmp, join(TELAS, `pdf-${idioma}.jpg`), 540, 763);
    process.stdout.write(`telas/pdf-${idioma}.jpg\n`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
