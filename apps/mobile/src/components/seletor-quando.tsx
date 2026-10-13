import { chaveDoDia, PERIODOS_DO_DIA, type EscolhaDeQuando } from "@afetilu/core";
import { Text, View } from "react-native";
import { useTextos } from "../lib/estado";
import { espaco, texto } from "../lib/tema";
import { SeletorDataHora, SeletorDia } from "./seletor-data";
import { Chip, Escolha, estilos } from "./ui";

type Atalho = "agora" | "15" | "60" | "data_hora" | "periodo" | "so_data";

function atalhoDe(q: EscolhaDeQuando): Atalho {
  if (q.tipo === "minutos_atras") return q.minutos === 15 ? "15" : "60";
  return q.tipo === "data_hora" ? "data_hora" : q.tipo === "periodo" ? "periodo" : q.tipo === "so_data" ? "so_data" : "agora";
}

/** "Quando aconteceu?" — horário do evento, separado do horário do lançamento. */
export function SeletorQuando(props: { valor: EscolhaDeQuando; onChange: (q: EscolhaDeQuando) => void }) {
  const { t, d } = useTextos();
  const agora = new Date();
  const hoje = chaveDoDia(agora);
  const atual = atalhoDe(props.valor);

  const escolher = (a: Atalho) => {
    switch (a) {
      case "agora":
        return props.onChange({ tipo: "agora" });
      case "15":
        return props.onChange({ tipo: "minutos_atras", minutos: 15 });
      case "60":
        return props.onChange({ tipo: "minutos_atras", minutos: 60 });
      case "data_hora":
        return props.onChange({ tipo: "data_hora", data: agora, aproximado: false });
      case "periodo":
        return props.onChange({ tipo: "periodo", dia: hoje, periodo: "manha" });
      case "so_data":
        return props.onChange({ tipo: "so_data", dia: hoje });
    }
  };

  const atalhos: [Atalho, string][] = [
    ["agora", t.quando.agora],
    ["15", t.quando.ha15],
    ["60", t.quando.ha1h],
    ["data_hora", t.quando.outroHorario],
    ["periodo", t.quando.soPeriodo],
    ["so_data", t.quando.soData],
  ];

  const q = props.valor;
  return (
    <View style={{ gap: espaco.m }}>
      <View style={estilos.linhaChips} accessibilityRole="radiogroup" accessibilityLabel={t.quando.grupo}>
        {atalhos.map(([a, rotulo]) => (
          <Chip key={a} rotulo={rotulo} selecionado={atual === a} onPress={() => escolher(a)} />
        ))}
      </View>
      {q.tipo === "minutos_atras" ? <Text style={texto.suave}>{t.quando.aproximadoAviso}</Text> : null}
      {q.tipo === "data_hora" ? (
        <View style={{ gap: espaco.s }}>
          <SeletorDataHora valor={q.data} maximo={agora} onChange={(data) => props.onChange({ ...q, data })} />
          <Chip
            multiplo
            rotulo={t.quando.horarioAproximado}
            selecionado={q.aproximado}
            onPress={() => props.onChange({ ...q, aproximado: !q.aproximado })}
          />
        </View>
      ) : null}
      {q.tipo === "periodo" ? (
        <View style={{ gap: espaco.s }}>
          <SeletorDia dia={q.dia} maximo={agora} onChange={(dia) => props.onChange({ ...q, dia })} />
          <Escolha
            opcoes={PERIODOS_DO_DIA}
            rotulos={d.periodoCurto}
            valor={q.periodo}
            onChange={(p) => p && props.onChange({ ...q, periodo: p })}
          />
        </View>
      ) : null}
      {q.tipo === "so_data" ? (
        <SeletorDia dia={q.dia} maximo={agora} onChange={(dia) => props.onChange({ ...q, dia })} />
      ) : null}
    </View>
  );
}
