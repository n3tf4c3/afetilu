import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  CATEGORIAS,
  chaveDoDia,
  LIMITES,
  montarResumo,
  somarDias,
  type Categoria,
  type DiaAnotado,
  type MudancaRotina,
  type PerguntaConsulta,
  type Registro,
} from "@afetilu/core";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { Stack } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Aviso, Botao, Campo, Chip, Secao, estilos as ui } from "../components/ui";
import { useApp, useTextos } from "../lib/estado";
import {
  apagarPergunta,
  criarPergunta,
  listarDiasAnotados,
  listarMudancas,
  listarPerguntas,
  listarRegistros,
} from "../lib/repositorio";
import { montarResumoHtml, nomeDoArquivoDoResumo } from "../lib/resumo-html";
import { ALVO_MINIMO, cor, espaco, raio, texto } from "../lib/tema";

const PERIODOS = [7, 30, 90] as const;
// A4 a 72 pontos por polegada: sem isto o expo-print usa o formato Carta.
const PAGINA_A4 = { width: 595, height: 842 };

/**
 * Resumo para consulta: período, categorias, prévia e PDF gerado no aparelho, compartilhado pela
 * folha do sistema por escolha do responsável (docs/viabilidade-e-escopo.md, fluxo 5).
 */
export default function Resumo() {
  const { db, pessoaAtiva, versaoDados, notificarMudanca } = useApp();
  const { t, d, idioma } = useTextos();
  const tr = t.resumo;
  const insets = useSafeAreaInsets();
  const [dias, setDias] = useState<(typeof PERIODOS)[number]>(30);
  const [categorias, setCategorias] = useState<Categoria[]>([...CATEGORIAS]);
  const [dados, setDados] = useState<{
    registros: Registro[];
    anotados: DiaAnotado[];
    mudancas: MudancaRotina[];
    perguntas: PerguntaConsulta[];
  } | null>(null);
  const [novaPergunta, setNovaPergunta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const hoje = chaveDoDia(new Date());
  const inicio = somarDias(hoje, -(dias - 1));

  useEffect(() => {
    if (!pessoaAtiva) return;
    let ativo = true;
    void Promise.all([
      listarRegistros(db, pessoaAtiva.id, inicio, hoje),
      listarDiasAnotados(db, pessoaAtiva.id, inicio, hoje),
      listarMudancas(db, pessoaAtiva.id, inicio, hoje),
      listarPerguntas(db, pessoaAtiva.id),
    ]).then(([registros, anotados, mudancas, perguntas]) => {
      if (ativo) setDados({ registros, anotados, mudancas, perguntas });
    });
    return () => {
      ativo = false;
    };
  }, [db, pessoaAtiva, versaoDados, inicio, hoje]);

  const resumo = useMemo(
    () =>
      dados
        ? montarResumo({
            inicio,
            fim: hoje,
            categorias,
            registros: dados.registros,
            diasAnotados: dados.anotados,
            mudancas: dados.mudancas,
            perguntas: dados.perguntas,
          })
        : null,
    [dados, inicio, hoje, categorias],
  );

  if (!pessoaAtiva) return null;

  const alternar = (c: Categoria) =>
    setCategorias((atual) => (atual.includes(c) ? atual.filter((x) => x !== c) : CATEGORIAS.filter((x) => x === c || atual.includes(x))));
  const todas = categorias.length === CATEGORIAS.length;

  const acrescentarPergunta = async () => {
    if (!novaPergunta.trim()) return;
    await criarPergunta(db, pessoaAtiva.id, novaPergunta);
    setNovaPergunta("");
    notificarMudanca();
  };
  const removerPergunta = async (id: string) => {
    await apagarPergunta(db, id);
    notificarMudanca();
  };

  const html = () =>
    resumo ? montarResumoHtml({ resumo, apelido: pessoaAtiva.apelido, geradoEm: new Date(), d, t, idioma }) : null;

  const executar = async (acao: (h: string) => Promise<void>) => {
    const h = html();
    if (!h) return;
    setErro(null);
    setOcupado(true);
    try {
      await acao(h);
    } catch {
      // Mensagem genérica de propósito: nada do registro vai para tela de erro ou log.
      setErro(tr.falhou);
    } finally {
      setOcupado(false);
    }
  };

  // Abre a impressão do sistema, que mostra a prévia das páginas (e permite salvar como PDF).
  const preVisualizar = () => executar((h) => Print.printAsync({ html: h, ...PAGINA_A4 }));

  // Gera o PDF no cache do app e abre a folha de compartilhamento. Nada é enviado sem a escolha do responsável.
  const compartilhar = () =>
    executar(async (h) => {
      const { uri } = await Print.printToFileAsync({ html: h, ...PAGINA_A4 });
      const destino = new File(Paths.cache, nomeDoArquivoDoResumo(tr.docTitulo, pessoaAtiva.apelido, hoje));
      if (destino.exists) destino.delete();
      await new File(uri).move(destino);
      if (!(await Sharing.isAvailableAsync())) {
        setErro(tr.semCompartilhamento);
        return;
      }
      await Sharing.shareAsync(destino.uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: tr.dialogo });
    });

  const cob = resumo?.cobertura;
  const totalRegistros = resumo ? Object.values(resumo.porCategoria).reduce((s, n) => s + n, 0) : 0;
  const semCategorias = categorias.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <Stack.Screen options={{ title: tr.titulo }} />
      <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Secao titulo={tr.periodo}>
          <View style={ui.linhaChips} accessibilityRole="radiogroup" accessibilityLabel={tr.periodo}>
            {PERIODOS.map((n) => (
              <Chip key={n} rotulo={tr.ultimosDias(n)} selecionado={dias === n} onPress={() => setDias(n)} />
            ))}
          </View>
        </Secao>
        <Secao titulo={tr.categorias}>
          <View style={ui.linhaChips}>
            <Chip multiplo rotulo={tr.todas} selecionado={todas} onPress={() => setCategorias(todas ? [] : [...CATEGORIAS])} />
            {CATEGORIAS.map((c) => (
              <Chip key={c} multiplo rotulo={d.categoria[c]} selecionado={categorias.includes(c)} onPress={() => alternar(c)} />
            ))}
          </View>
        </Secao>
        <Secao titulo={tr.perguntasTitulo}>
          <Text style={texto.suave}>{tr.perguntasAjuda}</Text>
          {dados?.perguntas.map((p) => (
            <View key={p.id} style={estilos.pergunta}>
              <Text style={[texto.corpo, { flex: 1 }]}>{p.texto}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={tr.apagarPergunta(p.texto)}
                onPress={() => void removerPergunta(p.id)}
                style={estilos.apagar}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={22} color={cor.textoSuave} />
              </Pressable>
            </View>
          ))}
          <Campo rotulo={tr.novaPergunta} valor={novaPergunta} onChange={setNovaPergunta} max={LIMITES.anotacao} dica={tr.novaPerguntaDica} multilinha />
          <Botao
            variante="secundaria"
            icone="plus"
            rotulo={tr.acrescentarPergunta}
            desabilitado={!novaPergunta.trim()}
            onPress={() => void acrescentarPergunta()}
          />
        </Secao>
        {cob ? (
          <View style={estilos.previa} accessible accessibilityLiveRegion="polite">
            <Text style={texto.corpo}>{tr.previa(cob.diasComRegistro, cob.totalDias, totalRegistros, cob.episodios)}</Text>
          </View>
        ) : null}
        <Aviso texto={tr.avisoCompartilhar} />
        {erro ? <Aviso tipo="alerta" texto={erro} /> : null}
      </ScrollView>
      <View style={[estilos.barra, { paddingBottom: insets.bottom + espaco.m }]}>
        <Botao variante="secundaria" rotulo={tr.preVisualizar} desabilitado={!resumo || ocupado || semCategorias} onPress={() => void preVisualizar()} />
        <Botao rotulo={tr.compartilhar} desabilitado={!resumo || ocupado || semCategorias} onPress={() => void compartilhar()} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  previa: { backgroundColor: cor.primariaClara, borderRadius: 12, padding: espaco.l },
  pergunta: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.s,
    backgroundColor: cor.superficie,
    borderRadius: raio.m,
    borderWidth: 1,
    borderColor: cor.borda,
    paddingLeft: espaco.m,
  },
  apagar: { minWidth: ALVO_MINIMO, minHeight: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  barra: {
    gap: espaco.s,
    paddingHorizontal: espaco.l,
    paddingTop: espaco.m,
    backgroundColor: cor.fundo,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cor.borda,
  },
});
