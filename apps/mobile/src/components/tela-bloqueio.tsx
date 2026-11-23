import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, View, type AppStateStatus } from "react-native";
import { autenticarAparelho } from "../lib/bloqueio";
import { deveTrancarAoVoltar } from "../lib/bloqueio-dados";
import { useApp, useTextos } from "../lib/estado";
import { cor, espaco, texto } from "../lib/tema";
import { Botao } from "./ui";

function BloqueioAtivo(props: { iniciarTrancado: boolean }) {
  const { t } = useTextos();
  const b = t.bloqueio;
  const [trancado, setTrancado] = useState(props.iniciarTrancado);
  const [oculto, setOculto] = useState(false);
  const saiuEm = useRef<number | null>(null);
  const autenticando = useRef(false);

  const tentarDesbloquear = useCallback(async () => {
    if (autenticando.current) return;
    autenticando.current = true;
    try {
      const ok = await autenticarAparelho({
        mensagem: b.prompt,
        cancelar: t.geral.cancelar,
        usarCodigo: b.usarCodigo,
      });
      if (ok) setTrancado(false);
    } finally {
      autenticando.current = false;
    }
  }, [b.prompt, b.usarCodigo, t.geral.cancelar]);

  useEffect(() => {
    if (trancado) void tentarDesbloquear();
  }, [trancado, tentarDesbloquear]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (proximo: AppStateStatus) => {
      if (autenticando.current) return;
      if (proximo === "inactive" || proximo === "background") {
        setOculto(true);
        if (saiuEm.current === null) saiuEm.current = Date.now();
        return;
      }
      if (proximo === "active") {
        const precisaTrancar = deveTrancarAoVoltar({
          bloqueioAtivo: true,
          saiuEmMs: saiuEm.current,
          agoraMs: Date.now(),
        });
        saiuEm.current = null;
        setOculto(false);
        if (precisaTrancar) setTrancado(true);
      }
    });
    return () => sub.remove();
  }, []);

  if (!trancado && !oculto) return null;

  return (
    <View style={[StyleSheet.absoluteFill, estilos.fundo]} accessibilityViewIsModal>
      <MaterialCommunityIcons name="lock-outline" size={44} color={cor.primaria} />
      <Text style={[texto.titulo, estilos.centro]} accessibilityRole="header">
        {b.titulo}
      </Text>
      {trancado ? (
        <>
          <Text style={[texto.corpo, estilos.centro]}>{b.texto}</Text>
          <Botao icone="lock-open-outline" rotulo={b.desbloquear} onPress={() => void tentarDesbloquear()} />
        </>
      ) : null}
    </View>
  );
}

/**
 * Sobreposição opaca de proteção quando o bloqueio opcional está ligado:
 * - inicia trancada ao abrir o app (mas não tranca de imediato ao ativar em Ajustes);
 * - oculta os registros imediatamente ao ir para o seletor de apps / segundo plano;
 * - exige biometria ou código do aparelho ao voltar após a tolerância.
 */
export function ProtecaoBloqueio() {
  const { bloqueioAtivo } = useApp();
  const [iniciarTrancado] = useState(bloqueioAtivo);
  if (!bloqueioAtivo) return null;
  return <BloqueioAtivo iniciarTrancado={iniciarTrancado} />;
}

const estilos = StyleSheet.create({
  fundo: {
    zIndex: 100,
    backgroundColor: cor.fundo,
    alignItems: "center",
    justifyContent: "center",
    padding: espaco.xl,
    gap: espaco.l,
  },
  centro: { textAlign: "center", maxWidth: 320 },
});
