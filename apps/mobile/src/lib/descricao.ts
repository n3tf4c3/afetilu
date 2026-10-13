import { rotuloDoDia, type DicionarioDominio, type EntradaRegistro } from "@afetilu/core";
import type { TextosApp } from "../i18n/tipo";

export interface LinhaDescricao {
  rotulo: string;
  valor: string;
}

/**
 * Descrição completa e literal de um registro, campo a campo, nas palavras do
 * responsável. Campos vazios não aparecem.
 */
export function descreverRegistro(
  r: EntradaRegistro,
  hoje: string,
  chaveDoDia: (d: Date) => string,
  d: DicionarioDominio,
  t: TextosApp["descricao"],
): LinhaDescricao[] {
  const linhas: LinhaDescricao[] = [{ rotulo: t.categoria, valor: d.categoria[r.detalhe.categoria] }];
  const add = (rotulo: string, valor: string | undefined) => {
    if (valor && valor.trim()) linhas.push({ rotulo, valor });
  };
  const dataHora = (iso: string) => {
    const x = new Date(iso);
    return `${rotuloDoDia(chaveDoDia(x), hoje, d)}, ${d.hora(x)}`;
  };

  const det = r.detalhe;
  switch (det.categoria) {
    case "alimentacao":
      add(t.tipo, d.tipoAlimento[det.tipo]);
      add(t.oQue, det.item);
      add(t.quantidade, det.quantidade && d.quantidade[det.quantidade]);
      add(t.comoFicouDepois, det.comoFicouDepois);
      break;
    case "dor_desconforto":
      add(t.tipoPercebido, d.desconforto[det.tipo]);
      add(t.regiao, det.regiao && d.regiao[det.regiao]);
      add(t.intensidadePercebida, det.intensidade && d.intensidade[det.intensidade].rotulo);
      add(t.sinais, det.sinais);
      break;
    case "comportamento":
      add(t.observado, det.observado.map((o) => d.observado[o]).join(", "));
      add(t.episodio, det.ehEpisodio ? t.sim : undefined);
      if (det.episodio) {
        const e = det.episodio;
        add(t.duracao, e.duracaoMin !== undefined ? d.duracao(e.duracaoMin) : undefined);
        if (e.intensidade) {
          const c = d.intensidade[e.intensidade];
          add(t.intensidade, `${c.rotulo} — ${c.criterio}`);
        }
        add(t.contextoAnterior, e.contextoAntes);
        add(t.oQueCuidadorFez, e.medidas);
        add(t.desfecho, e.desfecho);
        add(t.lesao, e.lesao && d.lesao[e.lesao]);
        add(t.oQueAjudou, e.ajudou?.join(", "));
      }
      break;
    case "higiene":
      add(t.tipo, d.higiene[det.tipo]);
      add(t.aceitacao, det.aceitacao && d.aceitacao[det.aceitacao]);
      break;
    case "sono":
      add(t.tipo, d.tipoSono[det.tipo]);
      add(t.despertares, det.despertares !== undefined ? String(det.despertares) : undefined);
      break;
    case "evacuacao":
      add(t.aspecto, det.aspecto);
      break;
    case "positivo":
      add(t.tipo, d.positivo[det.tipo]);
      add(t.descricao, det.descricao);
      break;
  }

  if (r.emAberto) add(t.termino, t.terminoEmAberto);
  else add(t.termino, r.ocorreuFim && dataHora(r.ocorreuFim));
  add(t.local, r.local && d.local[r.local]);
  add(t.origem, d.origem[r.origem] + (r.origemQuem ? ` (${r.origemQuem})` : ""));
  add(t.observacao, r.observacao);
  return linhas;
}
