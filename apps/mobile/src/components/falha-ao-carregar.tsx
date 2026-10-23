import { View } from "react-native";
import { useTextos } from "../lib/estado";
import { espaco } from "../lib/tema";
import { Aviso, Botao } from "./ui";

/** Leitura que falhou, com nova tentativa. Nunca no lugar de "sem informação". */
export function FalhaAoCarregar(props: { tentarDeNovo: () => void }) {
  const { t } = useTextos();
  return (
    <View style={{ gap: espaco.s }}>
      <Aviso tipo="alerta" texto={t.geral.falhaCarregar} />
      <Botao variante="secundaria" rotulo={t.geral.tentarDeNovo} onPress={props.tentarDeNovo} />
    </View>
  );
}
