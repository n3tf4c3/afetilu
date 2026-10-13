import { LIMITES } from "@afetilu/core";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Aviso, Botao, Campo, Secao } from "../components/ui";
import { useApp, useTextos } from "../lib/estado";
import { criarPessoa } from "../lib/repositorio";
import { espaco, texto } from "../lib/tema";

export default function PrimeiroUso() {
  const { db, pessoas, recarregarPessoas, escolherPessoa } = useApp();
  const { t } = useTextos();
  const p = t.primeiroUso;
  const [apelido, setApelido] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (pessoas.length > 0) return <Redirect href="/" />;

  const continuar = async () => {
    if (!apelido.trim()) return setErro(p.erroApelido);
    setSalvando(true);
    try {
      const nova = await criarPessoa(db, apelido);
      await escolherPessoa(nova.id);
      await recarregarPessoas();
      router.replace("/");
    } catch {
      setErro(p.erroSalvar);
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: espaco.xl, gap: espaco.l }} keyboardShouldPersistTaps="handled">
          <Text style={texto.titulo} accessibilityRole="header">
            {p.titulo}
          </Text>
          <Text style={texto.corpo}>{p.introducao}</Text>
          <Secao titulo={p.fazTitulo}>
            {p.faz.map((item) => (
              <Text key={item} style={texto.corpo}>
                • {item}
              </Text>
            ))}
          </Secao>
          <Secao titulo={p.naoFazTitulo}>
            {p.naoFaz.map((item) => (
              <Text key={item} style={texto.corpo}>
                • {item}
              </Text>
            ))}
          </Secao>
          <Aviso texto={p.dadosNoAparelho} />
          <Secao titulo={p.quemTitulo}>
            <Campo
              rotulo={p.apelido}
              valor={apelido}
              onChange={(v) => {
                setApelido(v);
                setErro(null);
              }}
              max={LIMITES.apelido}
              dica={p.apelidoDica}
            />
            <Text style={texto.suave}>{p.apelidoAjuda}</Text>
            {erro ? <Aviso tipo="alerta" texto={erro} /> : null}
            <View>
              <Botao rotulo={p.comecar} onPress={() => void continuar()} desabilitado={salvando} />
            </View>
          </Secao>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
