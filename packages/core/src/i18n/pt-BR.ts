import { f, m, type DicionarioDominio } from "./tipo";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const duracao = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
};

export const ptBR: DicionarioDominio = {
  categoria: {
    alimentacao: "Alimentação e bebidas",
    dor_desconforto: "Dor e desconforto",
    comportamento: "Emoções e comportamentos",
    higiene: "Banho e higiene",
    sono: "Sono e descanso",
    evacuacao: "Xixi e cocô",
    positivo: "Atividades e conquistas",
  },
  categoriaCurta: { alimentacao: "Alimentação", dor_desconforto: "Dor", comportamento: "Emoções", higiene: "Banho", sono: "Sono", evacuacao: "Xixi e cocô", positivo: "Conquistas" },
  origem: { vi: "Vi acontecer", me_contaram: "Me contaram", suspeita: "Suspeita minha" },
  periodo: { madrugada: "de madrugada", manha: "de manhã", tarde: "à tarde", noite: "à noite" },
  periodoCurto: { madrugada: "Madrugada", manha: "Manhã", tarde: "Tarde", noite: "Noite" },
  desconforto: { dor: "Dor", enjoo: "Enjoo", coceira: "Coceira", tontura: "Tontura percebida", outro: "Outro desconforto" },
  regiao: {
    cabeca: "Cabeça", boca_dentes: "Boca ou dentes", ouvido: "Ouvido", garganta: "Garganta", peito: "Peito",
    barriga: "Barriga", costas: "Costas", bracos: "Braços", pernas: "Pernas", pele: "Pele", outra: "Outra região",
    nao_sei: "Não sei",
  },
  observado: {
    calmo: "Calmo", choro: "Choro", irritacao: "Irritação", agitacao: "Agitação", isolamento: "Isolamento",
    agressividade: "Agressividade", autoagressao: "Autoagressão", outro: "Outro",
  },
  higiene: { banho: "Banho", escovacao: "Escovação", troca: "Troca", outro: "Outro" },
  evacuacao: { xixi: "Xixi", coco: "Cocô" },
  ondeEvacuacao: { vaso: "No vaso ou penico", fralda: "Na fralda", escape: "Escape (na roupa)" },
  positivo: {
    comunicacao: "Comunicação", atividade: "Atividade", conquista: "Conquista", tranquilo: "Período tranquilo",
    estrategia: "Estratégia que funcionou", sem_ajuda: "Fez sem ajuda", interacao: "Interagiu ou compartilhou",
  },
  quantidade: { pouco: "Pouco", metade: "Metade", tudo: "Tudo", recusou: "Recusou" },
  aceitacao: { aceitou: "Aceitou", com_ajuda: "Com ajuda", recusou: "Recusou" },
  lesao: { sim: "Sim", nao: "Não", nao_sei: "Não sei" },
  tipoAlimento: { comida: "Comida", bebida: "Bebida" },
  tipoSono: { noturno: "Sono noturno", cochilo: "Cochilo" },
  local: { casa: "Em casa", escola: "Na escola", parque: "No parque", terapia: "Na terapia" },
  intensidade: {
    leve: { rotulo: "Leve", criterio: "Sem risco de lesão; terminou sozinho ou com redirecionamento simples; a atividade pôde continuar." },
    moderada: { rotulo: "Moderada", criterio: "Interrompeu a atividade ou a rotina; exigiu intervenção ativa do cuidador; sem lesão." },
    intensa: {
      rotulo: "Intensa",
      criterio: "Houve risco ou ocorrência de lesão, na pessoa ou em outros, ou foi preciso ajuda de outra pessoa ou afastar todos do ambiente.",
    },
    nao_sei: { rotulo: "Não sei avaliar", criterio: "Sem informação suficiente para classificar." },
  },
  nomeRegistro: {
    comida: f("Alimentação"), bebida: f("Bebida"),
    dor: f("Dor"), enjoo: m("Enjoo"), coceira: f("Coceira"), tontura: f("Tontura"), desconforto: m("Desconforto"),
    episodio: m("Episódio"), comportamento: m("Comportamento"),
    banho: m("Banho"), escovacao: f("Escovação"), troca: f("Troca"), higiene: f("Higiene"),
    sono: m("Sono"), cochilo: m("Cochilo"), xixi: m("Xixi"), evacuacao: m("Cocô"),
    comunicacao: f("Comunicação"), atividade: f("Atividade"), conquista: f("Conquista"),
    tranquilo: m("Período tranquilo"), estrategia: f("Estratégia que funcionou"),
    sem_ajuda: f("Autonomia"), interacao: f("Interação"),
  },
  registrado: (n) => `${n.nome} ${n.genero === "f" ? "registrada" : "registrado"}`,
  suspeitaRegistrada: (n) => `Suspeita registrada: ${n.nome.toLowerCase()}`,
  paraODia: (dia) => `para ${dia}`,
  hoje: "hoje",
  ontem: "ontem",
  hora: (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  porVoltaDe: (hora) => `por volta de ${hora}`,
  diaCurto: (dia, mes) => `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`,
  diaPorExtenso: (dia, mes) => `${dia} de ${MESES[mes - 1]}`,
  duracao,
  ultimaRefeicao: (hora, distancia) => `Última refeição registrada: ${hora} (${distancia})`,
  noMesmoHorario: "no mesmo horário",
  antes: (d) => `${d} antes`,
};
