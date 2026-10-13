import {
  CATEGORIAS,
  chaveDoDia,
  contextoDaUltimaRefeicao,
  legendaDoRegistro,
  LIMITES,
  LOCAIS,
  ORIGENS,
  resolverQuando,
  somarDias,
  type Categoria,
  type Local,
  type Registro,
} from "@eloazul/core";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CamposCategoria } from "../../components/campos-categoria";
import { reacaoDoRegistro } from "../../components/slime/reacao-do-registro";
import { SeletorDataHora } from "../../components/seletor-data";
import { SeletorQuando } from "../../components/seletor-quando";
import { Aviso, Botao, Campo, Chip, Escolha, Secao, estilos } from "../../components/ui";
import { useApp, useTextos } from "../../lib/estado";
import { formularioDoRegistro, formularioNovo, montarEntrada, TEM_TERMINO, type Formulario } from "../../lib/formulario";
import { apagarRegistro, criarRegistro, listarRegistros, obterRegistro, salvarCorrecao } from "../../lib/repositorio";
import { cor, espaco, texto } from "../../lib/tema";

/** Dias de episódios anteriores consultados para sugerir "o que ajudou". */
const DIAS_SUGESTOES = 90;

export default function TelaRegistro() {
  const params = useLocalSearchParams<{ categoria: string; id?: string; local?: string }>();
  const localInicial = (LOCAIS as readonly string[]).includes(params.local ?? "") ? (params.local as Local) : undefined;
  const categoria = (CATEGORIAS as readonly string[]).includes(params.categoria) ? (params.categoria as Categoria) : null;
  const { db, pessoaAtiva, notificarMudanca, oferecerDesfazer, reagir } = useApp();
  const { t, d } = useTextos();
  const tr = t.registro;
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Formulario | null>(() =>
    categoria && !params.id ? formularioNovo(categoria, new Date(), localInicial) : null,
  );
  const [original, setOriginal] = useState<Registro | null>(null);
  const [recentes, setRecentes] = useState<Registro[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!pessoaAtiva) return;
    let ativo = true;
    void (async () => {
      const hoje = chaveDoDia(new Date());
      const lista = await listarRegistros(db, pessoaAtiva.id, somarDias(hoje, -DIAS_SUGESTOES), hoje);
      if (!ativo) return;
      setRecentes(lista);
      if (params.id) {
        const r = await obterRegistro(db, params.id);
        if (!ativo) return;
        if (r) {
          setOriginal(r);
          setForm(formularioDoRegistro(r, new Date()));
        } else {
          setErro(tr.erros.naoEncontrado);
        }
      }
    })();
    return () => {
      ativo = false;
    };
  }, [db, pessoaAtiva, params.id, tr]);

  const sugestoesAjudou = useMemo(() => {
    const todas = recentes.flatMap((r) => (r.detalhe.categoria === "comportamento" ? (r.detalhe.episodio?.ajudou ?? []) : []));
    return [...new Set(todas)].slice(0, 12);
  }, [recentes]);

  const contexto = useMemo(() => {
    if (!form || !pessoaAtiva || form.rascunho.categoria !== "dor_desconforto") return null;
    const q = resolverQuando(form.quando, new Date());
    return contextoDaUltimaRefeicao({ pessoaId: pessoaAtiva.id, ...q, id: original?.id }, recentes, d);
  }, [form, pessoaAtiva, recentes, original, d]);

  if (!categoria || !pessoaAtiva) {
    return <Aviso tipo="alerta" texto={tr.categoriaInvalida} />;
  }
  if (!form) {
    return <View style={{ flex: 1 }}>{erro ? <Aviso tipo="alerta" texto={erro} /> : null}</View>;
  }

  const atualizar = (parcial: Partial<Formulario>) => {
    setErro(null);
    setForm({ ...form, ...parcial });
  };

  const salvar = async () => {
    const agora = new Date();
    const resultado = montarEntrada(form, pessoaAtiva.id, agora);
    if (!resultado.ok) return setErro(tr.erros[resultado.erro]);
    setSalvando(true);
    try {
      if (original) {
        await salvarCorrecao(db, original.id, resultado.entrada);
        notificarMudanca();
      } else {
        const r = await criarRegistro(db, resultado.entrada);
        notificarMudanca();
        oferecerDesfazer(legendaDoRegistro(r, chaveDoDia(agora), d), () => apagarRegistro(db, r.id));
        reagir(reacaoDoRegistro(r, agora));
      }
      router.back();
    } catch (e) {
      const causa = __DEV__ && e instanceof Error ? ` (${e.message})` : "";
      setErro(e instanceof Error && e.message === "conflito" ? tr.erros.conflito : tr.erros.falhaSalvar + causa);
      setSalvando(false);
    }
  };

  const rotulosTermino = categoria === "sono" ? tr.terminoSono : tr.terminoDor;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: original ? tr.corrigir(d.categoria[categoria]) : d.categoria[categoria] }} />
      <ScrollView
        contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: espaco.xl }}
        keyboardShouldPersistTaps="handled"
      >
        <Secao titulo={tr.quandoTitulo}>
          <SeletorQuando valor={form.quando} onChange={(quando) => atualizar({ quando })} />
        </Secao>

        <Secao>
          <CamposCategoria rascunho={form.rascunho} alterar={(rascunho) => atualizar({ rascunho })} sugestoesAjudou={sugestoesAjudou} />
          {contexto ? <Aviso texto={tr.contexto(contexto)} /> : null}
        </Secao>

        {TEM_TERMINO.has(categoria) ? (
          <Secao titulo={tr.terminoTitulo}>
            <Escolha
              opcoes={["nao_informado", "em_aberto", "horario"] as const}
              rotulos={rotulosTermino}
              valor={form.termino}
              onChange={(termino) => termino && atualizar({ termino })}
            />
            {form.termino === "horario" ? (
              <SeletorDataHora valor={form.terminoEm} maximo={new Date()} onChange={(terminoEm) => atualizar({ terminoEm })} />
            ) : null}
          </Secao>
        ) : null}

        <Secao titulo={tr.localTitulo}>
          <Escolha opcional opcoes={LOCAIS} rotulos={d.local} valor={form.local} onChange={(local) => atualizar({ local })} />
        </Secao>

        <Secao titulo={tr.origemTitulo}>
          <View style={estilos.linhaChips} accessibilityRole="radiogroup">
            {ORIGENS.map((o) => (
              <Chip key={o} rotulo={d.origem[o]} selecionado={form.origem === o} onPress={() => atualizar({ origem: o })} />
            ))}
          </View>
          {form.origem === "me_contaram" ? (
            <Campo rotulo={tr.quemContou} valor={form.origemQuem} onChange={(origemQuem) => atualizar({ origemQuem })} max={LIMITES.textoCurto} dica={tr.quemContouDica} />
          ) : null}
          {form.origem === "suspeita" ? <Text style={texto.suave}>{tr.suspeitaAjuda}</Text> : null}
        </Secao>

        <Secao>
          <Campo rotulo={tr.observacao} multilinha valor={form.observacao} onChange={(observacao) => atualizar({ observacao })} max={LIMITES.observacao} />
          <Text style={texto.suave}>{tr.observacaoAjuda}</Text>
        </Secao>

      </ScrollView>
      {/* Salvar fica sempre visível: o registro mínimo não exige rolar a tela. */}
      <View style={{ padding: espaco.l, paddingBottom: insets.bottom + espaco.m, gap: espaco.s, borderTopWidth: 1, borderTopColor: cor.borda, backgroundColor: cor.fundo }}>
        {erro ? <Aviso tipo="alerta" texto={erro} /> : null}
        <Botao rotulo={original ? tr.salvarCorrecao : tr.salvar} onPress={() => void salvar()} desabilitado={salvando} />
      </View>
    </KeyboardAvoidingView>
  );
}
