import { chaveDoDia, ehEpisodio, somarDias, type Categoria, type DiaAnotado, type Local, type Registro } from "@afetilu/core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useApp, useTextos } from "./estado";
import { desmarcarSemCrises, listarDiasAnotados, listarRegistros, marcarSemCrises } from "./repositorio";

/** Registros em aberto aparecem por alguns dias para lembrar de anotar o término. */
const DIAS_EM_ABERTO = 7;

/** Dados e ações do dia, compartilhados pelas telas inicial simples e de cenário. */
export function useHoje() {
  const { db, pessoaAtiva, versaoDados, notificarMudanca, oferecerDesfazer } = useApp();
  const { t } = useTextos();
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
      setAnotacaoHoje(dias.find((x) => x.semCrises) ?? null);
    })();
    return () => {
      ativo = false;
    };
  }, [db, pessoaAtiva, versaoDados, hoje]);

  const abrirRegistro = (categoria: Categoria, local?: Local) =>
    router.push({ pathname: "/registro/[categoria]", params: local ? { categoria, local } : { categoria } });

  const alternarSemCrises = () => {
    if (!pessoaAtiva) return;
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

  return { hoje, hojeRegistros, emAberto, anotacaoHoje, abrirRegistro, alternarSemCrises };
}
