import {
  CATEGORIAS,
  chaveDoDia,
  diaPorExtenso,
  rotuloDoDia,
  somarDias,
  type DiaAnotado,
  type DicionarioDominio,
  type Registro,
} from "@afetilu/core";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View } from "react-native";
import { ItemRegistro } from "../../components/item-registro";
import { Aviso, Botao, Chip, estilos as ui } from "../../components/ui";
import { useApp, useTextos } from "../../lib/estado";
import { montarLinhaDoTempo, resumoDoDia, type DiaDaLinha, type FiltroCategoria } from "../../lib/linha-do-tempo";
import { desmarcarSemCrises, listarDiasAnotados, listarRegistros, marcarSemCrises } from "../../lib/repositorio";
import { cor, espaco, raio, texto } from "../../lib/tema";
import type { TextosApp } from "../../i18n";

const PERIODOS = [7, 30] as const;

function tituloDoDia(dia: string, hoje: string, d: DicionarioDominio, t: TextosApp["linha"]): string {
  const relativo = rotuloDoDia(dia, hoje, d);
  const extenso = diaPorExtenso(dia, d);
  return relativo === d.hoje ? t.hojeDia(extenso) : relativo === d.ontem ? t.ontemDia(extenso) : extenso;
}

export default function LinhaDoTempo() {
  const { db, pessoaAtiva, versaoDados, notificarMudanca } = useApp();
  const { t, d } = useTextos();
  const tl = t.linha;
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(7);
  const [filtro, setFiltro] = useState<FiltroCategoria>("todas");
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [anotados, setAnotados] = useState<DiaAnotado[]>([]);
  const hoje = chaveDoDia(new Date());
  const inicio = somarDias(hoje, -(dias - 1));

  useEffect(() => {
    if (!pessoaAtiva) return;
    let ativo = true;
    void (async () => {
      const [r, a] = await Promise.all([
        listarRegistros(db, pessoaAtiva.id, inicio, hoje),
        listarDiasAnotados(db, pessoaAtiva.id, inicio, hoje),
      ]);
      if (!ativo) return;
      setRegistros(r);
      setAnotados(a);
    })();
    return () => {
      ativo = false;
    };
  }, [db, pessoaAtiva, versaoDados, inicio, hoje]);

  const linha = useMemo(
    () => montarLinhaDoTempo({ inicio, fim: hoje, registros, diasAnotados: anotados, filtro }),
    [inicio, hoje, registros, anotados, filtro],
  );

  if (!pessoaAtiva) return null;

  const alternar = async (dia: DiaDaLinha) => {
    if (dia.situacao.semCrisesAnotado) await desmarcarSemCrises(db, pessoaAtiva.id, dia.situacao.dia);
    else await marcarSemCrises(db, pessoaAtiva.id, dia.situacao.dia);
    notificarMudanca();
  };

  const cabecalho = (
    <View style={{ gap: espaco.m, paddingBottom: espaco.s }}>
      <Botao variante="secundaria" icone="file-document-outline" rotulo={t.resumo.abrir} onPress={() => router.push("/resumo")} />
      <View style={ui.linhaChips} accessibilityRole="radiogroup" accessibilityLabel={tl.periodo}>
        {PERIODOS.map((p) => (
          <Chip key={p} rotulo={tl.ultimosDias(p)} selecionado={dias === p} onPress={() => setDias(p)} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.s }}>
        <Chip rotulo={tl.todas} selecionado={filtro === "todas"} onPress={() => setFiltro("todas")} />
        {CATEGORIAS.map((c) => (
          <Chip key={c} rotulo={d.categoria[c]} selecionado={filtro === c} onPress={() => setFiltro(c)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      data={linha}
      keyExtractor={(dia) => dia.situacao.dia}
      ListHeaderComponent={cabecalho}
      contentContainerStyle={{ padding: espaco.l, gap: espaco.m, paddingBottom: 120 }}
      renderItem={({ item: dia }) => (
        <View
          style={{
            backgroundColor: dia.situacao.semInformacao ? "transparent" : cor.superficie,
            borderRadius: raio.m,
            borderWidth: 1,
            borderColor: cor.borda,
            borderStyle: dia.situacao.semInformacao ? "dashed" : "solid",
            padding: espaco.l,
            gap: espaco.s,
          }}
        >
          <Text style={texto.subtitulo} accessibilityRole="header">
            {tituloDoDia(dia.situacao.dia, hoje, d, tl)}
          </Text>
          <Text style={texto.suave}>{resumoDoDia(dia.situacao, tl)}</Text>
          {dia.situacao.inconsistente ? (
            <Aviso tipo="alerta" texto={tl.inconsistente} />
          ) : null}
          {/* O dia já está no cabeçalho: a legenda mostra só o horário. */}
          {dia.registros.map((r) => (
            <ItemRegistro key={r.id} registro={r} hoje={r.ocorreuDia} />
          ))}
          {filtro !== "todas" && dia.registros.length === 0 && !dia.situacao.semInformacao ? (
            <Text style={texto.suave}>{tl.nadaNaCategoria}</Text>
          ) : null}
          <Botao
            variante="texto"
            icone={dia.situacao.semCrisesAnotado ? "close-circle-outline" : "check-circle-outline"}
            rotulo={dia.situacao.semCrisesAnotado ? tl.desmarcarSemCrises : tl.marcarSemCrises}
            onPress={() => void alternar(dia)}
          />
        </View>
      )}
    />
  );
}
