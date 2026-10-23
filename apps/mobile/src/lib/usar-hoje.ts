import { chaveDoDia, ehEpisodio, somarDias, type Categoria, type DiaAnotado, type Local, type Registro } from "@afetilu/core";
import { router } from "expo-router";
import { Alert } from "react-native";
import { useApp, useTextos } from "./estado";
import { desmarcarSemCrises, listarDiasAnotados, listarRegistros, marcarSemCrises } from "./repositorio";
import { useConsulta } from "./usar-consulta";

/** Registros em aberto aparecem por alguns dias para lembrar de anotar o término. */
const DIAS_EM_ABERTO = 7;

/** Dados e ações do dia, compartilhados pelas telas inicial simples e de cenário. */
export function useHoje() {
  const { db, pessoaAtiva, versaoDados, notificarMudanca, oferecerDesfazer, tentar } = useApp();
  const { t } = useTextos();
  const ti = t.inicio;
  const hoje = chaveDoDia(new Date());
  const consulta = useConsulta(
    pessoaAtiva ? `${pessoaAtiva.id}|${hoje}` : null,
    async (): Promise<{ hojeRegistros: Registro[]; emAberto: Registro[]; anotacaoHoje: DiaAnotado | null }> => {
      const id = pessoaAtiva!.id;
      const recentes = await listarRegistros(db, id, somarDias(hoje, -DIAS_EM_ABERTO), hoje);
      const dias = await listarDiasAnotados(db, id, hoje, hoje);
      return {
        hojeRegistros: recentes.filter((r) => r.ocorreuDia === hoje),
        emAberto: recentes.filter((r) => r.emAberto),
        anotacaoHoje: dias.find((x) => x.semCrises) ?? null,
      };
    },
    versaoDados,
  );
  const hojeRegistros = consulta.dados?.hojeRegistros ?? [];
  const emAberto = consulta.dados?.emAberto ?? [];
  const anotacaoHoje = consulta.dados?.anotacaoHoje ?? null;

  const abrirRegistro = (categoria: Categoria, local?: Local) =>
    router.push({ pathname: "/registro/[categoria]", params: local ? { categoria, local } : { categoria } });

  const alternarSemCrises = () => {
    // Sem saber se o dia já está marcado (carregando ou falha), o toque não faz nada.
    if (!pessoaAtiva || !consulta.dados) return;
    if (anotacaoHoje) {
      tentar(() => desmarcarSemCrises(db, pessoaAtiva.id, hoje).then(notificarMudanca));
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
        { text: t.geral.marcar, onPress: () => tentar(marcar) },
      ]);
    } else {
      tentar(marcar);
    }
  };

  return {
    hoje,
    hojeRegistros,
    emAberto,
    anotacaoHoje,
    carregado: consulta.dados !== null,
    falhou: consulta.falhou,
    tentarDeNovo: consulta.tentarDeNovo,
    abrirRegistro,
    alternarSemCrises,
  };
}
