import type { DicionarioDominio } from "./i18n/tipo";

// Datas no fuso local do aparelho. O "dia" do registro é gravado no lançamento,
// para que uma viagem ou mudança de fuso não mova o evento de dia.

const dois = (n: number) => String(n).padStart(2, "0");

export function chaveDoDia(data: Date): string {
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

/** Interpreta "AAAA-MM-DD" como meia-noite local. */
export function dataDaChave(chave: string): Date {
  const [a, m, d] = chave.split("-").map(Number);
  return new Date(a!, m! - 1, d!);
}

export function somarDias(chave: string, dias: number): string {
  const data = dataDaChave(chave);
  data.setDate(data.getDate() + dias);
  return chaveDoDia(data);
}

/** Dias de `inicio` a `fim`, inclusive, em ordem crescente. */
export function diasDoPeriodo(inicio: string, fim: string): string[] {
  if (inicio > fim) return [];
  const dias: string[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) dias.push(d);
  return dias;
}

export function minutosEntre(antes: Date, depois: Date): number {
  return Math.round((depois.getTime() - antes.getTime()) / 60000);
}

/** "hoje", "ontem" ou a data curta do idioma ("12/10", "10/12"). */
export function rotuloDoDia(chave: string, hoje: string, t: DicionarioDominio): string {
  if (chave === hoje) return t.hoje;
  if (chave === somarDias(hoje, -1)) return t.ontem;
  const [, m, d] = chave.split("-").map(Number);
  return t.diaCurto(d!, m!);
}

/** "13 de outubro", "October 13". */
export function diaPorExtenso(chave: string, t: DicionarioDominio): string {
  const [, m, d] = chave.split("-").map(Number);
  return t.diaPorExtenso(d!, m!);
}
