import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useApp, useTextos } from "../../lib/estado";
import { cor } from "../../lib/tema";

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
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="linha-do-tempo"
        options={{
          title: t.abas.linhaDoTempo,
          tabBarAccessibilityLabel: t.abas.linhaDoTempo,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="timeline-text-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: t.abas.ajustes,
          tabBarAccessibilityLabel: t.abas.ajustes,
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
