import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";
import blop from "../../../assets/sons/blop.wav";
import bolhas from "../../../assets/sons/bolhas.wav";
import boing from "../../../assets/sons/boing.wav";
import nham from "../../../assets/sons/nham.wav";
import ronco from "../../../assets/sons/ronco.wav";
import { SOM_DA_REACAO, type Reacao, type Som } from "./reacoes";

const ARQUIVO: Record<Som, number> = { blop, boing, bolhas, nham, ronco };

/** Os arquivos já são baixos (~ -12 dBFS); o volume do tocador reduz mais um pouco. */
const VOLUME = 0.7;

/**
 * Toca o som da reação do slime, só com os sons ligados (docs/experiencia-avatar.md, seção 5).
 * Nunca toca ao abrir a tela: só quando `disparo` muda depois da montagem. Cada disparo interrompe o
 * som anterior (só a última reação soa). Respeita o modo silencioso/vibrar e não interrompe músicas
 * de outros apps.
 */
export function useSonsDoSlime(reacao: Reacao | null, disparo: number, ligado: boolean) {
  const tocadores = useRef<Partial<Record<Som, AudioPlayer>>>({});

  // Os tocadores só existem com os sons ligados; desligar libera tudo.
  useEffect(() => {
    if (!ligado) return;
    void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false });
    const criados: Partial<Record<Som, AudioPlayer>> = {};
    for (const som of Object.keys(ARQUIVO) as Som[]) {
      const p = createAudioPlayer(ARQUIVO[som]);
      p.volume = VOLUME;
      criados[som] = p;
    }
    tocadores.current = criados;
    return () => {
      for (const p of Object.values(criados)) p.remove();
      tocadores.current = {};
    };
  }, [ligado]);

  const ultimoDisparo = useRef(disparo);
  useEffect(() => {
    if (disparo === ultimoDisparo.current) return;
    ultimoDisparo.current = disparo;
    for (const outro of Object.values(tocadores.current)) if (outro.playing) outro.pause();
    const som = reacao ? SOM_DA_REACAO[reacao] : null;
    const p = som ? tocadores.current[som] : undefined;
    if (!p) return;
    // Pausar antes de voltar ao início: no Android, um tocador que já terminou volta a tocar sozinho
    // no seekTo, sem passar pela checagem do modo silencioso que o play() faz.
    p.pause();
    void p.seekTo(0).then(() => p.play());
  }, [reacao, disparo]);
}
