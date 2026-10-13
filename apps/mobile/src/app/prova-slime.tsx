import { Redirect, Stack } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { CenaSlime, type Movimento } from "../components/slime/cena-slime";
import type { Reacao } from "../components/slime/reacoes";
import { Chip, Secao, estilos } from "../components/ui";
import { cor, espaco, texto } from "../lib/tema";

// Tela de prova técnica do slime 3D. Só existe em builds de desenvolvimento (textos sem tradução).

const REACOES: Reacao[] = ["alimentacao", "enjoo", "desconforto", "sono", "banho", "positivo", "episodio", "neutro"];
const MOVIMENTOS: Movimento[] = ["completo", "reduzido", "nenhum"];
const ESTILO_CENA = { height: 320, borderRadius: 20, borderWidth: 1, borderColor: cor.borda };

export default function ProvaSlime() {
  const [reacao, setReacao] = useState<Reacao | null>(null);
  const [disparo, setDisparo] = useState(0);
  const [movimento, setMovimento] = useState<Movimento>("completo");
  const [continua, setContinua] = useState(false);
  const [qps, setQps] = useState(0);
  const [amostras, setAmostras] = useState<number[]>([]);

  const medir = useCallback((v: number) => {
    setQps(v);
    setAmostras((a) => [...a.slice(-59), v]);
  }, []);

  if (!__DEV__) return <Redirect href="/" />;

  const lista = amostras;
  const media = lista.length ? lista.reduce((a, b) => a + b, 0) / lista.length : 0;
  const minimo = lista.length ? Math.min(...lista) : 0;

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l }}>
      <Stack.Screen options={{ title: "Prova técnica: slime 3D" }} />
      <CenaSlime
        reacao={reacao}
        disparo={disparo}
        movimento={movimento}
        corDeFundo={cor.fundo}
        aoMedirQps={medir}
        renderizacao={continua ? "continua" : "sob_demanda"}
        style={ESTILO_CENA}
      />
      <View accessibilityLiveRegion="polite">
        <Text style={texto.corpo} testID="qps">
          QPS agora {qps.toFixed(0)} · média 60 s {media.toFixed(1)} · mínimo {minimo.toFixed(0)} ({lista.length} amostras)
        </Text>
      </View>
      <Secao titulo="Reação">
        <View style={estilos.linhaChips}>
          {REACOES.map((r) => (
            <Chip
              key={r}
              rotulo={r}
              selecionado={reacao === r}
              onPress={() => {
                setReacao(r);
                setDisparo((d) => d + 1);
              }}
            />
          ))}
        </View>
      </Secao>
      <Secao titulo="Renderização">
        <View style={estilos.linhaChips}>
          <Chip rotulo="sob demanda" selecionado={!continua} onPress={() => setContinua(false)} />
          <Chip rotulo="contínua (medição)" selecionado={continua} onPress={() => setContinua(true)} />
        </View>
      </Secao>
      <Secao titulo="Movimento">
        <View style={estilos.linhaChips}>
          {MOVIMENTOS.map((m) => (
            <Chip key={m} rotulo={m} selecionado={movimento === m} onPress={() => setMovimento(m)} />
          ))}
        </View>
      </Secao>
    </ScrollView>
  );
}
