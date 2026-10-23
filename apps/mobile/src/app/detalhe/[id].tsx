import { chaveDoDia, legendaDoRegistro, rotuloDoDia } from "@afetilu/core";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { FalhaAoCarregar } from "../../components/falha-ao-carregar";
import { Aviso, Botao, Secao } from "../../components/ui";
import { descreverRegistro } from "../../lib/descricao";
import { useApp, useTextos } from "../../lib/estado";
import { apagarRegistro, listarRevisoes, obterRegistro } from "../../lib/repositorio";
import { cor, espaco, texto } from "../../lib/tema";
import { useConsulta } from "../../lib/usar-consulta";

export default function Detalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, versaoDados, notificarMudanca, tentar } = useApp();
  const { t, d } = useTextos();
  const td = t.detalhe;
  const consulta = useConsulta(
    id,
    async () => {
      const r = await obterRegistro(db, id);
      return { registro: r, revisoes: r ? await listarRevisoes(db, id) : [] };
    },
    versaoDados,
  );
  const hoje = chaveDoDia(new Date());

  if (consulta.falhou) {
    return (
      <View style={{ padding: espaco.l }}>
        <FalhaAoCarregar tentarDeNovo={consulta.tentarDeNovo} />
      </View>
    );
  }
  if (!consulta.dados) return null;
  const { registro, revisoes } = consulta.dados;
  if (registro === null) {
    return (
      <View style={{ padding: espaco.l }}>
        <Aviso tipo="alerta" texto={td.naoExiste} />
      </View>
    );
  }

  const quando = (iso: string) => {
    const x = new Date(iso);
    return `${rotuloDoDia(chaveDoDia(x), hoje, d)}, ${d.hora(x)}`;
  };

  const apagar = () =>
    Alert.alert(td.apagarTitulo, td.apagarTexto, [
      { text: t.geral.cancelar, style: "cancel" },
      {
        text: t.geral.apagar,
        style: "destructive",
        onPress: () =>
          tentar(() =>
            apagarRegistro(db, registro.id).then(() => {
              notificarMudanca();
              router.back();
            }),
          ),
      },
    ]);

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: espaco.xxl }}>
      <Text style={texto.titulo} accessibilityRole="header">
        {legendaDoRegistro(registro, hoje, d)}
      </Text>

      <Secao>
        {descreverRegistro(registro, hoje, chaveDoDia, d, t.descricao).map((l) => (
          <View key={l.rotulo} style={{ gap: 2 }}>
            <Text style={texto.suave}>{l.rotulo}</Text>
            <Text style={texto.corpo}>{l.valor}</Text>
          </View>
        ))}
      </Secao>

      <Secao titulo={td.cronologia}>
        <Text style={texto.corpo}>{td.lancadoEm(quando(registro.lancadoEm))}</Text>
        {registro.versao > 1 ? <Text style={texto.corpo}>{td.corrigidoEm(quando(registro.atualizadoEm))}</Text> : null}
        {revisoes.map((rev) => (
          <View key={rev.versao} style={{ borderLeftWidth: 3, borderLeftColor: cor.borda, paddingLeft: espaco.m, gap: 2 }}>
            <Text style={texto.suave}>{td.versaoSubstituida(rev.versao, quando(rev.alteradoEm))}</Text>
            <Text style={texto.corpo}>{legendaDoRegistro(rev.conteudoAnterior, hoje, d)}</Text>
          </View>
        ))}
      </Secao>

      <Botao
        variante="secundaria"
        icone="pencil-outline"
        rotulo={td.corrigir}
        onPress={() =>
          router.push({ pathname: "/registro/[categoria]", params: { categoria: registro.detalhe.categoria, id: registro.id } })
        }
      />
      <Botao variante="perigo" icone="trash-can-outline" rotulo={td.apagarRegistro} onPress={apagar} />
    </ScrollView>
  );
}
