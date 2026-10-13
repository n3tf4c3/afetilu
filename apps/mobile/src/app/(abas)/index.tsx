import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CATEGORIAS,
  chaveDoDia,
  diaPorExtenso,
  ehEpisodio,
  somarDias,
  type Categoria,
  type DiaAnotado,
  type Registro,
} from "@eloazul/core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ICONE_CATEGORIA, ICONE_SEM_CRISES } from "../../components/icones";
import { ItemRegistro } from "../../components/item-registro";
import { Chip, Secao, estilos as ui, type NomeIcone } from "../../components/ui";
import { useApp, useTextos } from "../../lib/estado";
import { desmarcarSemCrises, listarDiasAnotados, listarRegistros, marcarSemCrises } from "../../lib/repositorio";
import { cor, espaco, raio, texto } from "../../lib/tema";

/** Registros em aberto aparecem por alguns dias para lembrar de anotar o término. */
const DIAS_EM_ABERTO = 7;

function BotaoCategoria(props: { rotulo: string; icone: NomeIcone; onPress: () => void; marcado?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.rotulo}
      accessibilityState={props.marcado !== undefined ? { checked: props.marcado } : undefined}
      onPress={props.onPress}
      style={({ pressed }) => [estilos.categoria, props.marcado && estilos.categoriaMarcada, pressed && { opacity: 0.85 }]}
    >
      <MaterialCommunityIcons name={props.icone} size={30} color={cor.primaria} />
      <Text style={estilos.categoriaTexto}>{props.rotulo}</Text>
    </Pressable>
  );
}

export default function Inicio() {
  const { db, pessoas, pessoaAtiva, escolherPessoa, versaoDados, notificarMudanca, oferecerDesfazer } = useApp();
  const { t, d } = useTextos();
  const ti = t.inicio;
  const [hojeRegistros, setHojeRegistros] = useState<Registro[]>([]);
  const [emAberto, setEmAberto] = useState<Registro[]>([]);
  const [anotacaoHoje, setAnotacaoHoje] = useState<DiaAnotado | null>(null);
  const hoje = chaveDoDia(new Date());

  useEffect(() => {
    if (!pessoaAtiva) return;
    let ativo = true;
    void (async () => {
      const recentes = await listarRegistros(db, pessoaAtiva.id, somarDias(hoje, -DIAS_EM_ABERTO), hoje);
      const dias = await listarDiasAnotados(db, pessoaAtiva.id, hoje, hoje);
      if (!ativo) return;
      setHojeRegistros(recentes.filter((r) => r.ocorreuDia === hoje));
      setEmAberto(recentes.filter((r) => r.emAberto));
      setAnotacaoHoje(dias.find((d) => d.semCrises) ?? null);
    })();
    return () => {
      ativo = false;
    };
  }, [db, pessoaAtiva, versaoDados, hoje]);

  if (!pessoaAtiva) return null;

  const abrir = (categoria: Categoria) => router.push({ pathname: "/registro/[categoria]", params: { categoria } });

  const alternarSemCrises = () => {
    if (anotacaoHoje) {
      void desmarcarSemCrises(db, pessoaAtiva.id, hoje).then(notificarMudanca);
      return;
    }
    const marcar = async () => {
      await marcarSemCrises(db, pessoaAtiva.id, hoje);
      notificarMudanca();
      oferecerDesfazer(ti.hojeMarcadoSemCrises, () => desmarcarSemCrises(db, pessoaAtiva.id, hoje));
    };
    if (hojeRegistros.some(ehEpisodio)) {
      Alert.alert(ti.episodioHojeTitulo, ti.episodioHojeTexto, [
        { text: t.geral.cancelar, style: "cancel" },
        { text: t.geral.marcar, onPress: () => void marcar() },
      ]);
    } else {
      void marcar();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: 120 }}>
        <View style={{ gap: espaco.xs }}>
          <Text style={texto.titulo} accessibilityRole="header">
            {pessoaAtiva.apelido}
          </Text>
          <Text style={texto.suave}>{ti.hoje(diaPorExtenso(hoje, d))}</Text>
        </View>

        {pessoas.length > 1 ? (
          <View style={ui.linhaChips} accessibilityRole="radiogroup" accessibilityLabel={ti.pessoaAcompanhada}>
            {pessoas.map((p) => (
              <Chip key={p.id} rotulo={p.apelido} selecionado={p.id === pessoaAtiva.id} onPress={() => void escolherPessoa(p.id)} />
            ))}
          </View>
        ) : null}

        <View style={estilos.grade}>
          {CATEGORIAS.map((c) => (
            <BotaoCategoria key={c} rotulo={d.categoria[c]} icone={ICONE_CATEGORIA[c]} onPress={() => abrir(c)} />
          ))}
          <BotaoCategoria
            rotulo={anotacaoHoje ? ti.diaSemCrisesMarcado : ti.diaSemCrises}
            icone={ICONE_SEM_CRISES}
            marcado={!!anotacaoHoje}
            onPress={alternarSemCrises}
          />
        </View>

        {emAberto.length > 0 ? (
          <Secao titulo={ti.emAbertoTitulo}>
            <Text style={texto.suave}>{ti.emAbertoAjuda}</Text>
            {emAberto.map((r) => (
              <ItemRegistro key={r.id} registro={r} hoje={hoje} />
            ))}
          </Secao>
        ) : null}

        <Secao titulo={ti.hojeTitulo}>
          {hojeRegistros.length === 0 && !anotacaoHoje ? (
            <Text style={texto.suave}>{ti.nenhumHoje}</Text>
          ) : null}
          {anotacaoHoje ? <Text style={texto.corpo}>{ti.marcadoSemCrises}</Text> : null}
          {hojeRegistros.map((r) => (
            <ItemRegistro key={r.id} registro={r} hoje={hoje} />
          ))}
        </Secao>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  grade: { flexDirection: "row", flexWrap: "wrap", gap: espaco.m },
  categoria: {
    width: "47.5%",
    minHeight: 96,
    backgroundColor: cor.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cor.borda,
    padding: espaco.m,
    gap: espaco.s,
    justifyContent: "center",
  },
  categoriaMarcada: { borderColor: cor.primaria, backgroundColor: cor.primariaClara },
  categoriaTexto: { fontSize: 16, fontWeight: "600", color: cor.texto },
});
