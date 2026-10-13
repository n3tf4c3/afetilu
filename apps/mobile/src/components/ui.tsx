import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, type ComponentProps, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ALVO_MINIMO, cor, espaco, raio, texto } from "../lib/tema";

export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Variante = "primaria" | "secundaria" | "perigo" | "texto";

export function Botao(props: {
  rotulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  desabilitado?: boolean;
  dica?: string;
}) {
  const v = props.variante ?? "primaria";
  const fundo = v === "primaria" ? cor.primaria : v === "perigo" ? cor.perigoFundo : v === "secundaria" ? cor.superficie : "transparent";
  const frente = v === "primaria" ? cor.sobrePrimaria : v === "perigo" ? cor.perigo : cor.primaria;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.rotulo}
      accessibilityHint={props.dica}
      accessibilityState={{ disabled: !!props.desabilitado }}
      disabled={props.desabilitado}
      onPress={props.onPress}
      style={({ pressed }) => [
        estilos.botao,
        { backgroundColor: fundo, opacity: props.desabilitado ? 0.5 : pressed ? 0.85 : 1 },
        v === "secundaria" && { borderWidth: 1, borderColor: cor.primaria },
        v === "perigo" && { borderWidth: 1, borderColor: cor.perigo },
      ]}
    >
      {props.icone ? <MaterialCommunityIcons name={props.icone} size={20} color={frente} /> : null}
      <Text style={[estilos.botaoTexto, { color: frente }]}>{props.rotulo}</Text>
    </Pressable>
  );
}

export function Chip(props: { rotulo: string; selecionado: boolean; onPress: () => void; multiplo?: boolean }) {
  return (
    <Pressable
      accessibilityRole={props.multiplo ? "checkbox" : "radio"}
      accessibilityState={props.multiplo ? { checked: props.selecionado } : { selected: props.selecionado }}
      accessibilityLabel={props.rotulo}
      onPress={props.onPress}
      style={[estilos.chip, props.selecionado && estilos.chipSelecionado]}
    >
      {props.selecionado ? <MaterialCommunityIcons name="check" size={16} color={cor.primaria} /> : null}
      <Text style={[estilos.chipTexto, props.selecionado && { color: cor.primaria, fontWeight: "600" }]}>{props.rotulo}</Text>
    </Pressable>
  );
}

export function Escolha<T extends string>(props: {
  rotulo?: string;
  opcoes: readonly T[];
  rotulos: Record<T, string>;
  valor: T | undefined;
  onChange: (v: T | undefined) => void;
  /** Permite tocar de novo para desmarcar (campos opcionais). */
  opcional?: boolean;
}) {
  return (
    <View style={{ gap: espaco.s }} accessibilityRole="radiogroup" accessibilityLabel={props.rotulo}>
      {props.rotulo ? <Text style={estilos.rotulo}>{props.rotulo}</Text> : null}
      <View style={estilos.linhaChips}>
        {props.opcoes.map((o) => (
          <Chip
            key={o}
            rotulo={props.rotulos[o]}
            selecionado={props.valor === o}
            onPress={() => props.onChange(props.opcional && props.valor === o ? undefined : o)}
          />
        ))}
      </View>
    </View>
  );
}

export function EscolhaMultipla<T extends string>(props: {
  rotulo?: string;
  opcoes: readonly T[];
  rotulos: Record<T, string>;
  valor: readonly T[];
  onChange: (v: T[]) => void;
}) {
  return (
    <View style={{ gap: espaco.s }}>
      {props.rotulo ? <Text style={estilos.rotulo}>{props.rotulo}</Text> : null}
      <View style={estilos.linhaChips}>
        {props.opcoes.map((o) => {
          const marcado = props.valor.includes(o);
          return (
            <Chip
              key={o}
              multiplo
              rotulo={props.rotulos[o]}
              selecionado={marcado}
              onPress={() => props.onChange(marcado ? props.valor.filter((x) => x !== o) : [...props.valor, o])}
            />
          );
        })}
      </View>
    </View>
  );
}

export function Campo(props: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  multilinha?: boolean;
  max?: number;
  dica?: string;
  /** Sem correção automática nem maiúscula inicial (confirmação digitada). */
  literal?: boolean;
}) {
  return (
    <View style={{ gap: espaco.xs }}>
      <Text style={estilos.rotulo} nativeID={`rotulo-${props.rotulo}`}>
        {props.rotulo}
      </Text>
      <TextInput
        accessibilityLabel={props.rotulo}
        accessibilityLabelledBy={`rotulo-${props.rotulo}`}
        value={props.valor}
        onChangeText={props.onChange}
        multiline={props.multilinha}
        maxLength={props.max}
        placeholder={props.dica}
        autoCorrect={props.literal ? false : undefined}
        autoCapitalize={props.literal ? "none" : undefined}
        spellCheck={props.literal ? false : undefined}
        placeholderTextColor={cor.textoSuave}
        style={[estilos.campo, props.multilinha && { minHeight: 88, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function Secao(props: { titulo?: string; children: ReactNode }) {
  return (
    <View style={estilos.secao}>
      {props.titulo ? (
        <Text style={texto.subtitulo} accessibilityRole="header">
          {props.titulo}
        </Text>
      ) : null}
      {props.children}
    </View>
  );
}

/** Detalhes opcionais ficam recolhidos para manter o registro rápido. */
export function Recolhivel(props: { titulo: string; children: ReactNode; abertoInicial?: boolean }) {
  const [aberto, setAberto] = useState(!!props.abertoInicial);
  return (
    <View style={{ gap: espaco.l }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={props.titulo}
        accessibilityState={{ expanded: aberto }}
        onPress={() => setAberto((a) => !a)}
        style={estilos.recolhivelCabecalho}
      >
        <Text style={texto.subtitulo}>{props.titulo}</Text>
        <MaterialCommunityIcons name={aberto ? "chevron-up" : "chevron-down"} size={24} color={cor.texto} />
      </Pressable>
      {aberto ? <View style={{ gap: espaco.l }}>{props.children}</View> : null}
    </View>
  );
}

export function Aviso(props: { texto: string; tipo?: "info" | "alerta" }) {
  const alerta = props.tipo === "alerta";
  return (
    <View
      accessibilityRole={alerta ? "alert" : undefined}
      style={[estilos.aviso, { backgroundColor: alerta ? cor.alertaFundo : cor.primariaClara }]}
    >
      <MaterialCommunityIcons
        name={alerta ? "alert-circle-outline" : "information-outline"}
        size={20}
        color={alerta ? cor.alerta : cor.primaria}
      />
      <Text style={[texto.corpo, { flex: 1, color: alerta ? cor.alerta : cor.texto }]}>{props.texto}</Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  botao: {
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.l,
    borderRadius: raio.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: espaco.s,
  },
  botaoTexto: { fontSize: 16, fontWeight: "600" },
  chip: {
    minHeight: ALVO_MINIMO,
    paddingHorizontal: espaco.m,
    borderRadius: raio.l,
    borderWidth: 1,
    borderColor: cor.borda,
    backgroundColor: cor.superficie,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.xs,
  },
  chipSelecionado: { borderColor: cor.primaria, backgroundColor: cor.primariaClara },
  chipTexto: { fontSize: 15, color: cor.texto },
  linhaChips: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s },
  rotulo: { fontSize: 15, fontWeight: "600", color: cor.texto },
  campo: {
    minHeight: ALVO_MINIMO,
    borderWidth: 1,
    borderColor: cor.borda,
    borderRadius: raio.s,
    backgroundColor: cor.superficie,
    paddingHorizontal: espaco.m,
    paddingVertical: espaco.s,
    fontSize: 16,
    color: cor.texto,
  },
  secao: {
    backgroundColor: cor.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cor.borda,
    padding: espaco.l,
    gap: espaco.l,
  },
  recolhivelCabecalho: {
    minHeight: ALVO_MINIMO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: cor.borda,
    paddingTop: espaco.s,
  },
  aviso: { flexDirection: "row", gap: espaco.s, padding: espaco.m, borderRadius: raio.s, alignItems: "flex-start" },
});
