import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIAS, diaPorExtenso } from "@afetilu/core";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp, useTextos } from "../lib/estado";
import { cor, espaco, raio, texto } from "../lib/tema";
import { useHoje } from "../lib/usar-hoje";
import { ICONE_CATEGORIA, ICONE_SEM_CRISES } from "./icones";
import { FalhaAoCarregar } from "./falha-ao-carregar";
import { ItemRegistro } from "./item-registro";
import { Chip, Secao, estilos as ui, type NomeIcone } from "./ui";

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

/** Tela inicial sem o mascote: grade de categorias e lista do dia. O app inteiro funciona nela. */
export function InicioSimples() {
  const { pessoas, pessoaAtiva, escolherPessoa, tentar } = useApp();
  const { t, d } = useTextos();
  const ti = t.inicio;
  const { hoje, hojeRegistros, emAberto, anotacaoHoje, carregado, falhou, tentarDeNovo, abrirRegistro, alternarSemCrises } = useHoje();
  if (!pessoaAtiva) return null;

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
              <Chip key={p.id} rotulo={p.apelido} selecionado={p.id === pessoaAtiva.id} onPress={() => tentar(() => escolherPessoa(p.id))} />
            ))}
          </View>
        ) : null}

        <View style={estilos.grade}>
          {CATEGORIAS.map((c) => (
            <BotaoCategoria key={c} rotulo={d.categoria[c]} icone={ICONE_CATEGORIA[c]} onPress={() => abrirRegistro(c)} />
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
          {falhou ? <FalhaAoCarregar tentarDeNovo={tentarDeNovo} /> : null}
          {carregado && hojeRegistros.length === 0 && !anotacaoHoje ? <Text style={texto.suave}>{ti.nenhumHoje}</Text> : null}
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
