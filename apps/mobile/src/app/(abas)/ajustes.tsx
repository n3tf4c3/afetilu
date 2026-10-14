import { IDIOMAS, LIMITES } from "@afetilu/core";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Botao, Campo, Chip, Escolha, Secao, estilos as ui } from "../../components/ui";
import { CORES_SLIME } from "../../components/slime/reacoes";
import { MODOS_VISUAIS, PREFERENCIAS_MOVIMENTO } from "../../lib/aparencia";
import { diasDesde, PREF_ULTIMO_BACKUP } from "../../lib/backup";
import { NOME_DO_IDIOMA } from "../../i18n";
import { gerarDadosFicticios } from "../../lib/dados-ficticios";
import { useApp, useTextos } from "../../lib/estado";
import { criarMudanca, criarPergunta, criarPessoa, criarRegistro, lerPreferencia, marcarSemCrises, renomearPessoa } from "../../lib/repositorio";
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
    preferenciaIdioma,
    definirIdioma,
    aparencia,
    definirAparencia,
  } = useApp();
  const { t, idioma } = useTextos();
  const a = t.ajustes;
  const [novo, setNovo] = useState("");
  const [ultimoBackup, setUltimoBackup] = useState<string | null>(null);

  // Relido ao voltar para a aba (depois de fazer ou restaurar um backup).
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      void lerPreferencia(db, PREF_ULTIMO_BACKUP).then((v) => {
        if (ativo) setUltimoBackup(v);
      });
      return () => {
        ativo = false;
      };
    }, [db]),
  );

  const adicionar = async () => {
    if (!novo.trim()) return;
    const p = await criarPessoa(db, novo);
    setNovo("");
    await recarregarPessoas();
    await escolherPessoa(p.id);
  };

  const gerarFicticios = async () => {
    const p = await criarPessoa(db, a.exemploFicticio);
    const { registros, diasSemCrises, mudancas, perguntas } = gerarDadosFicticios(p.id, new Date(), 14, idioma);
    for (const e of registros) await criarRegistro(db, e);
    for (const dia of diasSemCrises) await marcarSemCrises(db, p.id, dia);
    for (const m of mudancas) await criarMudanca(db, p.id, m.dia, m.texto);
    for (const q of perguntas) await criarPergunta(db, p.id, q);
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
          rotulo={a.corSlime}
          opcoes={CORES_SLIME}
          rotulos={a.cores}
          valor={aparencia.corSlime}
          onChange={(v) => v && void definirAparencia({ corSlime: v })}
        />
        <Text style={texto.suave}>{a.corSlimeAjuda}</Text>
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
        <Text style={texto.corpo}>{a.backupTexto}</Text>
        <Text style={texto.subtitulo}>{a.ultimoBackup(diasDesde(ultimoBackup, new Date()))}</Text>
        <Botao rotulo={a.fazerBackup} onPress={() => router.push("/backup")} />
        <Botao variante="secundaria" rotulo={a.restaurarBackup} onPress={() => router.push("/restaurar")} />
        <Text style={texto.suave}>{a.apagarAjuda}</Text>
        {pessoas.map((p) => (
          <Botao
            key={p.id}
            variante="perigo"
            rotulo={a.apagarPessoa(p.apelido)}
            onPress={() => router.push({ pathname: "/apagar", params: { pessoa: p.id } })}
          />
        ))}
        <Botao variante="perigo" rotulo={a.apagarTudo} onPress={() => router.push({ pathname: "/apagar", params: { tudo: "1" } })} />
      </Secao>

      {__DEV__ ? (
        <Secao titulo={a.devTitulo}>
          <Text style={texto.suave}>{a.devAjuda}</Text>
          <Botao variante="secundaria" rotulo={a.devGerar} onPress={() => void gerarFicticios()} />
          <Botao variante="secundaria" rotulo="Prova técnica: slime 3D" onPress={() => router.push("/prova-slime")} />
        </Secao>
      ) : null}
    </ScrollView>
  );
}
