import { dominio, type DicionarioDominio, type Idioma } from "@eloazul/core";
import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import type { TextosApp } from "./tipo";

export type { TextosApp } from "./tipo";

const APP: Record<Idioma, TextosApp> = { "pt-BR": ptBR, en, es };

/** Nome de cada idioma no próprio idioma, para o seletor em Ajustes. */
export const NOME_DO_IDIOMA: Record<Idioma, string> = { "pt-BR": "Português (Brasil)", en: "English", es: "Español" };

export interface Textos {
  idioma: Idioma;
  /** Textos das telas. */
  t: TextosApp;
  /** Textos do domínio (categorias, legendas, datas). */
  d: DicionarioDominio;
}

export function textos(idioma: Idioma): Textos {
  return { idioma, t: APP[idioma], d: dominio(idioma) };
}
