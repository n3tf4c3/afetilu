import type { Categoria } from "@afetilu/core";
import type { NomeIcone } from "./ui";

// Ícones Material Community (licença Apache 2.0, via @expo/vector-icons).
export const ICONE_CATEGORIA: Record<Categoria, NomeIcone> = {
  alimentacao: "silverware-fork-knife",
  dor_desconforto: "bandage",
  comportamento: "emoticon-outline",
  higiene: "shower",
  sono: "weather-night",
  evacuacao: "toilet",
  positivo: "star-outline",
};

export const ICONE_SEM_CRISES: NomeIcone = "check-circle-outline";
