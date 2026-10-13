import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AvisoDesfazer } from "../components/aviso-desfazer";
import { Aviso, Botao } from "../components/ui";
import { ProvedorApp, useTextos } from "../lib/estado";
import { cor, espaco, texto } from "../lib/tema";

function TelaErroBanco(props: { falha: "sem_cifra" | "nao_abriu"; causa?: string; recomecar: () => Promise<void> }) {
  const { t } = useTextos();
  const e = t.erroBanco;
  const [apagando, setApagando] = useState(false);
  if (props.falha === "sem_cifra") {
    return (
      <View style={{ flex: 1, padding: espaco.xl, justifyContent: "center", gap: espaco.l, backgroundColor: cor.fundo }}>
        <Text style={texto.titulo}>{e.semCifraTitulo}</Text>
        <Aviso tipo="alerta" texto={e.semCifraTexto} />
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: espaco.xl, justifyContent: "center", gap: espaco.l, backgroundColor: cor.fundo }}>
      <Text style={texto.titulo} accessibilityRole="header">
        {e.naoAbriuTitulo}
      </Text>
      <Text style={texto.corpo}>{e.naoAbriuTexto}</Text>
      {__DEV__ && props.causa ? <Text style={texto.suave}>{props.causa}</Text> : null}
      <Aviso tipo="alerta" texto={e.comecarDoZeroAviso} />
      <Botao
        variante="perigo"
        rotulo={e.comecarDoZero}
        desabilitado={apagando}
        onPress={() =>
          Alert.alert(e.confirmarTitulo, e.confirmarTexto, [
            { text: t.geral.cancelar, style: "cancel" },
            {
              text: t.geral.apagar,
              style: "destructive",
              onPress: () => {
                setApagando(true);
                void props.recomecar().finally(() => setApagando(false));
              },
            },
          ])
        }
      />
    </ScrollView>
  );
}

function Carregando() {
  const { t } = useTextos();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cor.fundo }}>
      <ActivityIndicator color={cor.primaria} accessibilityLabel={t.geral.abrindoDados} />
    </View>
  );
}

function Navegacao() {
  const { t } = useTextos();
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cor.fundo },
          headerTintColor: cor.primaria,
          headerTitleStyle: { color: cor.texto },
          contentStyle: { backgroundColor: cor.fundo },
        }}
      >
        <Stack.Screen name="(abas)" options={{ headerShown: false }} />
        <Stack.Screen name="primeiro-uso" options={{ headerShown: false }} />
        <Stack.Screen name="registro/[categoria]" options={{ presentation: "modal", title: t.registro.titulo }} />
        <Stack.Screen name="detalhe/[id]" options={{ title: t.detalhe.titulo }} />
        <Stack.Screen name="apagar" />
      </Stack>
      <AvisoDesfazer />
    </View>
  );
}

export default function Raiz() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProvedorApp>
        {(situacao, recomecar) =>
          situacao.tipo === "carregando" ? (
            <Carregando />
          ) : situacao.tipo === "erro" ? (
            <TelaErroBanco falha={situacao.falha} causa={situacao.causa} recomecar={recomecar} />
          ) : (
            <Navegacao />
          )
        }
      </ProvedorApp>
    </SafeAreaProvider>
  );
}
