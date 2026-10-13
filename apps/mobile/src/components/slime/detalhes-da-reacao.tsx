import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { cor, espaco, raio } from "../../lib/tema";
import type { Movimento } from "./cena-slime";
import type { Reacao } from "./reacoes";

// Detalhes 2D sobre a cena 3D (docs/experiencia-avatar.md, 3.2): "z z" no sono e balão com a
// região registrada na dor. Decorativos: a legenda do registro já é anunciada ao leitor de tela.

/** Quanto tempo o detalhe fica visível (um pouco menos que o clipe, para sumir antes da volta ao neutro). */
const DURACAO_MS: Partial<Record<Reacao, number>> = { sono: 2700, desconforto: 2200 };
const ENTRADA_MS = 250;
const SAIDA_MS = 300;

export interface DetalhesDaReacaoProps {
  reacao: Reacao | null;
  disparo: number;
  /** Nome da região já traduzido; o balão só aparece na dor com região conhecida. */
  regiao?: string;
  movimento: Movimento;
  /** Altura da área do slime, para posicionar os detalhes junto ao corpo. */
  altura: number;
}

export const DetalhesDaReacao = memo(function DetalhesDaReacao({ reacao, disparo, regiao, movimento, altura }: DetalhesDaReacaoProps) {
  const [visivel, setVisivel] = useState<"sono" | "regiao" | null>(null);
  const opacidade = useRef(new Animated.Value(0)).current;
  const subida = useRef(new Animated.Value(0)).current;

  // Só reage a disparos novos: voltar à tela não repete o detalhe.
  const ultimoDisparo = useRef(disparo);
  useEffect(() => {
    if (disparo === ultimoDisparo.current) return;
    ultimoDisparo.current = disparo;
    const tipo = reacao === "sono" ? "sono" : reacao === "desconforto" && regiao ? "regiao" : null;
    opacidade.stopAnimation();
    subida.stopAnimation();
    setVisivel(tipo);
    if (!tipo || !reacao) return;

    const duracao = DURACAO_MS[reacao] ?? 2000;
    if (movimento === "nenhum") {
      opacidade.setValue(1);
      subida.setValue(0);
    } else {
      opacidade.setValue(0);
      subida.setValue(0);
      Animated.timing(opacidade, { toValue: 1, duration: ENTRADA_MS, useNativeDriver: true }).start();
      // Só o "z z" sobe, e só com movimento completo; no reduzido, apenas aparece e some.
      if (movimento === "completo" && tipo === "sono") {
        Animated.timing(subida, { toValue: 1, duration: duracao, useNativeDriver: true }).start();
      }
    }
    const saida = setTimeout(() => {
      if (movimento === "nenhum") setVisivel(null);
      else Animated.timing(opacidade, { toValue: 0, duration: SAIDA_MS, useNativeDriver: true }).start(() => setVisivel(null));
    }, duracao - (movimento === "nenhum" ? 0 : SAIDA_MS));
    return () => clearTimeout(saida);
  }, [disparo, reacao, regiao, movimento, opacidade, subida]);

  if (!visivel) return null;

  const deslocamento = subida.interpolate({ inputRange: [0, 1], outputRange: [0, -altura * 0.08] });
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {visivel === "sono" ? (
        <Animated.View
          style={[
            estilos.sono,
            { top: altura * 0.2, left: "50%", marginLeft: altura * 0.26, opacity: opacidade, transform: [{ translateY: deslocamento }] },
          ]}
        >
          <MaterialCommunityIcons name="sleep" size={30} color={cor.primaria} />
        </Animated.View>
      ) : (
        <Animated.View style={[estilos.balaoLinha, { top: altura * 0.02, opacity: opacidade }]}>
          <View style={estilos.balao}>
            <Text style={estilos.balaoTexto} numberOfLines={1}>
              {regiao}
            </Text>
          </View>
          <View style={estilos.balaoPonta} />
        </Animated.View>
      )}
    </View>
  );
});

const FUNDO = "rgba(255, 255, 255, 0.92)";

const estilos = StyleSheet.create({
  sono: { position: "absolute", backgroundColor: FUNDO, borderRadius: 24, padding: espaco.s },
  balaoLinha: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  balao: { backgroundColor: FUNDO, borderRadius: raio.m, paddingHorizontal: espaco.l, paddingVertical: espaco.s, maxWidth: "70%" },
  balaoTexto: { fontSize: 16, fontWeight: "700", color: cor.texto },
  balaoPonta: { width: 14, height: 14, marginTop: -8, backgroundColor: FUNDO, transform: [{ rotate: "45deg" }] },
});
