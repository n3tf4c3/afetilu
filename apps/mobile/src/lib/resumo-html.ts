// Documento do PDF do resumo para consulta (docs/viabilidade-e-escopo.md, 3.2).
//
// String HTML autocontida: CSS e SVG embutidos, sem fonte, imagem ou script externo. O expo-print
// a transforma em PDF no próprio aparelho; abrir o arquivo não faz nenhuma requisição, então nada
// do registro sai por CDN. A fonte é a do sistema.
//
// Só descreve o que foi registrado: sem interpretação, sem correlação e sem "melhor/pior". Dia
// sem registro aparece como "sem informação", nunca como "sem crises". Só o apelido da pessoa.

import {
  chaveDoDia,
  dataDaChave,
  horarioLegivel,
  INTENSIDADES,
  nomeDoRegistro,
  type DicionarioDominio,
  type Registro,
  type Resumo,
  type SituacaoDoDia,
} from "@afetilu/core";
import type { TextosApp } from "../i18n/tipo";
import { descreverRegistro } from "./descricao";

export interface OpcoesResumoHtml {
  resumo: Resumo;
  apelido: string;
  geradoEm: Date;
  d: DicionarioDominio;
  t: TextosApp;
  /** Idioma do documento (atributo lang). */
  idioma: string;
}

// Branco de fundo, azul como cor principal e rosa como acento (as cores do slime). O rosa nunca
// sinaliza alerta; toda cor usada como texto passa AA (4,5:1) sobre o fundo em que aparece.
const COR = {
  tinta: "#1B2A40",
  texto: "#2B3A4F",
  suave: "#5B6679",
  borda: "#D9DEE6",
  divisoria: "#ECEFF4",
  primaria: "#2F5F96",
  azulClaro: "#E3EEFA",
  rosa: "#E58AA8",
  rosaTexto: "#A8345E",
  rosaClaro: "#FCEAF0",
  slime: "#79AEE0",
} as const;

// Mascote em miniatura (gota com rosto), só decorativo.
const SLIME =
  '<svg class="slime" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  `<path d="M12 3C8.2 3 4 9 4 14c0 4.4 3.6 7 8 7s8-2.6 8-7c0-5-4.2-11-8-11z" fill="${COR.slime}"/>` +
  `<ellipse cx="7.2" cy="16.2" rx="1.3" ry=".8" fill="${COR.rosa}"/><ellipse cx="16.8" cy="16.2" rx="1.3" ry=".8" fill="${COR.rosa}"/><circle cx="9.2" cy="14.2" r="1.35" fill="${COR.tinta}"/><circle cx="14.8" cy="14.2" r="1.35" fill="${COR.tinta}"/>` +
  `<path d="M10.5 16.9q.75.8 1.5 0q.75.8 1.5 0" fill="none" stroke="${COR.tinta}" stroke-width=".8" stroke-linecap="round"/>` +
  "</svg>";

export function esc(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function montarResumoHtml(o: OpcoesResumoHtml): string {
  const { resumo: r, d, t } = o;
  const tr = t.resumo;
  const hoje = chaveDoDia(o.geradoEm);

  const data = (x: Date) => tr.data(x.getDate(), x.getMonth() + 1, x.getFullYear());
  const dataDoDia = (chave: string) => data(dataDaChave(chave));
  const horario = (reg: Registro) => horarioLegivel(reg, d) || tr.semHorario;
  const origem = (reg: Registro) => esc(tr.origem[reg.origem] + (reg.origemQuem ? ` (${reg.origemQuem})` : ""));
  const corrigido = (reg: Registro) => (reg.versao > 1 ? ` <span class="selo">${esc(tr.corrigido)}</span>` : "");
  // Campos do registro nas palavras do responsável; categoria e origem têm lugar próprio no documento.
  const omitir = new Set([t.descricao.categoria, t.descricao.origem, t.descricao.episodio]);
  const campos = (reg: Registro) => descreverRegistro(reg, hoje, chaveDoDia, d, t.descricao).filter((l) => !omitir.has(l.rotulo));
  // Na tabela, o tipo já está na coluna "Registro".
  const omitirNaTabela = new Set([t.descricao.tipo, t.descricao.tipoPercebido]);
  const camposDaTabela = (reg: Registro) => campos(reg).filter((l) => !omitirNaTabela.has(l.rotulo));

  const cob = r.cobertura;
  const totalRegistros = Object.values(r.porCategoria).reduce((s, n) => s + n, 0);

  const topo =
    `<header class="topo"><div><p class="marca">${SLIME}${esc(tr.marca)}</p><h1>${esc(tr.docTitulo)}</h1></div>` +
    `<p class="doc">${esc(tr.geradoEm(data(o.geradoEm)))}</p></header>`;

  const faixa =
    `<dl class="faixa">` +
    `<div><dt>${esc(tr.pessoa)}</dt><dd>${esc(o.apelido)}</dd></div>` +
    `<div><dt>${esc(tr.periodoAnalisado)}</dt><dd>${esc(dataDoDia(r.inicio))} – ${esc(dataDoDia(r.fim))} ` +
    `<span class="suave">· ${esc(tr.dias(r.totalDias))}</span></dd></div>` +
    `</dl>`;

  const destaque =
    `<div class="destaque"><div><p class="rotulo">${esc(tr.diasComRegistro)}</p>` +
    `<p class="grande">${esc(tr.deDias(cob.diasComRegistro, cob.totalDias))}</p></div>` +
    `<p class="narrativa">${esc(tr.narrativa(cob.diasSemCrises, cob.diasSemInformacao, cob.episodios))}` +
    (cob.diasInconsistentes > 0 ? ` ${esc(tr.inconsistentes(cob.diasInconsistentes))}` : "") +
    `</p></div>`;

  // A cor do cartão repete a da grade dia a dia (azul = registros, rosa = marcado sem crises).
  const kpi = (rotulo: string, valor: number, classe = "") => `<div class="kpi ${classe}"><p class="rotulo">${esc(rotulo)}</p><p class="valor">${valor}</p></div>`;
  const kpis =
    `<div class="kpis">${kpi(tr.kpiRegistros, totalRegistros, "k-azul")}${kpi(tr.kpiEpisodios, cob.episodios)}` +
    `${kpi(tr.kpiSemCrises, cob.diasSemCrises, "k-rosa")}${kpi(tr.kpiSemInformacao, cob.diasSemInformacao)}</div>`;

  const mapa = mapaDeDias(cob.dias, d, tr);

  // Contexto do período, nas palavras do responsável. Fica separado dos registros e sem ligação com eles.
  const mudancas = r.mudancas.length
    ? `<section class="bloco"><h2>${esc(tr.mudancasTitulo)}</h2>` +
      `<table class="lista"><colgroup><col class="c-data"><col></colgroup>` +
      `<thead><tr><th>${esc(tr.colData)}</th><th>${esc(tr.colMudanca)}</th></tr></thead><tbody>` +
      r.mudancas.map((m) => `<tr><td>${esc(dataDoDia(m.dia))}</td><td>${esc(m.texto)}</td></tr>`).join("") +
      `</tbody></table><p class="nota">${esc(tr.mudancasNota)}</p></section>`
    : "";

  const perguntas = r.perguntas.length
    ? `<section class="bloco"><h2>${esc(tr.perguntasTitulo)}</h2><ol class="perguntas">` +
      r.perguntas.map((p) => `<li>${esc(p.texto)}</li>`).join("") +
      `</ol></section>`
    : "";

  if (r.vazio) {
    return documento(o, topo + faixa + destaque + kpis + mapa + `<p class="aviso">${esc(tr.vazio)}</p>` + mudancas + perguntas);
  }

  const porCategoria =
    `<section class="bloco"><h2>${esc(tr.porCategoriaTitulo)}</h2><table class="categorias"><tbody>` +
    r.categorias.map((c) => `<tr><td>${esc(d.categoria[c])}</td><td class="num">${r.porCategoria[c]}</td></tr>`).join("") +
    `</tbody></table>` +
    `<p class="nota">${esc(tr.origensTexto(r.origens.vi, r.origens.me_contaram, r.origens.suspeita))}` +
    (r.corrigidos > 0 ? ` ${esc(tr.corrigidosTexto(r.corrigidos))}` : "") +
    `</p></section>`;

  let episodios = "";
  if (r.categorias.includes("comportamento")) {
    if (r.episodios.length === 0) {
      episodios = `<section class="bloco"><h2>${esc(tr.episodiosTitulo)}</h2><p class="aviso">${esc(tr.semEpisodios)}</p></section>`;
    } else {
      const intensidades = [...INTENSIDADES, "nao_informada" as const]
        .filter((i) => r.intensidades[i] > 0)
        .map((i) => `<span class="chip">${esc(i === "nao_informada" ? tr.naoInformada : d.intensidade[i].rotulo)} · ${r.intensidades[i]}</span>`)
        .join("");
      const ajudou = r.ajudou.length
        ? `<p class="subtitulo">${esc(tr.ajudouTitulo)}</p><ul class="ajudou">` +
          r.ajudou.map((a) => `<li>${esc(a.texto)} <span class="suave">— ${esc(tr.ajudouAnotado(a.episodios, r.episodios.length))}</span></li>`).join("") +
          `</ul>`
        : "";
      const cartoes = r.episodios
        .map(
          (reg) =>
            `<article class="cartao"><p class="cartao-titulo">${esc(dataDoDia(reg.ocorreuDia))} · ${esc(horario(reg))}${corrigido(reg)}</p>` +
            `<dl class="campos">` +
            campos(reg).map((l) => `<dt>${esc(l.rotulo)}</dt><dd>${esc(l.valor)}</dd>`).join("") +
            `<dt>${esc(tr.colOrigem)}</dt><dd>${origem(reg)}</dd></dl></article>`,
        )
        .join("");
      episodios =
        `<section class="bloco"><h2>${esc(tr.episodiosTitulo)}</h2>` +
        `<p class="subtitulo">${esc(tr.intensidadesTitulo)}</p><p class="chips">${intensidades}</p>${ajudou}</section>` +
        cartoes;
    }
  }

  const tabela = (lista: Registro[]) =>
    `<table class="lista"><colgroup><col class="c-data"><col class="c-hora"><col class="c-reg"><col><col class="c-origem"></colgroup>` +
    `<thead><tr><th>${esc(tr.colData)}</th><th>${esc(tr.colHora)}</th><th>${esc(tr.colRegistro)}</th><th>${esc(tr.colDetalhes)}</th><th>${esc(tr.colOrigem)}</th></tr></thead><tbody>` +
    lista
      .map(
        (reg) =>
          `<tr><td>${esc(dataDoDia(reg.ocorreuDia))}</td><td>${esc(horario(reg))}</td>` +
          `<td>${esc(nomeDoRegistro(reg.detalhe, d).nome)}${corrigido(reg)}</td>` +
          `<td>${camposDaTabela(reg).map((l) => `<span class="campo">${esc(l.rotulo)}:</span> ${esc(l.valor)}`).join(" · ")}</td>` +
          `<td>${origem(reg)}</td></tr>`,
      )
      .join("") +
    `</tbody></table>`;

  const positivos = r.categorias.includes("positivo")
    ? `<section class="bloco"><h2>${esc(tr.positivosTitulo)}</h2>` +
      (r.positivos.length ? tabela(r.positivos) : `<p class="aviso">${esc(tr.semPositivos)}</p>`) +
      `</section>`
    : "";

  const demais = r.demais.length ? `<section class="bloco"><h2>${esc(tr.demaisTitulo)}</h2>${tabela(r.demais)}</section>` : "";

  return documento(o, topo + faixa + destaque + kpis + mapa + mudancas + porCategoria + episodios + positivos + demais + perguntas);
}

/** Grade dia a dia, 7 por linha. O símbolo carrega a informação; a cor só reforça. */
function mapaDeDias(dias: SituacaoDoDia[], d: DicionarioDominio, tr: TextosApp["resumo"]): string {
  const celula = (s: SituacaoDoDia) => {
    const x = dataDaChave(s.dia);
    const classe = s.semCrisesAnotado ? "c-semcrises" : s.registros > 0 ? "c-registro" : "c-sem";
    const simbolo = s.semCrisesAnotado ? "✓" : s.registros > 0 ? String(s.registros) : "—";
    const episodio = s.episodios > 0 ? `<span class="ep">◆${s.episodios > 1 ? s.episodios : ""}</span>` : "";
    return `<td class="${classe}"><span class="dia">${esc(d.diaCurto(x.getDate(), x.getMonth() + 1))}</span><span class="sim">${simbolo}${episodio}</span></td>`;
  };
  const linhas: string[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const semana = dias.slice(i, i + 7);
    linhas.push(`<tr>${semana.map(celula).join("")}${"<td class=\"c-fora\"></td>".repeat(7 - semana.length)}</tr>`);
  }
  return (
    `<section class="bloco"><div class="titulo-bloco"><h2>${esc(tr.mapaTitulo)}</h2>` +
    `<p class="legenda"><span><b>3</b> ${esc(tr.legendaRegistros)}</span><span><b>✓</b> ${esc(tr.legendaSemCrises)}</span>` +
    `<span><b>—</b> ${esc(tr.legendaSemInformacao)}</span><span><b>◆</b> ${esc(tr.legendaEpisodio)}</span></p></div>` +
    `<table class="mapa"><tbody>${linhas.join("")}</tbody></table></section>`
  );
}

function documento(o: OpcoesResumoHtml, conteudo: string): string {
  const tr = o.t.resumo;
  return `<!doctype html>
<html lang="${esc(o.idioma)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(tr.docTitulo)} — ${esc(o.apelido)}</title>
<style>
  @page { size: A4; margin: 12mm 14mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 11.5px; line-height: 1.45; color: ${COR.texto}; background: #ffffff;
    font-variant-numeric: tabular-nums;
    -webkit-text-size-adjust: none;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  p, h1, h2, dl, dd, ul { margin: 0; }
  /* A tabela de estrutura repete o tfoot em cada página: reserva o espaço do rodapé fixo. */
  .estrutura { width: 100%; border-collapse: collapse; }
  .estrutura > tbody > tr > td, .estrutura > tfoot > tr > td { padding: 0; }
  .reserva { height: 16mm; }
  .conteudo { display: flex; flex-direction: column; gap: 14px; }
  .rodape { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; gap: 20px;
    border-top: 1px solid ${COR.borda}; padding-top: 6px; font-size: 9px; line-height: 1.5; color: ${COR.suave}; background: #ffffff; }
  .rodape p { max-width: 520px; }
  .rodape span { white-space: nowrap; }
  .suave { color: ${COR.suave}; }
  .topo { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid ${COR.rosa}; padding-bottom: 8px; }
  .marca { font-size: 10px; font-weight: 700; letter-spacing: .24em; text-transform: uppercase; color: ${COR.rosaTexto}; }
  .slime { margin-right: 6px; vertical-align: -4px; }
  h1 { margin-top: 3px; font-size: 22px; font-weight: 700; color: ${COR.primaria}; }
  .doc { font-size: 10px; color: ${COR.suave}; text-align: right; }
  .faixa { display: flex; border: 1px solid ${COR.borda}; border-radius: 6px; }
  .faixa > div { flex: 1 1 0; padding: 7px 11px; border-right: 1px solid ${COR.borda}; }
  .faixa > div:last-child { border-right: none; flex-grow: 1.8; }
  dt, .rotulo { font-size: 9px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: ${COR.suave}; }
  .faixa dd { margin-top: 2px; font-size: 13px; font-weight: 600; color: ${COR.tinta}; }
  .destaque { display: flex; gap: 24px; align-items: center; }
  .grande { font-size: 40px; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; color: ${COR.primaria}; white-space: nowrap; }
  .narrativa { flex: 1; border-left: 3px solid ${COR.rosa}; padding-left: 20px; font-size: 12.5px; line-height: 1.55; }
  .kpis { display: flex; gap: 10px; }
  .kpi { flex: 1 1 0; border: 1px solid ${COR.borda}; border-radius: 6px; padding: 9px 11px; }
  .k-azul { background: ${COR.azulClaro}; border-color: ${COR.azulClaro}; }
  .k-rosa { background: ${COR.rosaClaro}; border-color: ${COR.rosaClaro}; }
  .kpi .valor { margin-top: 3px; font-size: 18px; font-weight: 700; color: ${COR.tinta}; }
  .bloco { display: flex; flex-direction: column; gap: 7px; }
  .titulo-bloco { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  h2 { font-size: 13.5px; font-weight: 700; color: ${COR.primaria}; border-left: 3px solid ${COR.rosa}; padding-left: 7px; break-after: avoid; page-break-after: avoid; }
  .subtitulo { margin-top: 2px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: ${COR.suave}; }
  .legenda { font-size: 10px; color: ${COR.suave}; }
  .legenda span { margin-left: 12px; white-space: nowrap; }
  .legenda b { color: ${COR.tinta}; }
  .nota { font-size: 10.5px; color: ${COR.suave}; }
  .aviso { border: 1px solid ${COR.borda}; border-radius: 6px; background: ${COR.azulClaro}; padding: 10px 12px; }
  .mapa { width: 100%; border-collapse: separate; border-spacing: 4px; table-layout: fixed; break-inside: avoid; page-break-inside: avoid; }
  .mapa td { height: 38px; border-radius: 5px; padding: 3px 5px; vertical-align: top; }
  .mapa .dia { display: block; font-size: 8.5px; color: ${COR.suave}; }
  .mapa .sim { display: block; text-align: center; font-size: 13px; font-weight: 700; color: ${COR.tinta}; }
  .mapa .ep { margin-left: 4px; font-size: 10px; }
  .c-registro { background: ${COR.azulClaro}; }
  .c-semcrises { background: ${COR.rosaClaro}; }
  .c-sem { border: 1px dashed ${COR.borda}; }
  .c-sem .sim { color: ${COR.suave}; font-weight: 400; }
  .c-fora { background: transparent; }
  .categorias { width: 60%; border-collapse: collapse; font-size: 11.5px; }
  .categorias td { padding: 3px 8px 3px 0; border-bottom: 1px solid ${COR.divisoria}; }
  .num { text-align: right; font-weight: 600; color: ${COR.tinta}; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-block; padding: 2px 8px; border-radius: 4px; background: ${COR.rosaClaro}; font-size: 11px; font-weight: 600; color: ${COR.texto}; }
  .ajudou { padding-left: 16px; }
  .perguntas { padding-left: 18px; }
  .perguntas li { padding: 4px 0; border-bottom: 1px solid ${COR.divisoria}; break-inside: avoid; page-break-inside: avoid; }
  .cartao { border: 1px solid ${COR.borda}; border-left: 4px solid ${COR.rosa}; border-radius: 6px; padding: 9px 12px; break-inside: avoid; page-break-inside: avoid; }
  .cartao-titulo { font-size: 12px; font-weight: 700; color: ${COR.tinta}; margin-bottom: 5px; }
  .campos { display: grid; grid-template-columns: 150px 1fr; gap: 3px 12px; }
  .campos dt { font-size: 9px; padding-top: 2px; }
  .campos dd { font-size: 11px; }
  .selo { display: inline-block; margin-left: 6px; padding: 0 6px; border: 1px solid ${COR.rosa}; border-radius: 4px; font-size: 9px; font-weight: 600; color: ${COR.rosaTexto}; vertical-align: 1px; }
  .lista { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; }
  .lista .c-data { width: 74px; }
  .lista .c-hora { width: 78px; }
  .lista .c-reg { width: 100px; }
  .lista .c-origem { width: 132px; }
  .lista th { padding: 5px 8px 5px 0; border-bottom: 1.5px solid ${COR.primaria}; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: ${COR.suave}; }
  .lista td { padding: 4px 8px 4px 0; border-bottom: 1px solid ${COR.divisoria}; vertical-align: top; overflow-wrap: anywhere; }
  .lista tr { break-inside: avoid; page-break-inside: avoid; }
  .campo { color: ${COR.suave}; }
</style>
</head>
<body>
<table class="estrutura"><tbody><tr><td><div class="conteudo">${conteudo}</div></td></tr></tbody>
<tfoot><tr><td><div class="reserva"></div></td></tr></tfoot></table>
<footer class="rodape"><p>${esc(tr.rodape)}</p><span>${esc(o.apelido)} · ${esc(tr.marca)}</span></footer>
</body>
</html>`;
}

/** Nome do PDF compartilhado: legível e sem caracteres que sistemas de arquivos recusam. */
export function nomeDoArquivoDoResumo(titulo: string, apelido: string, dia: string): string {
  const limpo = (s: string) =>
    s
      .replace(/[\/:*?"<>|\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40)
      .trim();
  return [limpo(titulo), limpo(apelido), dia].filter(Boolean).join(" - ") + ".pdf";
}
