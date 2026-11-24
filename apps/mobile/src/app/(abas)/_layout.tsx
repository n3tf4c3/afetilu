import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useApp, useTextos } from "../../lib/estado";
import { cor } from "../../lib/tema";

function iconeDaAba(nome: ComponentProps<typeof MaterialCommunityIcons>["name"]) {
  return function IconeDaAba({ focused, size }: { focused: boolean; size: number }) {
    return <MaterialCommunityIcons name={nome} color={focused ? cor.primaria : cor.textoSuave} size={size} />;
  };
}

export default function Abas() {
  const { pessoaAtiva } = useApp();
  const { t } = useTextos();
  if (!pessoaAtiva) return <Redirect href="/primeiro-uso" />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cor.fundo },
        headerTitleStyle: { color: cor.texto },
        tabBarActiveTintColor: cor.primaria,
        tabBarInactiveTintColor: cor.textoSuave,
        tabBarLabelStyle: { fontSize: 13 },
        sceneStyle: { backgroundColor: cor.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.abas.inicio,
          tabBarAccessibilityLabel: t.abas.inicio,
          headerShown: false,
          tabBarIcon: iconeDaAba("home-outline"),
        }}
      />
      <Tabs.Screen
        name="linha-do-tempo"
        options={{
          title: t.abas.linhaDoTempo,
          tabBarAccessibilityLabel: t.abas.linhaDoTempo,
          tabBarIcon: iconeDaAba("timeline-text-outline"),
        }}
      />
      <Tabs.Screen
        name="resumo"
        options={{
          title: t.abas.resumo,
          headerTitle: t.resumo.titulo,
          tabBarAccessibilityLabel: t.resumo.titulo,
          tabBarIcon: iconeDaAba("file-document-outline"),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: t.abas.ajustes,
          tabBarAccessibilityLabel: t.abas.ajustes,
          tabBarIcon: iconeDaAba("cog-outline"),
        }}
      />
    </Tabs>
  );
}
