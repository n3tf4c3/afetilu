import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { movimentoEfetivo } from "./aparencia";
import { useApp } from "./estado";

/** Movimento do mascote considerando a preferência do app e o "reduzir movimento" do sistema. */
export function useMovimento() {
  const { aparencia } = useApp();
  const [sistemaReduz, setSistemaReduz] = useState(false);
  useEffect(() => {
    let ativo = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (ativo) setSistemaReduz(v);
    });
    const assinatura = AccessibilityInfo.addEventListener("reduceMotionChanged", setSistemaReduz);
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);
  return movimentoEfetivo(aparencia.movimento, sistemaReduz);
}
