import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { Stack } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Aviso, Botao, Campo } from "../components/ui";
import {
  cifrarBackup,
  nomeDoArquivoDeBackup,
  PREF_ULTIMO_BACKUP,
  problemaDaSenha,
  SENHA_MIN,
  TIPO_ARQUIVO_BACKUP,
} from "../lib/backup";
import { useApp, useTextos } from "../lib/estado";
import { gravarPreferencia, lerConteudoParaBackup } from "../lib/repositorio";
import { cor, espaco, texto } from "../lib/tema";

type Destino = "aparelho" | "app";
type Resultado = { tipo: "ok"; destino: Destino; ignorados: number } | { tipo: "erro"; texto: string };

/** Arquivos de backup antigos no cache (cifrados, mas sem motivo para ficar). */
function limparCache(): void {
  for (const item of Paths.cache.list()) {
    if (item instanceof File && item.name.startsWith("afetilu-backup-")) item.delete();
  }
}

/**
 * Backup cifrado com senha. O arquivo é gerado uma vez (o scrypt leva alguns segundos) e pode ser
 * salvo numa pasta do aparelho ou entregue a outro app pela folha de compartilhamento do sistema.
 */
export default function FazerBackup() {
  const { db } = useApp();
  const { t } = useTextos();
  const tb = t.backup;
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [tentou, setTentou] = useState(false);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  // Texto do arquivo já cifrado com a senha atual; some quando a senha muda.
  const [gerado, setGerado] = useState<{ texto: string; ignorados: number } | null>(null);

  const problema = problemaDaSenha(senha, repetida);
  const ocupado = progresso !== null;

  const mudarSenha = (set: (v: string) => void) => (v: string) => {
    set(v);
    setGerado(null);
    setResultado(null);
  };

  const gerar = async () => {
    if (gerado) return gerado;
    setProgresso(0);
    const { conteudo, ignorados } = await lerConteudoParaBackup(db, new Date().toISOString());
    const texto = await cifrarBackup(conteudo, senha, {
      aleatorio: (n) => Crypto.getRandomBytes(n),
      aoProgredir: (f) => setProgresso(Math.round(f * 100)),
    });
    const novo = { texto, ignorados };
    setGerado(novo);
    return novo;
  };

  const executar = async (destino: Destino) => {
    setTentou(true);
    if (problema) return;
    setResultado(null);
    try {
      const nome = nomeDoArquivoDeBackup(new Date());
      if (destino === "aparelho") {
        let pasta: Directory;
        try {
          pasta = await Directory.pickDirectoryAsync();
        } catch {
          return; // Seletor cancelado.
        }
        const g = await gerar();
        pasta.createFile(nome, TIPO_ARQUIVO_BACKUP).write(g.texto);
        await concluir(destino, g.ignorados);
      } else {
        if (!(await Sharing.isAvailableAsync())) {
          setResultado({ tipo: "erro", texto: tb.semCompartilhamento });
          return;
        }
        const g = await gerar();
        limparCache();
        const arquivo = new File(Paths.cache, nome);
        arquivo.write(g.texto);
        await Sharing.shareAsync(arquivo.uri, { mimeType: TIPO_ARQUIVO_BACKUP, dialogTitle: tb.dialogo });
        await concluir(destino, g.ignorados);
      }
    } catch {
      // Mensagem genérica de propósito: nada do conteúdo vai para tela de erro ou log.
      setResultado({ tipo: "erro", texto: tb.falhou });
    } finally {
      setProgresso(null);
    }
  };

  const concluir = async (destino: Destino, ignorados: number) => {
    await gravarPreferencia(db, PREF_ULTIMO_BACKUP, new Date().toISOString());
    setResultado({ tipo: "ok", destino, ignorados });
  };

  const erroSenha = tentou && problema ? (problema === "curta" ? tb.senhaCurta(SENHA_MIN) : tb.senhaDiferente) : null;

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tb.titulo }} />
      <Text style={texto.corpo}>{tb.explicacao}</Text>
      <Aviso tipo="alerta" texto={tb.semRecuperacao} />
      <Campo rotulo={tb.senha} valor={senha} onChange={mudarSenha(setSenha)} senha />
      <Text style={texto.suave}>{tb.senhaAjuda(SENHA_MIN)}</Text>
      <Campo rotulo={tb.repetirSenha} valor={repetida} onChange={mudarSenha(setRepetida)} senha />
      {erroSenha ? <Aviso tipo="alerta" texto={erroSenha} /> : null}
      <Aviso texto={tb.arquivoSai} />
      <Botao rotulo={tb.salvarNoAparelho} desabilitado={ocupado} onPress={() => void executar("aparelho")} />
      <Botao variante="secundaria" rotulo={tb.enviarParaApp} desabilitado={ocupado} onPress={() => void executar("app")} />
      {ocupado ? (
        <View style={{ flexDirection: "row", gap: espaco.s, alignItems: "center" }} accessibilityLiveRegion="polite">
          <ActivityIndicator color={cor.primaria} />
          <Text style={texto.corpo}>{tb.protegendo(progresso ?? 0)}</Text>
        </View>
      ) : null}
      {resultado?.tipo === "ok" ? (
        <View style={{ gap: espaco.s }} accessibilityLiveRegion="polite">
          <Aviso texto={resultado.destino === "aparelho" ? tb.salvo : tb.enviado} />
          {resultado.ignorados > 0 ? <Aviso tipo="alerta" texto={tb.ignorados(resultado.ignorados)} /> : null}
        </View>
      ) : null}
      {resultado?.tipo === "erro" ? <Aviso tipo="alerta" texto={resultado.texto} /> : null}
    </ScrollView>
  );
}

