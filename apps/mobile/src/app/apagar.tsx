import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text } from "react-native";
import { FalhaAoCarregar } from "../components/falha-ao-carregar";
import { Aviso, Botao, Campo } from "../components/ui";
import { useApp, useTextos } from "../lib/estado";
import { confirmacaoConfere } from "../lib/exclusao";
import { limparExportacoes } from "../lib/exportacoes";
import { apagarPessoa, contarDadosDaPessoa } from "../lib/repositorio";
import { espaco, texto } from "../lib/tema";
import { useConsulta } from "../lib/usar-consulta";

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
  // Fixada na abertura: depois de apagada, a pessoa some da lista, mas a tela ainda fala dela.
  const [pessoa] = useState(() => (!ehTudo && params.pessoa ? pessoas.find((p) => p.id === params.pessoa) : undefined));
  const consulta = useConsulta(pessoa ? pessoa.id : null, () => contarDadosDaPessoa(db, pessoa!.id));
  const contagem = consulta.dados;
  const [digitado, setDigitado] = useState("");
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Pessoa já apagada ou endereço inválido: nada a mostrar.
  if (!ehTudo && !pessoa) return null;
  const esperado = pessoa ? pessoa.apelido : ta.palavraTudo;

  const confirmar = async () => {
    setApagando(true);
    setErro(null);
    if (!pessoa) {
      try {
        // Fecha e apaga o banco e a chave; o app reabre vazio, no primeiro uso.
        await apagarTudo();
      } catch {
        setErro(ta.falhouTudo);
        setApagando(false);
      }
      return;
    }
    try {
      await apagarPessoa(db, pessoa.id);
    } catch {
      setErro(ta.falhou);
      setApagando(false);
      return;
    }
    // A pessoa já foi apagada: uma falha daqui em diante não pode dizer que nada mudou.
    // PDFs de resumo no cache também saem (podem ser dela).
    limparExportacoes();
    notificarMudanca();
    try {
      await recarregarPessoas();
    } catch {
      // O botão continua travado: não há mais o que apagar.
      setErro(ta.apagadaSemAtualizar);
      return;
    }
    router.back();
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
      {consulta.falhou ? <FalhaAoCarregar tentarDeNovo={consulta.tentarDeNovo} /> : null}
      {erro ? <Aviso tipo="alerta" texto={erro} /> : null}
      <Botao
        variante="perigo"
        rotulo={pessoa ? ta.confirmarPessoa(pessoa.apelido) : ta.confirmarTudo}
        desabilitado={!confirmacaoConfere(digitado, esperado) || apagando}
        onPress={() => void confirmar()}
      />
    </ScrollView>
  );
}
