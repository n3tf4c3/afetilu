import { rotuloDoDia } from "./datas";
import type { ChaveNome, DicionarioDominio, Nome } from "./i18n/tipo";
import type { Detalhe, EntradaRegistro } from "./tipos";

/** Qual nome curto representa o registro. */
export function chaveDoNome(d: Detalhe): ChaveNome {
  switch (d.categoria) {
    case "alimentacao":
      return d.tipo === "bebida" ? "bebida" : "comida";
    case "dor_desconforto":
      return d.tipo === "outro" ? "desconforto" : d.tipo;
    case "comportamento":
      return d.ehEpisodio ? "episodio" : "comportamento";
    case "higiene":
      return d.tipo === "outro" ? "higiene" : d.tipo;
    case "sono":
      return d.tipo === "cochilo" ? "cochilo" : "sono";
    case "evacuacao":
      return d.tipo === "xixi" ? "xixi" : "evacuacao";
    case "positivo":
      return d.tipo;
  }
}

export function nomeDoRegistro(d: Detalhe, t: DicionarioDominio): Nome {
  return t.nomeRegistro[chaveDoNome(d)];
}

/** Quando aconteceu, em texto: "13:10", "por volta de 13:10", "à tarde" ou vazio (só a data). */
export function horarioLegivel(
  r: Pick<EntradaRegistro, "ocorreuEm" | "precisao" | "periodoDoDia">,
  t: DicionarioDominio,
): string {
  switch (r.precisao) {
    case "exato":
      return t.hora(new Date(r.ocorreuEm));
    case "aproximado":
      return t.porVoltaDe(t.hora(new Date(r.ocorreuEm)));
    case "periodo_do_dia":
      return r.periodoDoDia ? t.periodo[r.periodoDoDia] : "";
    case "so_data":
      return "";
  }
}

/**
 * Legenda de confirmação: descreve o registro feito, nunca o estado atual da pessoa.
 * Ex.: "Sono registrado · 13:10", "Sono registrado para ontem · 22:10",
 * "Suspeita registrada: enjoo · 14:20".
 */
export function legendaDoRegistro(
  r: Pick<EntradaRegistro, "ocorreuEm" | "ocorreuDia" | "precisao" | "periodoDoDia" | "origem" | "detalhe">,
  hoje: string,
  t: DicionarioDominio,
): string {
  const nome = nomeDoRegistro(r.detalhe, t);
  const base = r.origem === "suspeita" ? t.suspeitaRegistrada(nome) : t.registrado(nome);
  const dia = r.ocorreuDia === hoje ? "" : ` ${t.paraODia(rotuloDoDia(r.ocorreuDia, hoje, t))}`;
  const horario = horarioLegivel(r, t);
  return `${base}${dia}${horario ? ` · ${horario}` : ""}`;
}
