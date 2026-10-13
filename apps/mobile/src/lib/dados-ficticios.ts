import { chaveDoDia, somarDias, type Detalhe, type EntradaRegistro } from "@afetilu/core";

// Gerador de dados FICTÍCIOS para desenvolvimento e demonstração.
// Disponível só em builds de desenvolvimento; nunca usar dados reais.

/** Pseudoaleatório determinístico (mulberry32), para gerar sempre o mesmo conjunto. */
function sorteador(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALIMENTOS = ["arroz e feijão", "banana", "pão", "macarrão", "iogurte", "frango", "maçã"];

export function gerarDadosFicticios(
  pessoaId: string,
  hoje: Date,
  dias = 14,
): { registros: EntradaRegistro[]; diasSemCrises: string[] } {
  const sortear = sorteador(20261013);
  const hojeChave = chaveDoDia(hoje);
  const registros: EntradaRegistro[] = [];
  const diasSemCrises: string[] = [];

  const em = (dia: string, hora: number, minuto: number, detalhe: Detalhe, extra: Partial<EntradaRegistro> = {}) => {
    const [a, m, d] = dia.split("-").map(Number);
    const data = new Date(a!, m! - 1, d!, hora, minuto);
    if (data.getTime() > hoje.getTime()) return;
    registros.push({
      pessoaId,
      ocorreuEm: data.toISOString(),
      ocorreuDia: dia,
      precisao: "exato",
      emAberto: false,
      origem: "vi",
      detalhe,
      ...extra,
    });
  };

  for (let i = dias - 1; i >= 0; i--) {
    const dia = somarDias(hojeChave, -i);
    // Alguns dias ficam propositalmente sem nada: "sem informação".
    if (sortear() < 0.15) continue;

    em(dia, 7, 30, { categoria: "alimentacao", tipo: "comida", item: ALIMENTOS[Math.floor(sortear() * ALIMENTOS.length)]!, quantidade: "metade" });
    em(dia, 12, 15, { categoria: "alimentacao", tipo: "comida", item: ALIMENTOS[Math.floor(sortear() * ALIMENTOS.length)]!, quantidade: "tudo" });
    em(dia, 21, 0, { categoria: "sono", tipo: "noturno", despertares: Math.floor(sortear() * 3) }, { precisao: "aproximado" });
    if (sortear() < 0.5) em(dia, 19, 0, { categoria: "higiene", tipo: "banho", aceitacao: "com_ajuda" });

    const sorte = sortear();
    if (sorte < 0.25) {
      em(dia, 13, 0, { categoria: "dor_desconforto", tipo: "enjoo", regiao: "barriga" }, { origem: "suspeita" });
    }
    if (sorte > 0.7) {
      em(
        dia,
        16,
        20,
        {
          categoria: "comportamento",
          observado: ["agitacao", "choro"],
          ehEpisodio: true,
          episodio: { duracaoMin: 15, intensidade: "moderada", contextoAntes: "Mudança de rotina (fictício)", ajudou: ["Ambiente silencioso"] },
        },
        { observacao: "Registro fictício para demonstração." },
      );
    } else if (sortear() < 0.6) {
      diasSemCrises.push(dia);
    }
    if (sortear() < 0.4) {
      em(dia, 10, 0, { categoria: "positivo", tipo: "comunicacao", descricao: "Pediu água apontando (fictício)" });
    }
  }
  return { registros, diasSemCrises };
}
