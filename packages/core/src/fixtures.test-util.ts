import { chaveDoDia } from "./datas";
import type { Detalhe, Registro } from "./tipos";

// Dados fictícios para testes. Nunca usar dados reais.
export const PESSOA = "pessoa-ficticia-1";

let seq = 0;

export function registro(
  quando: Date,
  detalhe: Detalhe,
  extra: Partial<Registro> = {},
): Registro {
  seq += 1;
  const iso = quando.toISOString();
  return {
    id: `r${seq}`,
    pessoaId: PESSOA,
    ocorreuEm: iso,
    ocorreuDia: chaveDoDia(quando),
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

export const comida = (item = "arroz"): Detalhe => ({ categoria: "alimentacao", tipo: "comida", item });
export const enjoo: Detalhe = { categoria: "dor_desconforto", tipo: "enjoo", regiao: "barriga" };
export const episodio: Detalhe = {
  categoria: "comportamento",
  observado: ["agitacao"],
  ehEpisodio: true,
  episodio: { intensidade: "moderada", duracaoMin: 10 },
};
export const calmo: Detalhe = { categoria: "comportamento", observado: ["calmo"], ehEpisodio: false };
export const sono: Detalhe = { categoria: "sono", tipo: "noturno" };
