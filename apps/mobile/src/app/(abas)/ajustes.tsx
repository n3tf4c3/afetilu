import { IDIOMAS, LIMITES } from "@afetilu/core";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Aviso, Botao, Campo, Chip, Escolha, Secao, estilos as ui } from "../../components/ui";
import { MODOS_VISUAIS, PREFERENCIAS_MOVIMENTO } from "../../lib/aparencia";
import { NOME_DO_IDIOMA } from "../../i18n";
import { gerarDadosFicticios } from "../../lib/dados-ficticios";
import { useApp, useTextos } from "../../lib/estado";
import { criarPessoa, criarRegistro, marcarSemCrises, renomearPessoa } from "../../lib/repositorio";
import { espaco, texto } from "../../lib/tema";

/** "pendente" aparece como desligado: os sons só tocam depois da escolha. */
const OPCOES_SOM = ["ligado", "desligado"] as const;

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
  const {
    db,
    pessoas,
    pessoaAtiva,
    recarregarPessoas,
    escolherPessoa,
    notificarMudanca,
    apagarTudo,
    preferenciaIdioma,
    definirIdioma,
    aparencia,
    definirAparencia,
  } = useApp();
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

      <Secao titulo={a.aparencia}>
        <Escolha
          opcoes={MODOS_VISUAIS}
          rotulos={{ cenario: a.modoCenario, simples: a.modoSimples }}
          valor={aparencia.modoVisual}
          onChange={(v) => v && void definirAparencia({ modoVisual: v })}
        />
        <Escolha
          rotulo={a.movimento}
          opcoes={PREFERENCIAS_MOVIMENTO}
          rotulos={{ auto: a.movAuto, completo: a.movCompleto, reduzido: a.movReduzido, nenhum: a.movNenhum }}
          valor={aparencia.movimento}
          onChange={(v) => v && void definirAparencia({ movimento: v })}
        />
        <Text style={texto.suave}>{a.movimentoAjuda}</Text>
        <Escolha
          rotulo={a.sons}
          opcoes={OPCOES_SOM}
          rotulos={{ ligado: a.somLigado, desligado: a.somDesligado }}
          valor={aparencia.som === "ligado" ? "ligado" : "desligado"}
          onChange={(v) => v && void definirAparencia({ som: v })}
        />
        <Text style={texto.suave}>{a.sonsAjuda}</Text>
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
          <Botao variante="secundaria" rotulo="Prova técnica: slime 3D" onPress={() => router.push("/prova-slime")} />
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
