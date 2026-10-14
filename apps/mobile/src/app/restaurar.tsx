import { chaveDoDia, previaDoBackup, type ConteudoBackup, type EnvelopeBackup } from "@afetilu/core";
import { File } from "expo-file-system";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Aviso, Botao, Campo, Secao } from "../components/ui";
import { decifrarBackup, ErroBackup, lerArquivoDeBackup, PREF_ULTIMO_BACKUP, TAMANHO_MAX_BACKUP } from "../lib/backup";
import { useApp, useTextos } from "../lib/estado";
import { confirmacaoConfere } from "../lib/exclusao";
import { contarTudo, gravarPreferencia, lerPreferencia, substituirPorBackup } from "../lib/repositorio";
import { cor, espaco, texto } from "../lib/tema";

/**
 * Restauração de um backup: escolher o arquivo, digitar a senha, conferir a prévia e só então
 * substituir todos os dados do aparelho. Com dados no aparelho, a troca pede confirmação digitada.
 */
export default function Restaurar() {
  const { db, recarregarPessoas, notificarMudanca } = useApp();
  const { t } = useTextos();
  const tr = t.restaurar;
  const [arquivo, setArquivo] = useState<{ nome: string; envelope: EnvelopeBackup } | null>(null);
  const [senha, setSenha] = useState("");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [conteudo, setConteudo] = useState<ConteudoBackup | null>(null);
  const [atuais, setAtuais] = useState<{ pessoas: number; registros: number } | null>(null);
  const [digitado, setDigitado] = useState("");
  const [restaurando, setRestaurando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void contarTudo(db).then((c) => {
      if (ativo) setAtuais(c);
    });
    return () => {
      ativo = false;
    };
  }, [db]);

  const dataCurta = (chave: string) => {
    const [a, m, d] = chave.split("-").map(Number);
    return t.resumo.data(d!, m!, a!);
  };

  const escolher = async () => {
    setErro(null);
    setConteudo(null);
    setSenha("");
    setDigitado("");
    const r = await File.pickFileAsync();
    if (r.canceled) return;
    setArquivo(null);
    try {
      if ((r.result.size ?? 0) > TAMANHO_MAX_BACKUP) throw new ErroBackup("nao_e_backup");
      setArquivo({ nome: r.result.name, envelope: lerArquivoDeBackup(await r.result.text()) });
    } catch (e) {
      setErro(e instanceof ErroBackup ? tr.erros[e.tipo] : tr.falhouLer);
    }
  };

  const abrir = async () => {
    if (!arquivo) return;
    setErro(null);
    setProgresso(0);
    try {
      setConteudo(await decifrarBackup(arquivo.envelope, senha, (f) => setProgresso(Math.round(f * 100))));
      setSenha("");
    } catch (e) {
      setErro(e instanceof ErroBackup ? tr.erros[e.tipo] : tr.erros.conteudo_invalido);
    } finally {
      setProgresso(null);
    }
  };

  const restaurar = async () => {
    if (!conteudo) return;
    setErro(null);
    setRestaurando(true);
    try {
      await substituirPorBackup(db, conteudo);
      // Os dados agora são os do backup: "último backup" passa a contar a partir dele, se for mais recente.
      const ultimo = await lerPreferencia(db, PREF_ULTIMO_BACKUP);
      if (!ultimo || ultimo < conteudo.criadoEm) await gravarPreferencia(db, PREF_ULTIMO_BACKUP, conteudo.criadoEm);
      notificarMudanca();
      router.back();
      await recarregarPessoas();
    } catch {
      setErro(tr.falhou);
      setRestaurando(false);
    }
  };

  const previa = conteudo ? previaDoBackup(conteudo) : null;
  const temDados = (atuais?.pessoas ?? 0) > 0;
  const liberado = !restaurando && (!temDados || confirmacaoConfere(digitado, tr.palavra));

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr.titulo }} />
      <Text style={texto.corpo}>{tr.explicacao}</Text>
      <Botao
        variante={arquivo ? "secundaria" : "primaria"}
        rotulo={arquivo ? tr.escolherOutro : tr.escolher}
        desabilitado={progresso !== null || restaurando}
        onPress={() => void escolher()}
      />

      {arquivo && !previa ? (
        <Secao titulo={arquivo.nome}>
          <Campo rotulo={tr.senha} valor={senha} onChange={setSenha} senha />
          <Botao rotulo={tr.abrir} desabilitado={!senha || progresso !== null} onPress={() => void abrir()} />
          {progresso !== null ? (
            <View style={{ flexDirection: "row", gap: espaco.s, alignItems: "center" }} accessibilityLiveRegion="polite">
              <ActivityIndicator color={cor.primaria} />
              <Text style={texto.corpo}>{tr.abrindo(progresso)}</Text>
            </View>
          ) : null}
        </Secao>
      ) : null}

      {erro ? <Aviso tipo="alerta" texto={erro} /> : null}

      {previa ? (
        <Secao titulo={tr.previaTitulo}>
          <Text style={texto.corpo}>{tr.feitoEm(dataCurta(chaveDoDia(new Date(previa.criadoEm))))}</Text>
          {previa.pessoas.map((p, i) => (
            <Text key={i} style={texto.corpo}>
              • {tr.pessoa(p.apelido, p.registros)}
            </Text>
          ))}
          <Text style={texto.corpo}>{tr.totais(previa.registros, previa.diasSemCrises)}</Text>
          {previa.periodo ? <Text style={texto.corpo}>{tr.periodo(dataCurta(previa.periodo.inicio), dataCurta(previa.periodo.fim))}</Text> : null}
          {temDados && atuais ? (
            <>
              <Aviso tipo="alerta" texto={tr.substitui(atuais.pessoas, atuais.registros)} />
              <Campo rotulo={tr.digite(tr.palavra)} valor={digitado} onChange={setDigitado} literal />
            </>
          ) : null}
          <Botao
            variante={temDados ? "perigo" : "primaria"}
            rotulo={restaurando ? tr.restaurando : tr.confirmar}
            desabilitado={!liberado}
            onPress={() => void restaurar()}
          />
        </Secao>
      ) : null}
    </ScrollView>
  );
}
