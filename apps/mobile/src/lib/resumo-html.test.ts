import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIAS, dominio, montarResumo, type Detalhe, type Registro } from "@afetilu/core";
import { textos } from "../i18n";
import { esc, montarResumoHtml, nomeDoArquivoDoResumo } from "./resumo-html";

// Dados fictícios. Nunca usar dados reais.
let seq = 0;
function reg(dia: number, hora: number, detalhe: Detalhe, extra: Partial<Registro> = {}): Registro {
  seq += 1;
  const quando = new Date(2026, 9, dia, hora, 0);
  const iso = quando.toISOString();
  return {
    id: `r${seq}`,
    pessoaId: "pessoa-ficticia",
    ocorreuEm: iso,
    ocorreuDia: `2026-10-${String(dia).padStart(2, "0")}`,
    precisao: "exato",
    emAberto: false,
    origem: "vi",
    detalhe,
    lancadoEm: iso,
    atualizadoEm: iso,
    versao: 1,
    ...extra,
  };
}

const episodio: Detalhe = {
  categoria: "comportamento",
  observado: ["agitacao"],
  ehEpisodio: true,
  episodio: { intensidade: "moderada", duracaoMin: 15, contextoAntes: "Barulho <alto> no corredor", ajudou: ["Fone abafador"] },
};

function gerar(registros: Registro[], idioma: "pt-BR" | "en" | "es" = "pt-BR", diasSemCrises: string[] = []) {
  const resumo = montarResumo({
    inicio: "2026-10-10",
    fim: "2026-10-16",
    categorias: CATEGORIAS,
    registros,
    diasAnotados: diasSemCrises.map((dia) => ({ pessoaId: "pessoa-ficticia", dia, semCrises: true, lancadoEm: "2026-10-16T12:00:00.000Z" })),
  });
  return montarResumoHtml({ resumo, apelido: "Exemplo", geradoEm: new Date(2026, 9, 16, 18, 0), d: dominio(idioma), t: textos(idioma).t, idioma });
}

test("texto do responsável é escapado (nada vira HTML)", () => {
  const html = gerar([reg(11, 9, episodio, { observacao: "<script>alert(1)</script>" })]);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Barulho &lt;alto&gt; no corredor"));
  assert.equal(esc(`"a" & 'b'`), "&quot;a&quot; &amp; &#39;b&#39;");
});

test("documento autocontido: nenhum recurso externo", () => {
  const html = gerar([reg(11, 9, episodio)]);
  assert.ok(!/\s(src|href)=/.test(html), "não pode ter src/href");
  assert.ok(!/url\(/.test(html), "não pode ter url() no CSS");
  // O único "http" permitido é o namespace do SVG (não é requisição).
  assert.deepEqual(html.match(/https?:\/\/[^"\s]+/g) ?? [], ["http://www.w3.org/2000/svg"]);
});

test("rodapé fixo, apelido e nenhum identificador interno", () => {
  const html = gerar([reg(11, 9, episodio)]);
  assert.ok(html.includes("Acontecimentos próximos no tempo não indicam causa. Não substitui avaliação profissional."));
  assert.ok(html.includes("Exemplo"));
  assert.ok(!html.includes("pessoa-ficticia"));
});

test("dia sem registro é 'sem informação' (—), diferente de dia marcado sem crises (✓)", () => {
  const html = gerar([reg(11, 9, episodio)], "pt-BR", ["2026-10-12"]);
  assert.match(html, /class="c-semcrises"><span class="dia">12\/10<\/span><span class="sim">✓/);
  assert.match(html, /class="c-sem"><span class="dia">13\/10<\/span><span class="sim">—/);
  assert.match(html, /class="c-registro"><span class="dia">11\/10<\/span><span class="sim">1<span class="ep">◆/);
  assert.ok(html.includes("o que não quer dizer sem crises"));
});

test("episódio traz intensidade com o critério e 'o que ajudou' como contagem literal", () => {
  const html = gerar([reg(11, 9, episodio), reg(12, 9, { ...episodio, episodio: { intensidade: "leve" } })]);
  assert.ok(html.includes("Moderada — Interrompeu a atividade"));
  assert.ok(html.includes("Fone abafador <span class=\"suave\">— anotado em 1 de 2 episódios</span>"));
});

test("registro corrigido e origem aparecem", () => {
  const html = gerar([reg(11, 9, { categoria: "sono", tipo: "noturno" }, { versao: 2, origem: "me_contaram", origemQuem: "escola" })]);
  assert.ok(html.includes('<span class="selo">corrigido</span>'));
  assert.ok(html.includes("Relatado por outra pessoa (escola)"));
});

test("período vazio mostra o aviso e a cobertura, sem seções de registros", () => {
  const html = gerar([]);
  assert.ok(html.includes("Nenhum registro das categorias escolhidas neste período."));
  assert.ok(html.includes("0 de 7"));
  assert.ok(!html.includes("Demais registros"));
});

test("traduzido: inglês com data no formato do idioma", () => {
  const html = gerar([reg(11, 9, episodio)], "en");
  assert.ok(html.includes("Summary for appointments"));
  assert.ok(html.includes("10/10/2026 – 10/16/2026"));
  assert.ok(html.includes('lang="en"'));
});

test("nome do arquivo legível e sem caracteres proibidos", () => {
  assert.equal(nomeDoArquivoDoResumo("Resumo para consulta", "Exemplo", "2026-10-13"), "Resumo para consulta - Exemplo - 2026-10-13.pdf");
  assert.equal(nomeDoArquivoDoResumo("Resumo", 'Ana/Clara: "mãe"?', "2026-10-13"), "Resumo - Ana Clara mãe - 2026-10-13.pdf");
  assert.equal(nomeDoArquivoDoResumo("Resumo", "///", "2026-10-13"), "Resumo - 2026-10-13.pdf");
});
