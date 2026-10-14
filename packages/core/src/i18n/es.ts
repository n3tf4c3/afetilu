import { f, m, type DicionarioDominio } from "./tipo";

// Español neutro (latinoamericano). Revisar con hablantes nativos antes de publicar.

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const duracion = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
};

export const es: DicionarioDominio = {
  categoria: {
    alimentacao: "Comidas y bebidas",
    dor_desconforto: "Dolor y malestar",
    comportamento: "Emociones y conductas",
    higiene: "Baño e higiene",
    sono: "Sueño y descanso",
    evacuacao: "Evacuación",
    positivo: "Actividades y logros",
  },
  categoriaCurta: { alimentacao: "Comida", dor_desconforto: "Dolor", comportamento: "Emociones", higiene: "Baño", sono: "Sueño", evacuacao: "Evacuación", positivo: "Logros" },
  origem: { vi: "Lo vi", me_contaram: "Me contaron", suspeita: "Sospecha mía" },
  periodo: { madrugada: "de madrugada", manha: "por la mañana", tarde: "por la tarde", noite: "por la noche" },
  periodoCurto: { madrugada: "Madrugada", manha: "Mañana", tarde: "Tarde", noite: "Noche" },
  desconforto: { dor: "Dolor", enjoo: "Náuseas", coceira: "Picazón", tontura: "Mareo percibido", outro: "Otro malestar" },
  regiao: {
    cabeca: "Cabeza", boca_dentes: "Boca o dientes", ouvido: "Oído", garganta: "Garganta", peito: "Pecho",
    barriga: "Barriga", costas: "Espalda", bracos: "Brazos", pernas: "Piernas", pele: "Piel", outra: "Otra zona",
    nao_sei: "No sé",
  },
  observado: {
    calmo: "Tranquilo", choro: "Llanto", irritacao: "Irritación", agitacao: "Agitación", isolamento: "Aislamiento",
    agressividade: "Agresividad", autoagressao: "Autolesión", outro: "Otro",
  },
  higiene: { banho: "Baño", escovacao: "Cepillado de dientes", troca: "Cambio de pañal o ropa", outro: "Otro" },
  positivo: {
    comunicacao: "Comunicación", atividade: "Actividad", conquista: "Logro", tranquilo: "Periodo tranquilo",
    estrategia: "Estrategia que funcionó", sem_ajuda: "Lo hizo sin ayuda", interacao: "Interactuó o compartió",
  },
  quantidade: { pouco: "Poco", metade: "La mitad", tudo: "Todo", recusou: "Lo rechazó" },
  aceitacao: { aceitou: "Aceptó", com_ajuda: "Con ayuda", recusou: "Rechazó" },
  lesao: { sim: "Sí", nao: "No", nao_sei: "No sé" },
  tipoAlimento: { comida: "Comida", bebida: "Bebida" },
  tipoSono: { noturno: "Sueño nocturno", cochilo: "Siesta" },
  local: { casa: "En casa", escola: "En la escuela", parque: "En el parque", terapia: "En la terapia" },
  intensidade: {
    leve: { rotulo: "Leve", criterio: "Sin riesgo de lesión; terminó solo o con una redirección simple; la actividad pudo continuar." },
    moderada: { rotulo: "Moderada", criterio: "Interrumpió la actividad o la rutina; requirió intervención activa del cuidador; sin lesión." },
    intensa: {
      rotulo: "Intensa",
      criterio: "Hubo riesgo de lesión o una lesión, en la persona o en otros, o fue necesaria la ayuda de otra persona o despejar el lugar.",
    },
    nao_sei: { rotulo: "No sé evaluar", criterio: "No hay información suficiente para clasificar." },
  },
  nomeRegistro: {
    comida: f("Comida"), bebida: f("Bebida"),
    dor: m("Dolor"), enjoo: f("Náusea"), coceira: f("Picazón"), tontura: m("Mareo"), desconforto: m("Malestar"),
    episodio: m("Episodio"), comportamento: f("Conducta"),
    banho: m("Baño"), escovacao: m("Cepillado"), troca: m("Cambio"), higiene: f("Higiene"),
    sono: m("Sueño"), cochilo: f("Siesta"), evacuacao: f("Evacuación"),
    comunicacao: f("Comunicación"), atividade: f("Actividad"), conquista: m("Logro"),
    tranquilo: m("Periodo tranquilo"), estrategia: f("Estrategia que funcionó"),
    sem_ajuda: f("Autonomía"), interacao: f("Interacción"),
  },
  registrado: (x) => `${x.nome} ${x.genero === "f" ? "registrada" : "registrado"}`,
  suspeitaRegistrada: (x) => `Sospecha registrada: ${x.nome.toLowerCase()}`,
  paraODia: (dia) => `para ${dia}`,
  hoje: "hoy",
  ontem: "ayer",
  hora: (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  porVoltaDe: (hora) => `alrededor de las ${hora}`,
  diaCurto: (dia, mes) => `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`,
  diaPorExtenso: (dia, mes) => `${dia} de ${MESES[mes - 1]}`,
  duracao: duracion,
  ultimaRefeicao: (hora, distancia) => `Última comida registrada: ${hora} (${distancia})`,
  noMesmoHorario: "a la misma hora",
  antes: (d) => `${d} antes`,
};
