import { chaveDoDia, previaDoBackup, type ConteudoBackup, type EnvelopeBackup } from "@afetilu/core";
import { File } from "expo-file-system";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { FalhaAoCarregar } from "../components/falha-ao-carregar";
import { Aviso, Botao, Campo, Secao } from "../components/ui";
import { decifrarBackup, ErroBackup, lerArquivoDeBackup, nomeLegivel, PREF_ULTIMO_BACKUP, TAMANHO_MAX_BACKUP } from "../lib/backup";
import { useApp, useTextos } from "../lib/estado";
import { restauracaoLiberada } from "../lib/exclusao";
import { limparExportacoes } from "../lib/exportacoes";
import { contarTudo, gravarPreferencia, lerPreferencia, substituirPorBackup } from "../lib/repositorio";
import { cor, espaco, texto } from "../lib/tema";
import { useConsulta } from "../lib/usar-consulta";

/**
 * Restauração de um backup: escolher o arquivo, digitar a senha, conferir a prévia e só então
 * substituir todos os dados do aparelho. Com dados no aparelho, a troca pede confirmação digitada.
 */
export default function Restaurar() {
  const { db, recarregarPessoas, notificarMudanca } = useApp();
  const { t, d } = useTextos();
  const tr = t.restaurar;
  const [arquivo, setArquivo] = useState<{ nome: string; envelope: EnvelopeBackup } | null>(null);
  const [senha, setSenha] = useState("");
  const [progresso, setProgresso] = useState<number | null>(null);
  const [conteudo, setConteudo] = useState<ConteudoBackup | null>(null);
  const [digitado, setDigitado] = useState("");
  const [restaurando, setRestaurando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const contagem = useConsulta("atuais", () => contarTudo(db));
  const atuais = contagem.dados;

  const dataCurta = (chave: string) => {
    const [a, m, d] = chave.split("-").map(Number);
    return t.resumo.data(d!, m!, a!);
  };

  const escolher = async () => {
    setErro(null);
    setConteudo(null);
    setSenha("");
    setDigitado("");
    const r = await File.pickFileAsync().catch(() => null);
    if (!r) {
      setErro(tr.falhouLer);
      return;
    }
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
    } catch {
      setErro(tr.falhou);
      setRestaurando(false);
      return;
    }
    // Daqui em diante os dados já são os do backup: uma falha não pode dizer que nada mudou.
    // PDFs e backups no cache eram dos dados substituídos.
    if (!limparExportacoes()) Alert.alert(t.geral.copiasFicaramTitulo, t.geral.copiasFicaramTexto);
    notificarMudanca();
    try {
      // "Último backup" passa a contar a partir do restaurado, se for mais recente.
      const ultimo = await lerPreferencia(db, PREF_ULTIMO_BACKUP);
      if (!ultimo || ultimo < conteudo.criadoEm) await gravarPreferencia(db, PREF_ULTIMO_BACKUP, conteudo.criadoEm);
      await recarregarPessoas();
    } catch {
      setConteudo(null);
      setErro(tr.restauradoSemAtualizar);
      setRestaurando(false);
      return;
    }
    router.back();
  };

  const previa = conteudo ? previaDoBackup(conteudo) : null;
  const temDados = (atuais?.pessoas ?? 0) > 0;
  const liberado = !restaurando && restauracaoLiberada(atuais, digitado, tr.palavra);

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: 80 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: tr.titulo }} />
      <Text style={texto.corpo}>{tr.explicacao}</Text>
      <Botao
        variante={arquivo ? "secundaria" : "primaria"}
        rotulo={arquivo ? tr.escolherOutro : tr.escolher}
        desabilitado={progresso !== null || restaurando}
        onPress={() => void escolher()}
      />

      {arquivo && !previa ? (
        <Secao titulo={nomeLegivel(arquivo.nome) ?? tr.arquivoEscolhido}>
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
          <Text style={texto.corpo}>{tr.feitoEm(dataCurta(chaveDoDia(new Date(previa.criadoEm))), d.hora(new Date(previa.criadoEm)))}</Text>
          {previa.pessoas.map((p, i) => (
            <Text key={i} style={texto.corpo}>
              • {tr.pessoa(p.apelido, p.registros)}
            </Text>
          ))}
          <Text style={texto.corpo}>{tr.totais(previa.registros, previa.diasSemCrises)}</Text>
          {previa.periodo ? <Text style={texto.corpo}>{tr.periodo(dataCurta(previa.periodo.inicio), dataCurta(previa.periodo.fim))}</Text> : null}
          {contagem.falhou ? <FalhaAoCarregar tentarDeNovo={contagem.tentarDeNovo} /> : null}
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
