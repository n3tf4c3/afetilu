import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Aviso, Botao, Campo } from "../components/ui";
import { useApp, useTextos } from "../lib/estado";
import { confirmacaoConfere } from "../lib/exclusao";
import { apagarPessoa, contarDadosDaPessoa } from "../lib/repositorio";
import { espaco, texto } from "../lib/tema";

/**
 * Exclusão definitiva de uma pessoa (`?pessoa=<id>`) ou de tudo (`?tudo=1`). O botão só libera
 * depois que o responsável digita o apelido (ou a palavra de "apagar tudo").
 */
export default function Apagar() {
  const params = useLocalSearchParams<{ pessoa?: string; tudo?: string }>();
  const { db, pessoas, recarregarPessoas, notificarMudanca, apagarTudo } = useApp();
  const { t } = useTextos();
  const ta = t.apagar;
  const ehTudo = params.tudo === "1";
  const pessoa = !ehTudo && params.pessoa ? pessoas.find((p) => p.id === params.pessoa) : undefined;
  const [contagem, setContagem] = useState<{ registros: number; diasSemCrises: number } | null>(null);
  const [digitado, setDigitado] = useState("");
  const [apagando, setApagando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!pessoa) return;
    let ativo = true;
    void contarDadosDaPessoa(db, pessoa.id).then((c) => {
      if (ativo) setContagem(c);
    });
    return () => {
      ativo = false;
    };
  }, [db, pessoa]);

  // Pessoa já apagada ou endereço inválido: nada a mostrar.
  if (!ehTudo && !pessoa) return null;
  const esperado = pessoa ? pessoa.apelido : ta.palavraTudo;

  const confirmar = async () => {
    setApagando(true);
    setFalhou(false);
    try {
      if (pessoa) {
        await apagarPessoa(db, pessoa.id);
        notificarMudanca();
        router.back();
        await recarregarPessoas();
      } else {
        // Fecha e apaga o banco e a chave; o app reabre vazio, no primeiro uso.
        await apagarTudo();
      }
    } catch {
      setFalhou(true);
      setApagando(false);
    }
  };

  const descricao = pessoa
    ? contagem
      ? ta.oQueApagaPessoa(pessoa.apelido, contagem.registros, contagem.diasSemCrises)
      : ""
    : ta.oQueApagaTudo;

  return (
    <ScrollView contentContainerStyle={{ padding: espaco.l, gap: espaco.l }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Stack.Screen options={{ title: pessoa ? ta.tituloPessoa(pessoa.apelido) : ta.tituloTudo }} />
      <Text style={texto.corpo}>{descricao}</Text>
      <Aviso tipo="alerta" texto={ta.semVolta} />
      <Campo rotulo={ta.digite(esperado)} valor={digitado} onChange={setDigitado} literal />
      {falhou ? <Aviso tipo="alerta" texto={ta.falhou} /> : null}
      <Botao
        variante="perigo"
        rotulo={pessoa ? ta.confirmarPessoa(pessoa.apelido) : ta.confirmarTudo}
        desabilitado={!confirmacaoConfere(digitado, esperado) || apagando}
        onPress={() => void confirmar()}
      />
    </ScrollView>
  );
}
