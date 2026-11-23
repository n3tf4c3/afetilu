import { Stack } from "expo-router";
import { TelaResumo } from "../components/tela-resumo";
import { useTextos } from "../lib/estado";

export default function Resumo() {
  const { t } = useTextos();
  return (
    <>
      <Stack.Screen options={{ title: t.resumo.titulo }} />
      <TelaResumo />
    </>
  );
}
