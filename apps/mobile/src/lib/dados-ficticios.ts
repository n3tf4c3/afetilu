import { chaveDoDia, somarDias, type Detalhe, type EntradaRegistro, type Idioma } from "@afetilu/core";

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

/** Textos livres dos dados fictícios no idioma do app, para demonstrações e capturas sem mistura de idiomas. */
const TEXTOS_FICTICIOS: Record<
  Idioma,
  { alimentos: string[]; contexto: string; ajudou: string; observacao: string; positivo: string; mudanca: string; pergunta: string }
> = {
  "pt-BR": {
    alimentos: ["arroz e feijão", "banana", "pão", "macarrão", "iogurte", "frango", "maçã"],
    contexto: "Mudança de rotina (fictício)",
    ajudou: "Ambiente silencioso",
    observacao: "Registro fictício para demonstração.",
    positivo: "Pediu água apontando (fictício)",
    mudanca: "Começaram as férias escolares (fictício)",
    pergunta: "Pergunta fictícia: como lidar com o barulho na escola?",
  },
  en: {
    alimentos: ["rice and beans", "banana", "bread", "pasta", "yogurt", "chicken", "apple"],
    contexto: "Change in routine (fictional)",
    ajudou: "Quiet room",
    observacao: "Fictional log for demonstration.",
    positivo: "Asked for water by pointing (fictional)",
    mudanca: "School holidays started (fictional)",
    pergunta: "Fictional question: how to deal with noise at school?",
  },
  es: {
    alimentos: ["arroz con frijoles", "plátano", "pan", "pasta", "yogur", "pollo", "manzana"],
    contexto: "Cambio de rutina (ficticio)",
    ajudou: "Ambiente tranquilo",
    observacao: "Registro ficticio para demostración.",
    positivo: "Pidió agua señalando (ficticio)",
    mudanca: "Empezaron las vacaciones escolares (ficticio)",
    pergunta: "Pregunta ficticia: ¿cómo manejar el ruido en la escuela?",
  },
};

export function gerarDadosFicticios(
  pessoaId: string,
  hoje: Date,
  dias = 14,
  idioma: Idioma = "pt-BR",
): { registros: EntradaRegistro[]; diasSemCrises: string[]; mudancas: { dia: string; texto: string }[]; perguntas: string[] } {
  const sortear = sorteador(20261013);
  const tx = TEXTOS_FICTICIOS[idioma];
  const ALIMENTOS = tx.alimentos;
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
          episodio: { duracaoMin: 15, intensidade: "moderada", contextoAntes: tx.contexto, ajudou: [tx.ajudou] },
        },
        { observacao: tx.observacao },
      );
    } else if (sortear() < 0.6) {
      diasSemCrises.push(dia);
    }
    if (sortear() < 0.4) {
      em(dia, 10, 0, { categoria: "positivo", tipo: "comunicacao", descricao: tx.positivo });
    }
  }
  return {
    registros,
    diasSemCrises,
    mudancas: [{ dia: somarDias(hojeChave, -Math.min(5, dias - 1)), texto: tx.mudanca }],
    perguntas: [tx.pergunta],
  };
}
