import { chaveDoDia, LIMITES } from "@afetilu/core";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { SeletorDia } from "../components/seletor-data";
import { Aviso, Botao, Campo } from "../components/ui";
import { useApp, useTextos } from "../lib/estado";
import { criarMudanca } from "../lib/repositorio";
import { espaco, texto } from "../lib/tema";

/**
 * Mudança na rotina (troca de escola, viagem, férias): contexto com data, nas palavras do
 * responsável. Não é registro da pessoa e não entra na cobertura dos dias.
 */
export default function Mudanca() {
  const { db, pessoaAtiva, notificarMudanca } = useApp();
  const { t } = useTextos();
  const tm = t.mudanca;
  const [dia, setDia] = useState(() => chaveDoDia(new Date()));
  const [conteudo, setConteudo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  if (!pessoaAtiva) return null;

  const salvar = async () => {
    if (!conteudo.trim()) {
      setErro(tm.erroVazio);
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      await criarMudanca(db, pessoaAtiva.id, dia, conteudo);
      notificarMudanca();
      router.back();
    } catch {
      setErro(tm.erroSalvar);
      setSalvando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: tm.titulo }} />
      <Text style={texto.corpo}>{tm.explicacao}</Text>
      <SeletorDia dia={dia} onChange={setDia} maximo={new Date()} />
      <Campo rotulo={tm.texto} valor={conteudo} onChange={setConteudo} max={LIMITES.anotacao} dica={tm.textoDica} multilinha />
      {erro ? <Aviso tipo="alerta" texto={erro} /> : null}
      <Botao rotulo={tm.salvar} desabilitado={salvando} onPress={() => void salvar()} />
    </ScrollView>
  );
}
