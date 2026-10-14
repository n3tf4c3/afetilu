import type { IdiomaSite } from "./textos/tipo.ts";

export const SITE = {
  url: "https://afetilu.vercel.app",
  repositorio: "https://github.com/n3tf4c3/afetilu",
  /**
   * Fichas nas lojas: null até a publicação. Com o link preenchido, a página troca o "em breve"
   * pelo selo da loja e passa a mostrar o aviso de marcas no rodapé.
   */
  lojas: {
    googlePlay: null as string | null,
    appStore: null as string | null,
  },
} as const;

/** Prefixo de cada idioma: o pt-BR fica na raiz. */
export const PREFIXO: Record<IdiomaSite, string> = { "pt-BR": "", en: "/en", es: "/es" };

/** Endereço da política de privacidade em cada idioma (também vai nas fichas das lojas). */
export const CAMINHO_POLITICA: Record<IdiomaSite, string> = {
  "pt-BR": "/privacidade",
  en: "/en/privacy",
  es: "/es/privacidad",
};

export const caminhoInicial = (idioma: IdiomaSite) => PREFIXO[idioma] || "/";
