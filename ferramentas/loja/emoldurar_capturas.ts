// Emoldura capturas para as lojas (Google Play 1080×1920) com títulos curtos de benefício
// acima da tela do app, colocando o resumo em PDF da Lia em destaque.
//
// Modo padrão (sem argumento): atualiza a captura do PDF em apps/mobile/store-assets/capturas/{idioma}/04-pdf.jpg
// usando a primeira página limpa gerada em apps/site/publico/telas/pdf-{idioma}.jpg.
//
// Modo completo (com capturas cruas em ferramentas/loja/cruas/{pt-BR,en,es}/{inicio,linha,resumo}.png):
//   pnpm exec tsx ferramentas/loja/emoldurar_capturas.ts --todas
//   Gera as 4 capturas numeradas com o PDF em 1º lugar (01-pdf, 02-inicio, 03-linha-do-tempo, 04-resumo).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

type Idioma = "pt-BR" | "en" | "es";
type Slot = "pdf" | "inicio" | "linha" | "resumo";

const AQUI = dirname(fileURLToPath(import.meta.url));
const CAPTURAS = resolve(AQUI, "../../apps/mobile/store-assets/capturas");
const SITE_TELAS = resolve(AQUI, "../../apps/site/publico/telas");
const CRUAS = join(AQUI, "cruas");

const LEGENDAS: Record<Idioma, Record<Slot, { titulo: string; subtitulo: string }>> = {
  "pt-BR": {
    pdf: { titulo: "PDF pronto para a consulta", subtitulo: "Resumo descritivo de dias, crises e conquistas" },
    inicio: { titulo: "Anote o dia em poucos toques", subtitulo: "Alimentação, sono, dor, emoções e momentos positivos" },
    linha: { titulo: "Linha do tempo honesta", subtitulo: "Sem registro nunca vira “sem crises” · Busca rápida" },
    resumo: { titulo: "Período livre e suas perguntas", subtitulo: "Gratuito, sem conta e com dados só no aparelho" },
  },
  en: {
    pdf: { titulo: "PDF ready for appointments", subtitulo: "Descriptive summary of days, episodes and wins" },
    inicio: { titulo: "Log the day in a few taps", subtitulo: "Meals, sleep, pain, feelings and positive moments" },
    linha: { titulo: "An honest timeline", subtitulo: "Missing days stay “no information” · Quick search" },
    resumo: { titulo: "Custom dates & your questions", subtitulo: "Free, no account, and data stays on your device" },
  },
  es: {
    pdf: { titulo: "PDF listo para la consulta", subtitulo: "Resumen descriptivo de días, crisis y logros" },
    inicio: { titulo: "Anota el día en pocos toques", subtitulo: "Comidas, sueño, dolor, emociones y momentos positivos" },
    linha: { titulo: "Línea de tiempo honesta", subtitulo: "Sin registro nunca es “sin crisis” · Búsqueda rápida" },
    resumo: { titulo: "Período libre y tus preguntas", subtitulo: "Gratuita, sin cuenta y datos solo en tu dispositivo" },
  },
};

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

function salvarJpg(origemPng: string, destinoJpg: string): void {
  const script =
    "Add-Type -AssemblyName System.Drawing; " +
    `$o = [System.Drawing.Bitmap]::new('${origemPng}'); ` +
    "$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }; " +
    "$enc = New-Object System.Drawing.Imaging.EncoderParameters(1); " +
    "$enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 92L); " +
    `$o.Save('${destinoJpg}', $codec, $enc); $o.Dispose()`;
  execFileSync("powershell", ["-NoProfile", "-Command", script], { stdio: "ignore" });
}

function htmlMoldura(o: { titulo: string; subtitulo: string; imagemDataUri: string; ehPdf: boolean }): string {
  const moldura = o.ehPdf
    ? `width: 920px; border-radius: 18px; border: 3px solid #D9DEE6; box-shadow: 0 28px 60px rgba(27,42,64,0.22);`
    : `width: 760px; border-radius: 48px; border: 14px solid #1B2A40; box-shadow: 0 28px 60px rgba(27,42,64,0.24);`;
  return `<!doctype html>
<html>
<head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px; height: 1920px; overflow: hidden;
    background: linear-gradient(180deg, #E3EEFA 0%, #CFE1F5 100%);
    font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex; flex-direction: column; align-items: center;
    padding: 86px 64px 56px;
  }
  .topo { text-align: center; margin-bottom: 52px; }
  h1 { font-size: 62px; line-height: 1.12; font-weight: 800; color: #1B2A40; letter-spacing: -0.02em; }
  .barra { width: 92px; height: 8px; border-radius: 4px; background: #E58AA8; margin: 22px auto; }
  p { font-size: 34px; line-height: 1.3; font-weight: 600; color: #2F5F96; max-width: 920px; }
  .quadro { flex: 1; display: flex; align-items: flex-start; justify-content: center; }
  img { display: block; height: auto; background: #fff; ${moldura} }
</style></head>
<body>
  <div class="topo">
    <h1>${esc(o.titulo)}</h1>
    <div class="barra"></div>
    <p>${esc(o.subtitulo)}</p>
  </div>
  <div class="quadro"><img src="${o.imagemDataUri}" alt=""></div>
</body>
</html>`;
}

function dataUri(caminho: string): string {
  const ext = caminho.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
  return `data:${ext};base64,${readFileSync(caminho).toString("base64")}`;
}

const todas = process.argv.includes("--todas");
const navegador = edge();
const temp = mkdtempSync(join(tmpdir(), "afetilu-moldura-"));

try {
  for (const idioma of ["pt-BR", "en", "es"] as const) {
    const destinoDir = join(CAPTURAS, idioma);
    mkdirSync(destinoDir, { recursive: true });

    const alvos: { slot: Slot; origem: string; saida: string }[] = [
      {
        slot: "pdf",
        origem: join(SITE_TELAS, `pdf-${idioma}.jpg`),
        saida: join(destinoDir, todas ? "01-pdf.jpg" : "04-pdf.jpg"),
      },
    ];
    if (todas) {
      for (const [slot, nome] of [
        ["inicio", "02-inicio.jpg"],
        ["linha", "03-linha-do-tempo.jpg"],
        ["resumo", "04-resumo.jpg"],
      ] as const) {
        const png = join(CRUAS, idioma, `${slot}.png`);
        const jpg = join(CRUAS, idioma, `${slot}.jpg`);
        const origem = existsSync(png) ? png : existsSync(jpg) ? jpg : null;
        if (origem) alvos.push({ slot, origem, saida: join(destinoDir, nome) });
      }
    }

    for (const a of alvos) {
      const html = join(temp, `${idioma}-${a.slot}.html`);
      const png = join(temp, `${idioma}-${a.slot}.png`);
      const leg = LEGENDAS[idioma][a.slot];
      writeFileSync(html, htmlMoldura({ titulo: leg.titulo, subtitulo: leg.subtitulo, imagemDataUri: dataUri(a.origem), ehPdf: a.slot === "pdf" }));
      execFileSync(
        navegador,
        [
          "--headless=new",
          "--disable-gpu",
          "--hide-scrollbars",
          `--user-data-dir=${join(temp, "perfil")}`,
          "--window-size=1080,1920",
          `--screenshot=${png}`,
          pathToFileURL(html).href,
        ],
        { stdio: "ignore" },
      );
      salvarJpg(png, a.saida);
      process.stdout.write(`${idioma}/${a.saida.split(/[\\/]/).pop()}\n`);
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
