import { MaterialCommunityIcons } from "@expo/vector-icons";
import { legendaDoRegistro, type Registro } from "@eloazul/core";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTextos } from "../lib/estado";
import { ALVO_MINIMO, cor, espaco, texto } from "../lib/tema";
import { ICONE_CATEGORIA } from "./icones";

export function ItemRegistro({ registro, hoje }: { registro: Registro; hoje: string }) {
  const { t, d } = useTextos();
  const legenda = legendaDoRegistro(registro, hoje, d);
  const extras = [
    registro.origem !== "vi" ? d.origem[registro.origem] : null,
    registro.emAberto ? t.item.emAberto : null,
    registro.versao > 1 ? t.item.corrigido : null,
  ].filter(Boolean);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[legenda, ...extras].join(". ")}
      accessibilityHint={t.item.abreDetalhes}
      onPress={() => router.push({ pathname: "/detalhe/[id]", params: { id: registro.id } })}
      style={({ pressed }) => [estilos.item, pressed && { opacity: 0.8 }]}
    >
      <MaterialCommunityIcons name={ICONE_CATEGORIA[registro.detalhe.categoria]} size={22} color={cor.primaria} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={texto.corpo}>{legenda}</Text>
        {extras.length ? <Text style={texto.suave}>{extras.join(" · ")}</Text> : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={cor.textoSuave} />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  item: { minHeight: ALVO_MINIMO, flexDirection: "row", alignItems: "center", gap: espaco.m, paddingVertical: espaco.xs },
});
