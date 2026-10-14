/**
 * Links externos (`afetilu://…`) não abrem telas internas: o app não depende deles, e o parsing do
 * query string no expo-router passa por uma biblioteca com falha conhecida de travamento
 * (decode-uri-component, GHSA-vcc3-ghjq-m6fr). Também impede que um link de terceiros abra
 * direto telas como "Apagar" ou "Restaurar". O path recebido nunca é repassado.
 *
 * Abrindo o app por um link: vai para o início. Com o app já aberto: fica onde está.
 */
export function destinoDeLinkExterno(evento: { path: string; initial: boolean }): string | null {
  return evento.initial ? "/" : null;
}
