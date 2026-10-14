/** Idiomas do site: os mesmos do app. O pt-BR fica na raiz; os demais, em /en e /es. */
export const IDIOMAS_SITE = ["pt-BR", "en", "es"] as const;
export type IdiomaSite = (typeof IDIOMAS_SITE)[number];

export interface Recurso {
  /** Arquivo em publico/telas, sem o sufixo de idioma. */
  imagem: string;
  titulo: string;
  descricao: string;
}

export interface SecaoPolitica {
  titulo: string;
  paragrafos: string[];
}

/** Textos do site em um idioma. Todos implementam este tipo: faltar uma chave é erro de compilação. */
export interface TextosSite {
  /** Nome do idioma nele mesmo, para o seletor. */
  nomeDoIdioma: string;
  meta: { titulo: string; descricao: string; tituloPolitica: string };
  nav: { inicio: string; privacidade: string; baixar: string; idiomas: string; pularParaConteudo: string };
  hero: { selo: string; titulo: string; subtitulo: string; gratuito: string };
  lojas: {
    emBreve: string;
    googlePlayTopo: string;
    appStoreTopo: string;
  };
  recursosTitulo: string;
  recursos: Recurso[];
  /** Texto alternativo das capturas, que mostram dados fictícios. */
  capturaAlt: (titulo: string) => string;
  privacidade: { titulo: string; itens: string[]; link: string };
  limites: { titulo: string; texto: string; emergencia: string };
  codigoAberto: { titulo: string; texto: string; link: string };
  rodape: { descricao: string; licenca: string; marcas: string; codigo: string; contato: string; apoiar: string };
  politica: {
    titulo: string;
    atualizadaEm: string;
    introducao: string;
    secoes: SecaoPolitica[];
    /** Linha final da seção de contato quando há e-mail do projeto. */
    contatoEmail: string;
  };
}
