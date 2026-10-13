import { IDIOMAS, LIMITES } from "@eloazul/core";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Aviso, Botao, Campo, Chip, Secao, estilos as ui } from "../../components/ui";
import { NOME_DO_IDIOMA } from "../../i18n";
import { gerarDadosFicticios } from "../../lib/dados-ficticios";
import { useApp, useTextos } from "../../lib/estado";
import { criarPessoa, criarRegistro, marcarSemCrises, renomearPessoa } from "../../lib/repositorio";
import { espaco, texto } from "../../lib/tema";

function EditarPessoa(props: { id: string; apelido: string; ativa: boolean }) {
  const { db, recarregarPessoas, escolherPessoa } = useApp();
  const { t } = useTextos();
  const [valor, setValor] = useState(props.apelido);
  const mudou = valor.trim() !== props.apelido && valor.trim().length > 0;
  return (
    <View style={{ gap: espaco.s }}>
      <Campo rotulo={props.ativa ? t.ajustes.apelidoEmUso : t.ajustes.apelido} valor={valor} onChange={setValor} max={LIMITES.apelido} />
      <View style={{ flexDirection: "row", gap: espaco.s, flexWrap: "wrap" }}>
        {mudou ? (
          <Botao variante="secundaria" rotulo={t.ajustes.salvarApelido} onPress={() => void renomearPessoa(db, props.id, valor).then(recarregarPessoas)} />
        ) : null}
        {!props.ativa ? <Botao variante="texto" rotulo={t.ajustes.acompanharAgora} onPress={() => void escolherPessoa(props.id)} /> : null}
      </View>
    </View>
  );
}

export default function Ajustes() {
  const { db, pessoas, pessoaAtiva, recarregarPessoas, escolherPessoa, notificarMudanca, apagarTudo, preferenciaIdioma, definirIdioma } =
    useApp();
  const { t } = useTextos();
  const a = t.ajustes;
  const [novo, setNovo] = useState("");

  const adicionar = async () => {
    if (!novo.trim()) return;
    const p = await criarPessoa(db, novo);
    setNovo("");
    await recarregarPessoas();
    await escolherPessoa(p.id);
  };

  const gerarFicticios = async () => {
    const p = await criarPessoa(db, a.exemploFicticio);
    const { registros, diasSemCrises } = gerarDadosFicticios(p.id, new Date());
    for (const e of registros) await criarRegistro(db, e);
    for (const dia of diasSemCrises) await marcarSemCrises(db, p.id, dia);
    await recarregarPessoas();
    await escolherPessoa(p.id);
    notificarMudanca();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: 120 }}>
      <Secao titulo={a.pessoas}>
        {pessoas.map((p) => (
          <EditarPessoa key={`${p.id}-${p.apelido}`} id={p.id} apelido={p.apelido} ativa={p.id === pessoaAtiva?.id} />
        ))}
        <Campo rotulo={a.acrescentarPessoa} valor={novo} onChange={setNovo} max={LIMITES.apelido} dica={a.apelido} />
        <Botao variante="secundaria" rotulo={a.acrescentar} desabilitado={!novo.trim()} onPress={() => void adicionar()} />
      </Secao>

      <Secao titulo={a.idioma}>
        <View style={ui.linhaChips} accessibilityRole="radiogroup" accessibilityLabel={a.idioma}>
          <Chip rotulo={a.idiomaAutomatico} selecionado={preferenciaIdioma === "auto"} onPress={() => void definirIdioma("auto")} />
          {IDIOMAS.map((i) => (
            <Chip key={i} rotulo={NOME_DO_IDIOMA[i]} selecionado={preferenciaIdioma === i} onPress={() => void definirIdioma(i)} />
          ))}
        </View>
      </Secao>

      <Secao titulo={a.seusDados}>
        <Text style={texto.corpo}>{a.seusDadosTexto}</Text>
        <Aviso texto={a.backupEmBreve} />
      </Secao>

      {__DEV__ ? (
        <Secao titulo={a.devTitulo}>
          <Text style={texto.suave}>{a.devAjuda}</Text>
          <Botao variante="secundaria" rotulo={a.devGerar} onPress={() => void gerarFicticios()} />
          <Botao
            variante="perigo"
            rotulo={a.devApagar}
            onPress={() =>
              Alert.alert(a.devConfirmarTitulo, a.devConfirmarTexto, [
                { text: t.geral.cancelar, style: "cancel" },
                { text: t.geral.apagar, style: "destructive", onPress: () => void apagarTudo() },
              ])
            }
          />
        </Secao>
      ) : null}
    </ScrollView>
  );
}
