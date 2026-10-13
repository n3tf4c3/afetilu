import { en } from "./en";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { IDIOMAS, type DicionarioDominio, type Idioma } from "./tipo";

export * from "./tipo";

const DICIONARIOS: Record<Idioma, DicionarioDominio> = { "pt-BR": ptBR, en, es };

export function dominio(idioma: Idioma): DicionarioDominio {
  return DICIONARIOS[idioma];
}

/** Idioma usado quando o aparelho está num idioma ainda não traduzido. */
export const IDIOMA_PADRAO: Idioma = "en";

/**
 * Escolhe o idioma pelas preferências do aparelho (ex.: ["es-MX", "en-US"]),
 * na ordem, comparando só o idioma base.
 */
export function resolverIdioma(tags: readonly string[]): Idioma {
  for (const tag of tags) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    if (base === "pt") return "pt-BR";
    if (base === "en") return "en";
    if (base === "es") return "es";
  }
  return IDIOMA_PADRAO;
}

export const ehIdioma = (v: unknown): v is Idioma => typeof v === "string" && (IDIOMAS as readonly string[]).includes(v);
