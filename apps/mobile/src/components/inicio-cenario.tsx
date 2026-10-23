import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CATEGORIAS, comemorativasDesligadas, dataComemorativaDoDia, diaPorExtenso, type Local } from "@afetilu/core";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import casa from "../../assets/cenarios/casa.jpg";
import escola from "../../assets/cenarios/escola.jpg";
import parque from "../../assets/cenarios/parque.jpg";
import terapia from "../../assets/cenarios/terapia.jpg";
import { CENARIOS, type Acao, type Cenario } from "../lib/cenarios";
import { useApp, useTextos } from "../lib/estado";
import { ALVO_MINIMO, cor, espaco, raio } from "../lib/tema";
import { useHoje } from "../lib/usar-hoje";
import { useMovimento } from "../lib/usar-movimento";
import { ICONE_CATEGORIA, ICONE_SEM_CRISES } from "./icones";
import { CenaSlime } from "./slime/cena-slime";
import { DetalhesDaReacao } from "./slime/detalhes-da-reacao";
import { useSonsDoSlime } from "./slime/usar-sons";
import type { NomeIcone } from "./ui";

// Fundos gerados por ferramentas/cenarios/gerar_cenarios.py (estáticos, sem animação).
const FUNDO: Record<Local, number> = { casa, escola, parque, terapia };

/** Maior número de pílulas numa coluna, entre todos os cenários. */
const MAX_PILULAS = Math.max(...CENARIOS.flatMap((c) => [c.esquerda.length, c.direita.length]));

/** Fundo semi-opaco: o texto mantém contraste AA sobre qualquer cenário. */
const VIDRO = "rgba(255, 255, 255, 0.84)";

function Pilula(props: {
  rotulo: string;
  /** Nome completo para o leitor de tela (o rótulo visível pode ser curto). */
  rotuloAcessivel?: string;
  icone: NomeIcone;
  onPress: () => void;
  marcado?: boolean;
  alinhar: "esquerda" | "direita";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.rotuloAcessivel ?? props.rotulo}
      accessibilityState={props.marcado !== undefined ? { checked: props.marcado } : undefined}
      onPress={props.onPress}
      style={({ pressed }) => [
        estilos.pilula,
        props.alinhar === "direita" && { alignSelf: "flex-end", flexDirection: "row-reverse" },
        props.marcado && estilos.pilulaMarcada,
        pressed && { opacity: 0.8 },
      ]}
    >
      <MaterialCommunityIcons name={props.icone} size={18} color={cor.primaria} />
      <Text style={estilos.pilulaTexto} numberOfLines={1}>
        {props.rotulo}
      </Text>
    </Pressable>
  );
}

/** Tela inicial com cenário: o lugar onde a pessoa está, as ações daquele momento e o slime. */
export function InicioCenario() {
  const { pessoaAtiva, aparencia, definirAparencia, reacaoSlime, reagir, tentar } = useApp();
  const { t, d } = useTextos();
  const ti = t.inicio;
  const { hoje, hojeRegistros, emAberto, anotacaoHoje, carregado, falhou, tentarDeNovo, abrirRegistro, alternarSemCrises } = useHoje();
  const movimento = useMovimento();
  useSonsDoSlime(reacaoSlime.reacao, reacaoSlime.disparo, aparencia.som === "ligado");
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const lista = useRef<FlatList<Cenario>>(null);
  const [todasAbertas, setTodasAbertas] = useState(false);

  const indiceInicial = Math.max(0, CENARIOS.findIndex((c) => c.local === aparencia.local));
  const [indice, setIndice] = useState(indiceInicial);
  const local = CENARIOS[indice]?.local ?? "casa";

  const irPara = useCallback(
    (i: number) => {
      const alvo = (i + CENARIOS.length) % CENARIOS.length;
      lista.current?.scrollToIndex({ index: alvo, animated: movimento === "completo" });
      setIndice(alvo);
      tentar(() => definirAparencia({ local: CENARIOS[alvo]!.local }));
    },
    [definirAparencia, movimento, tentar],
  );

  const aoTerminarDeslize = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== indice && CENARIOS[i]) {
      setIndice(i);
      tentar(() => definirAparencia({ local: CENARIOS[i]!.local }));
    }
  };

  const executar = useCallback(
    (acao: Acao, lugar: Local) => {
      if (acao === "todas") setTodasAbertas(true);
      else if (acao === "sem_crises") alternarSemCrises();
      else abrirRegistro(acao, lugar);
    },
    [abrirRegistro, alternarSemCrises],
  );

  const rotuloDe = useCallback(
    (acao: Acao) =>
      acao === "todas" ? ti.todas : acao === "sem_crises" ? (anotacaoHoje ? ti.diaSemCrisesMarcado : ti.diaSemCrises) : d.categoria[acao],
    [anotacaoHoje, d, ti],
  );
  const rotuloCurtoDe = (acao: Acao) =>
    acao === "todas" ? ti.todas : acao === "sem_crises" ? ti.semCrisesCurto : d.categoriaCurta[acao];
  const iconeDe = (acao: Acao): NomeIcone =>
    acao === "todas" ? "dots-grid" : acao === "sem_crises" ? ICONE_SEM_CRISES : ICONE_CATEGORIA[acao];

  const topoPilulas = insets.top + 132;
  // O corpo começa a 0,17 da altura da área a partir do topo: a área cresce até onde o corpo
  // não encosta na coluna de pílulas mais longa (telas pequenas).
  const fimPilulas = topoPilulas + MAX_PILULAS * (ALVO_MINIMO + espaco.s);
  const alturaSlime = Math.min(height * 0.45, 425, (height - 72 - fimPilulas) / 0.83);
  const estiloSlime = useMemo(() => ({ height: alturaSlime, width }), [alturaSlime, width]);
  // Área do corpo do slime na cena (câmera fixa em cena-slime.tsx), medida no aparelho: cerca de
  // 0,74 da altura em largura, entre 0,17 e 0,83 da altura a partir de baixo. Um pouco de folga em volta.
  const areaToque = useMemo(
    () => ({ bottom: 72 + alturaSlime * 0.14, height: alturaSlime * 0.72, width: alturaSlime * 0.85, left: (width - alturaSlime * 0.85) / 2 }),
    [alturaSlime, width],
  );

  if (!pessoaAtiva) return null;

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <FlatList
        ref={lista}
        data={CENARIOS}
        keyExtractor={(c) => c.local}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={indiceInicial}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={aoTerminarDeslize}
        renderItem={({ item }) => (
          <ImageBackground source={FUNDO[item.local]} resizeMode="cover" style={{ width, height: "100%" }} accessibilityIgnoresInvertColors>
            {/* Toque no slime: fica na página (sob o slime, que não recebe toques) para o deslize
                entre cenários continuar funcionando a partir dele. Decorativo, fora do leitor de tela. */}
            <Pressable
              onPress={() => reagir("cutucada")}
              accessible={false}
              importantForAccessibility="no"
              style={[estilos.areaToque, areaToque]}
            />
            <View style={[estilos.colunas, { top: topoPilulas }]}>
              {(["esquerda", "direita"] as const).map((lado) => (
                <View key={lado} style={estilos.coluna}>
                  {item[lado].map((acao) => (
                    <Pilula
                      key={acao}
                      alinhar={lado}
                      rotulo={rotuloCurtoDe(acao)}
                      rotuloAcessivel={rotuloDe(acao)}
                      icone={iconeDe(acao)}
                      marcado={acao === "sem_crises" ? !!anotacaoHoje : undefined}
                      onPress={() => executar(acao, item.local)}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ImageBackground>
        )}
      />

      {/* Slime por cima do cenário; não intercepta toques (o toque nele é tratado na página). */}
      <View pointerEvents="none" style={[estilos.slime, { bottom: 72 }]}>
        <CenaSlime
          reacao={reacaoSlime.reacao}
          disparo={reacaoSlime.disparo}
          suspeita={reacaoSlime.suspeita}
          corBase={aparencia.corSlime}
          comemorativa={dataComemorativaDoDia(hoje, comemorativasDesligadas(aparencia.comemorativas))}
          movimento={movimento}
          corDeFundo={cor.fundo}
          fundoTransparente
          style={estiloSlime}
        />
        <DetalhesDaReacao
          reacao={reacaoSlime.reacao}
          disparo={reacaoSlime.disparo}
          regiao={reacaoSlime.regiao ? d.regiao[reacaoSlime.regiao] : undefined}
          movimento={movimento}
          altura={alturaSlime}
        />
      </View>

      {/* Cabeçalho: pessoa, dia, lugar e resumo; setas para quem usa leitor de tela. */}
      <View style={[estilos.cabecalho, { top: insets.top + espaco.s }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={ti.cenarioAnterior} onPress={() => irPara(indice - 1)} style={estilos.seta}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={cor.texto} />
        </Pressable>
        <View style={estilos.cartaoTopo} accessible accessibilityLabel={`${pessoaAtiva.apelido}. ${ti.hoje(diaPorExtenso(hoje, d))}. ${ti.cenarioAtual(d.local[local], indice + 1, CENARIOS.length)}`}>
          <Text style={estilos.nome} numberOfLines={1}>
            {pessoaAtiva.apelido} · {d.local[local]}
          </Text>
          <Text style={estilos.data}>{ti.hoje(diaPorExtenso(hoje, d))}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={ti.proximoCenario} onPress={() => irPara(indice + 1)} style={estilos.seta}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={cor.texto} />
        </Pressable>
      </View>
      <View style={[estilos.resumo, { top: insets.top + 78 }]}>
        {falhou ? (
          <Pressable accessibilityRole="button" accessibilityHint={t.geral.tentarDeNovo} onPress={tentarDeNovo} style={estilos.resumoBotao}>
            <Text style={estilos.resumoTexto}>{t.geral.falhaCarregar}</Text>
          </Pressable>
        ) : carregado ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/linha-do-tempo")} style={estilos.resumoBotao}>
            <Text style={estilos.resumoTexto}>{ti.hojeResumo(hojeRegistros.length)}</Text>
          </Pressable>
        ) : null}
        {emAberto.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => router.push("/linha-do-tempo")} style={estilos.resumoBotao}>
            <Text style={estilos.resumoTexto}>{ti.emAbertoResumo(emAberto.length)}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Pontos de posição (decorativos; o leitor de tela usa as setas). */}
      <View pointerEvents="none" style={[estilos.pontos, { bottom: 80 }]} importantForAccessibility="no-hide-descendants">
        {CENARIOS.map((c, i) => (
          <View key={c.local} style={[estilos.ponto, i === indice && estilos.pontoAtivo]} />
        ))}
      </View>

      {/* Sons desligados até a escolha: pergunta uma vez, sem bloquear a tela. */}
      {aparencia.som === "pendente" ? (
        <View style={[estilos.pergunta, { bottom: 104 }]}>
          <Text style={estilos.perguntaTitulo}>{ti.somPergunta}</Text>
          <Text style={estilos.perguntaTexto}>{ti.somPerguntaAjuda}</Text>
          <View style={estilos.perguntaBotoes}>
            <Pressable accessibilityRole="button" onPress={() => tentar(() => definirAparencia({ som: "desligado" }))} style={estilos.perguntaBotao}>
              <Text style={estilos.fecharTexto}>{ti.somAgoraNao}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => tentar(() => definirAparencia({ som: "ligado" }))}
              style={[estilos.perguntaBotao, estilos.perguntaBotaoPrincipal]}
            >
              <Text style={[estilos.fecharTexto, { color: cor.sobrePrimaria }]}>{ti.somAtivar}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal visible={todasAbertas} transparent animationType={movimento === "completo" ? "fade" : "none"} onRequestClose={() => setTodasAbertas(false)}>
        <View style={estilos.modalFundo}>
          <View style={estilos.modalCartao}>
            <Text style={estilos.modalTitulo} accessibilityRole="header">
              {ti.todasTitulo}
            </Text>
            <View style={estilos.modalGrade}>
              {[...CATEGORIAS, "sem_crises" as const].map((acao) => (
                <Pilula
                  key={acao}
                  alinhar="esquerda"
                  rotulo={rotuloDe(acao)}
                  icone={iconeDe(acao)}
                  marcado={acao === "sem_crises" ? !!anotacaoHoje : undefined}
                  onPress={() => {
                    setTodasAbertas(false);
                    executar(acao, local);
                  }}
                />
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={() => setTodasAbertas(false)} style={estilos.fechar}>
              <Text style={estilos.fecharTexto}>{ti.fechar}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// boxShadow (e não elevation): no Android, elevation sob fundo translúcido deixa um retângulo claro
// aparecendo no meio do cartão. A sombra externa do boxShadow não aparece através do fundo.
const sombra = { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.12)" };

const estilos = StyleSheet.create({
  colunas: { position: "absolute", left: espaco.m, right: espaco.m, flexDirection: "row", justifyContent: "space-between" },
  coluna: { width: "42%", gap: espaco.s },
  pilula: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: ALVO_MINIMO,
    backgroundColor: VIDRO,
    borderRadius: ALVO_MINIMO / 2,
    paddingHorizontal: espaco.m,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    ...sombra,
  },
  pilulaMarcada: { backgroundColor: cor.primariaClara, borderWidth: 1, borderColor: cor.primaria },
  pilulaTexto: { fontSize: 14, fontWeight: "600", color: cor.texto, flexShrink: 1 },
  slime: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  areaToque: { position: "absolute" },
  cabecalho: { position: "absolute", left: espaco.m, right: espaco.m, flexDirection: "row", alignItems: "center", gap: espaco.s },
  seta: { width: ALVO_MINIMO, height: ALVO_MINIMO, borderRadius: ALVO_MINIMO / 2, backgroundColor: VIDRO, alignItems: "center", justifyContent: "center", ...sombra },
  cartaoTopo: { flex: 1, backgroundColor: VIDRO, borderRadius: raio.l, paddingVertical: espaco.s, paddingHorizontal: espaco.l, alignItems: "center", ...sombra },
  nome: { fontSize: 18, fontWeight: "700", color: cor.texto },
  data: { fontSize: 14, color: cor.textoSuave },
  resumo: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: espaco.s },
  resumoBotao: { minHeight: 36, justifyContent: "center", paddingHorizontal: espaco.m, borderRadius: raio.l, backgroundColor: VIDRO, ...sombra },
  resumoTexto: { fontSize: 14, fontWeight: "600", color: cor.primaria },
  pontos: { position: "absolute", left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: espaco.s },
  ponto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: "rgba(34,50,74,0.3)" },
  pontoAtivo: { backgroundColor: cor.primaria, borderColor: cor.primaria },
  modalFundo: { flex: 1, backgroundColor: "rgba(34,50,74,0.45)", justifyContent: "flex-end" },
  modalCartao: { backgroundColor: cor.fundo, borderTopLeftRadius: raio.l, borderTopRightRadius: raio.l, padding: espaco.l, gap: espaco.l },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: cor.texto },
  modalGrade: { flexDirection: "row", flexWrap: "wrap", gap: espaco.s },
  fechar: { minHeight: ALVO_MINIMO, alignItems: "center", justifyContent: "center" },
  fecharTexto: { fontSize: 16, fontWeight: "600", color: cor.primaria },
  // Opaco: fica sobre o slime e precisa de leitura limpa.
  pergunta: { position: "absolute", left: espaco.m, right: espaco.m, backgroundColor: cor.fundo, borderRadius: raio.l, padding: espaco.l, gap: espaco.s, ...sombra },
  perguntaTitulo: { fontSize: 16, fontWeight: "700", color: cor.texto },
  perguntaTexto: { fontSize: 14, color: cor.textoSuave },
  perguntaBotoes: { flexDirection: "row", justifyContent: "flex-end", gap: espaco.s },
  perguntaBotao: { minHeight: ALVO_MINIMO, justifyContent: "center", paddingHorizontal: espaco.l, borderRadius: ALVO_MINIMO / 2 },
  perguntaBotaoPrincipal: { backgroundColor: cor.primaria },
});
