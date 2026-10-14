import { en } from "./en.ts";
import { es } from "./es.ts";
import { ptBR } from "./pt-BR.ts";
import type { IdiomaSite, TextosSite } from "./tipo.ts";

const TEXTOS: Record<IdiomaSite, TextosSite> = { "pt-BR": ptBR, en, es };

export const textosDoSite = (idioma: IdiomaSite): TextosSite => TEXTOS[idioma];
