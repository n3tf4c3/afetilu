import { n, type DicionarioDominio } from "./tipo";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const duration = (min: number) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
};

export const en: DicionarioDominio = {
  categoria: {
    alimentacao: "Food and drinks",
    dor_desconforto: "Pain and discomfort",
    comportamento: "Emotions and behaviors",
    higiene: "Bathing and hygiene",
    sono: "Sleep and rest",
    evacuacao: "Bowel movements",
    positivo: "Activities and achievements",
  },
  origem: { vi: "I saw it", me_contaram: "Someone told me", suspeita: "My suspicion" },
  periodo: { madrugada: "overnight", manha: "in the morning", tarde: "in the afternoon", noite: "in the evening" },
  periodoCurto: { madrugada: "Overnight", manha: "Morning", tarde: "Afternoon", noite: "Evening" },
  desconforto: { dor: "Pain", enjoo: "Nausea", coceira: "Itching", tontura: "Seemed dizzy", outro: "Other discomfort" },
  regiao: {
    cabeca: "Head", boca_dentes: "Mouth or teeth", ouvido: "Ear", garganta: "Throat", peito: "Chest",
    barriga: "Belly", costas: "Back", bracos: "Arms", pernas: "Legs", pele: "Skin", outra: "Other area",
    nao_sei: "Not sure",
  },
  observado: {
    calmo: "Calm", choro: "Crying", irritacao: "Irritability", agitacao: "Agitation", isolamento: "Withdrawal",
    agressividade: "Aggression", autoagressao: "Self-injury", outro: "Other",
  },
  higiene: { banho: "Bath", escovacao: "Toothbrushing", troca: "Diaper or clothes change", outro: "Other" },
  positivo: {
    comunicacao: "Communication", atividade: "Activity", conquista: "Achievement", tranquilo: "Calm period",
    estrategia: "Strategy that worked",
  },
  quantidade: { pouco: "A little", metade: "About half", tudo: "All of it", recusou: "Refused" },
  aceitacao: { aceitou: "Accepted", com_ajuda: "With help", recusou: "Refused" },
  lesao: { sim: "Yes", nao: "No", nao_sei: "Not sure" },
  tipoAlimento: { comida: "Food", bebida: "Drink" },
  tipoSono: { noturno: "Night sleep", cochilo: "Nap" },
  intensidade: {
    leve: { rotulo: "Mild", criterio: "No risk of injury; ended on its own or with simple redirection; the activity could continue." },
    moderada: { rotulo: "Moderate", criterio: "Interrupted the activity or routine; required active intervention by the caregiver; no injury." },
    intensa: {
      rotulo: "Severe",
      criterio: "There was risk of injury or an injury, to the person or others, or another person's help or clearing the room was needed.",
    },
    nao_sei: { rotulo: "Not sure", criterio: "Not enough information to classify." },
  },
  nomeRegistro: {
    comida: n("Meal"), bebida: n("Drink"),
    dor: n("Pain"), enjoo: n("Nausea"), coceira: n("Itching"), tontura: n("Dizziness"), desconforto: n("Discomfort"),
    episodio: n("Episode"), comportamento: n("Behavior"),
    banho: n("Bath"), escovacao: n("Toothbrushing"), troca: n("Change"), higiene: n("Hygiene"),
    sono: n("Sleep"), cochilo: n("Nap"), evacuacao: n("Bowel movement"),
    comunicacao: n("Communication"), atividade: n("Activity"), conquista: n("Achievement"),
    tranquilo: n("Calm period"), estrategia: n("Strategy that worked"),
  },
  registrado: (x) => `${x.nome} logged`,
  suspeitaRegistrada: (x) => `Suspicion logged: ${x.nome.toLowerCase()}`,
  paraODia: (dia) => `for ${dia}`,
  hoje: "today",
  ontem: "yesterday",
  hora: (d) => {
    const h = d.getHours();
    return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  },
  porVoltaDe: (hora) => `around ${hora}`,
  diaCurto: (dia, mes) => `${mes}/${dia}`,
  diaPorExtenso: (dia, mes) => `${MONTHS[mes - 1]} ${dia}`,
  duracao: duration,
  ultimaRefeicao: (hora, distancia) => `Last logged meal: ${hora} (${distancia})`,
  noMesmoHorario: "at the same time",
  antes: (d) => `${d} before`,
};
