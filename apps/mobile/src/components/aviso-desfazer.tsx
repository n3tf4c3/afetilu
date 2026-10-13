import { useEffect } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp, useTextos } from "../lib/estado";
import { ALVO_MINIMO, cor, espaco, raio } from "../lib/tema";

/** Confirmação textual do registro salvo, com "Desfazer" por alguns segundos. */
export function AvisoDesfazer() {
  const { desfazer, executarDesfazer } = useApp();
  const { t } = useTextos();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (desfazer) AccessibilityInfo.announceForAccessibility(desfazer.texto);
  }, [desfazer]);

  if (!desfazer) return null;
  return (
    <View style={[estilos.barra, { bottom: insets.bottom + 72 }]} accessibilityLiveRegion="polite">
      <Text style={estilos.texto} numberOfLines={2}>
        {desfazer.texto}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.desfazer.rotulo}
        onPress={() => void executarDesfazer()}
        style={estilos.botao}
      >
        <Text style={estilos.botaoTexto}>{t.desfazer.botao}</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  barra: {
    position: "absolute",
    left: espaco.l,
    right: espaco.l,
    backgroundColor: cor.texto,
    borderRadius: raio.m,
    paddingLeft: espaco.l,
    paddingRight: espaco.xs,
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.s,
  },
  texto: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  botao: { minHeight: ALVO_MINIMO, minWidth: ALVO_MINIMO, paddingHorizontal: espaco.m, justifyContent: "center" },
  botaoTexto: { color: "#BFD9F5", fontSize: 16, fontWeight: "700" },
});
