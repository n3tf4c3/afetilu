/* eslint-disable react-hooks/immutability -- os valores compartilhados do react-native-worklets-core
   são mutáveis por design (o laço de render 3D lê e escreve neles, como o Animator da própria biblioteca). */
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  Camera,
  DefaultLight,
  FilamentScene,
  FilamentView,
  ModelRenderer,
  RenderCallbackContext,
  Skybox,
  useAnimator,
  useFilamentContext,
  useModel,
} from "react-native-filament";
import { useSharedValue } from "react-native-worklets-core";
// Modelo gerado por ferramentas/slime/gerar_slime.py (nunca editar o .glb à mão).
import MODELO from "../../../assets/slime/slime.glb";
import { ALFA_CORPO, COR_DA_REACAO, CLIPE_DA_REACAO, corDaReacao, corLinear, type Reacao } from "./reacoes";


export type Movimento = "completo" | "reduzido" | "nenhum";

export interface CenaSlimeProps {
  /** Reação a tocar; troque `disparo` para tocar a mesma reação de novo. */
  reacao: Reacao | null;
  disparo: number;
  /** Registro marcado como suspeita: a cor do tipo em tom mais claro. */
  suspeita?: boolean;
  movimento: Movimento;
  corDeFundo: string;
  /** Desenha só o slime, sem fundo, sobre o que estiver atrás (cenário da tela inicial). */
  fundoTransparente?: boolean;
  /** Recebe os quadros por segundo medidos no laço de render (prova técnica). */
  aoMedirQps?: (qps: number) => void;
  /**
   * "sob_demanda" (padrão): só renderiza durante as reações e depois congela no neutro, poupando
   * bateria. "continua": renderiza sempre, com respiração em laço (só para medir desempenho).
   */
  renderizacao?: "sob_demanda" | "continua";
  style?: StyleProp<ViewStyle>;
}

const MODO: Record<Movimento, number> = { completo: 0, reduzido: 1, nenhum: 2 };

function Cena({ reacao, disparo, suspeita = false, movimento, corDeFundo, fundoTransparente, aoMedirQps, renderizacao = "sob_demanda" }: CenaSlimeProps) {
  const modelo = useModel(MODELO);
  // useModel devolve um objeto novo a cada render; o asset é estável. Usar sempre o asset como
  // dependência (senão o animador é recriado e a reação reinicia a cada render).
  const asset = modelo.state === "loaded" ? modelo.asset : undefined;
  const animador = useAnimator(asset);
  // choreographer é API marcada como privada; é o mesmo que FilamentView.pause()/resume() usam
  // (o componente exportado não repassa a ref). Versão da biblioteca fixada em 1.11.0.
  const { renderableManager, choreographer } = useFilamentContext();
  const continua = renderizacao === "continua";

  // Renderização sob demanda: liga o laço de render por um tempo e desliga. Além da bateria, reduz
  // a janela da falha observada no emulador (thread FilamentRenderer sem responder à pausa do GC).
  const desligar = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderizarPor = useCallback(
    (ms: number) => {
      choreographer.start();
      if (desligar.current) clearTimeout(desligar.current);
      if (!continua) desligar.current = setTimeout(() => choreographer.stop(), ms);
    },
    [choreographer, continua],
  );
  useEffect(() => () => {
    if (desligar.current) clearTimeout(desligar.current);
  }, []);

  // Índices e durações dos clipes, lidos do arquivo pelo nome (o contrato é o nome, não a ordem).
  const clipes = useMemo(() => {
    const mapa = new Map<string, { indice: number; duracao: number }>();
    if (!animador) return mapa;
    for (let i = 0; i < animador.getAnimationCount(); i++) {
      mapa.set(animador.getAnimationName(i), { indice: i, duracao: animador.getAnimationDuration(i) });
    }
    return mapa;
  }, [animador]);

  const indice = useSharedValue(-1);
  const duracao = useSharedValue(0);
  const inicio = useSharedValue(0);
  const pendente = useSharedValue(false);
  const repouso = useSharedValue(-1);
  const duracaoRepouso = useSharedValue(1);
  const neutro = useSharedValue(-1);
  const modo = useSharedValue(MODO[movimento]);
  const quadrosTotal = useSharedValue(0);

  useEffect(() => {
    modo.value = MODO[movimento];
    renderizarPor(600);
  }, [movimento, modo, renderizarPor]);

  useEffect(() => {
    const n = clipes.get("neutro");
    // Em repouso o slime fica parado (neutro); a respiração em laço só existe no modo contínuo.
    const r = continua ? clipes.get("respirar") : n;
    if (!r || !n) return;
    repouso.value = r.indice;
    duracaoRepouso.value = r.duracao;
    neutro.value = n.indice;
    indice.value = r.indice;
    duracao.value = r.duracao;
    pendente.value = true;
    renderizarPor(800);
  }, [clipes, continua, repouso, duracaoRepouso, neutro, indice, duracao, pendente, renderizarPor]);

  // Nova reação: troca o clipe (começa no próximo quadro) e a cor, por tempo limitado.
  useEffect(() => {
    if (!reacao || !asset) return;
    const clipe = clipes.get(CLIPE_DA_REACAO[reacao] ?? "");
    if (clipe) {
      indice.value = clipe.indice;
      duracao.value = clipe.duracao;
      pendente.value = true;
    }
    renderizarPor((clipe?.duracao ?? 0.3) * 1000 + 400);
    const corpo = asset.getFirstEntityByName("corpo");
    if (!corpo) return;
    const material = renderableManager.getMaterialInstanceAt(corpo, 0);
    material.setFloat4Parameter("baseColorFactor", corLinear(corDaReacao(reacao, suspeita), ALFA_CORPO));
    const volta = setTimeout(
      () => material.setFloat4Parameter("baseColorFactor", corLinear(COR_DA_REACAO.neutro, ALFA_CORPO)),
      (clipe?.duracao ?? 2.5) * 1000,
    );
    return () => clearTimeout(volta);
  }, [reacao, disparo, suspeita, asset, clipes, renderableManager, indice, duracao, pendente, renderizarPor]);

  RenderCallbackContext.useRenderCallback(
    ({ passedSeconds }) => {
      "worklet";
      quadrosTotal.value += 1;
      if (animador == null || indice.value < 0) return;
      if (pendente.value) {
        inicio.value = passedSeconds;
        pendente.value = false;
      }
      let t = passedSeconds - inicio.value;
      // Reação terminou: volta ao repouso (o clipe já termina no neutro).
      if (indice.value !== repouso.value && t >= duracao.value) {
        indice.value = repouso.value;
        duracao.value = duracaoRepouso.value;
        inicio.value = passedSeconds;
        t = 0;
      }
      if (modo.value === 2) {
        animador.applyAnimation(neutro.value, 0);
      } else if (modo.value === 1) {
        // Movimento reduzido: pose estática da reação, sem deslocamento contínuo.
        animador.applyAnimation(indice.value, indice.value === repouso.value ? 0 : duracao.value * 0.4);
      } else {
        animador.applyAnimation(indice.value, indice.value === repouso.value ? t % duracaoRepouso.value : t);
      }
      animador.updateBoneMatrices();
    },
    [animador],
  );

  // Medidor: quadros desenhados por segundo de relógio (0 quando a renderização está parada).
  useEffect(() => {
    if (!aoMedirQps) return;
    let anterior = quadrosTotal.value;
    const id = setInterval(() => {
      const total = quadrosTotal.value;
      aoMedirQps(total - anterior);
      anterior = total;
    }, 1000);
    return () => clearInterval(id);
  }, [aoMedirQps, quadrosTotal]);

  return (
    <FilamentView style={StyleSheet.absoluteFill} enableTransparentRendering={!!fundoTransparente}>
      <Ambiente corDeFundo={fundoTransparente ? null : corDeFundo} />
      <ModelRenderer model={modelo} />
      <CameraFixa />
    </FilamentView>
  );
}

// Skybox e EnvironmentalLight (dentro de DefaultLight) do react-native-filament 1.11 recriam recursos
// nativos a cada render (useWorkletEffect sem dependências) e vazam memória. Ficam isolados em
// componentes memorizados, que só renderizam de novo se a cor de fundo mudar.
const Ambiente = memo(function Ambiente({ corDeFundo }: { corDeFundo: string | null }) {
  return (
    <>
      {corDeFundo ? <Skybox colorInHex={corDeFundo} /> : null}
      <DefaultLight />
    </>
  );
});

// Enquadra o corpo em gota (base em -0,1 e topo em 1,52; até ~1,9 no quique) com folga.
const POSICAO_CAMERA: [number, number, number] = [0, 1.75, 5.6];
const ALVO_CAMERA: [number, number, number] = [0, 0.78, 0];
const CameraFixa = memo(function CameraFixa() {
  return <Camera cameraPosition={POSICAO_CAMERA} cameraTarget={ALVO_CAMERA} focalLengthInMillimeters={45} />;
});

/** Cena 3D isolada: trocar a implementação (Filament ↔ 2,5D) não afeta o resto do app. */
export const CenaSlime = memo(function CenaSlime(props: CenaSlimeProps) {
  return (
    <View style={[{ overflow: "hidden" }, props.style]} accessible={false} importantForAccessibility="no-hide-descendants">
      <FilamentScene>
        <Cena {...props} />
      </FilamentScene>
    </View>
  );
});
