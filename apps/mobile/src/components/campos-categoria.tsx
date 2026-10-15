import {
  INTENSIDADES,
  LIMITES,
  OBSERVADOS,
  ONDE_EVACUACAO,
  QUANTIDADES,
  REGIOES,
  TIPOS_DESCONFORTO,
  TIPOS_EVACUACAO,
  TIPOS_HIGIENE,
  TIPOS_POSITIVO,
  type Intensidade,
} from "@afetilu/core";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTextos } from "../lib/estado";
import type { Rascunho } from "../lib/formulario";
import { espaco, texto } from "../lib/tema";
import { Botao, Campo, Chip, Escolha, EscolhaMultipla, Recolhivel, estilos } from "./ui";

type Props = { rascunho: Rascunho; alterar: (r: Rascunho) => void; sugestoesAjudou: string[] };

// Leitura e escrita de campos do rascunho com tipo explícito no ponto de uso.
const ler = <T,>(r: Record<string, unknown>, k: string) => r[k] as T | undefined;
const com = (r: Rascunho, k: string, v: unknown): Rascunho => ({ ...r, [k]: v });

function EscolhaIntensidade(props: { rotulo: string; valor: Intensidade | undefined; onChange: (v: Intensidade | undefined) => void }) {
  const { d } = useTextos();
  const rotulos = Object.fromEntries(INTENSIDADES.map((i) => [i, d.intensidade[i].rotulo])) as Record<Intensidade, string>;
  return (
    <View style={{ gap: espaco.s }}>
      <Escolha opcional rotulo={props.rotulo} opcoes={INTENSIDADES} rotulos={rotulos} valor={props.valor} onChange={props.onChange} />
      {props.valor ? <Text style={texto.suave}>{d.intensidade[props.valor].criterio}</Text> : null}
    </View>
  );
}

/** Campos essenciais visíveis; detalhes opcionais recolhidos. */
export function CamposCategoria({ rascunho: r, alterar, sugestoesAjudou }: Props) {
  const { t, d } = useTextos();
  const c = t.campos;
  switch (r.categoria) {
    case "alimentacao":
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha
            rotulo={c.comidaOuBebida}
            opcoes={["comida", "bebida"] as const}
            rotulos={d.tipoAlimento}
            valor={ler(r, "tipo")}
            onChange={(v) => v && alterar(com(r, "tipo", v))}
          />
          <Campo rotulo={c.oQue} valor={ler<string>(r, "item") ?? ""} onChange={(v) => alterar(com(r, "item", v))} max={LIMITES.textoCurto} dica={c.oQueAlimentoDica} />
          <Recolhivel titulo={c.maisDetalhes}>
            <Escolha opcional rotulo={c.quantidade} opcoes={QUANTIDADES} rotulos={d.quantidade} valor={ler(r, "quantidade")} onChange={(v) => alterar(com(r, "quantidade", v))} />
            <Campo rotulo={c.comoFicouDepois} multilinha valor={ler<string>(r, "comoFicouDepois") ?? ""} onChange={(v) => alterar(com(r, "comoFicouDepois", v))} max={LIMITES.observacao} />
          </Recolhivel>
        </View>
      );

    case "dor_desconforto":
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha rotulo={c.oQuePercebido} opcoes={TIPOS_DESCONFORTO} rotulos={d.desconforto} valor={ler(r, "tipo")} onChange={(v) => v && alterar(com(r, "tipo", v))} />
          <Escolha opcional rotulo={c.regiao} opcoes={REGIOES} rotulos={d.regiao} valor={ler(r, "regiao")} onChange={(v) => alterar(com(r, "regiao", v))} />
          <Recolhivel titulo={c.maisDetalhes}>
            <EscolhaIntensidade rotulo={c.intensidadePercebida} valor={ler(r, "intensidade")} onChange={(v) => alterar(com(r, "intensidade", v))} />
            <Campo rotulo={c.sinais} multilinha valor={ler<string>(r, "sinais") ?? ""} onChange={(v) => alterar(com(r, "sinais", v))} max={LIMITES.observacao} dica={c.sinaisDica} />
          </Recolhivel>
        </View>
      );

    case "comportamento":
      return <CamposComportamento rascunho={r} alterar={alterar} sugestoesAjudou={sugestoesAjudou} />;

    case "higiene":
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha rotulo={c.oQue} opcoes={TIPOS_HIGIENE} rotulos={d.higiene} valor={ler(r, "tipo")} onChange={(v) => v && alterar(com(r, "tipo", v))} />
          <Escolha
            opcional
            rotulo={c.aceitacao}
            opcoes={["aceitou", "com_ajuda", "recusou"] as const}
            rotulos={d.aceitacao}
            valor={ler(r, "aceitacao")}
            onChange={(v) => alterar(com(r, "aceitacao", v))}
          />
        </View>
      );

    case "sono": {
      const despertares = ler<number>(r, "despertares");
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha
            rotulo={c.tipo}
            opcoes={["noturno", "cochilo"] as const}
            rotulos={d.tipoSono}
            valor={ler(r, "tipo")}
            onChange={(v) => v && alterar(com(r, "tipo", v))}
          />
          <Recolhivel titulo={c.maisDetalhes}>
            <View style={{ gap: espaco.s }}>
              <Text style={estilos.rotulo}>{c.despertares}</Text>
              <View style={estilos.linhaChips}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <Chip
                    key={n}
                    rotulo={n === 4 ? c.quatroOuMais : String(n)}
                    selecionado={despertares === n}
                    onPress={() => alterar(com(r, "despertares", despertares === n ? undefined : n))}
                  />
                ))}
              </View>
            </View>
          </Recolhivel>
        </View>
      );
    }

    case "evacuacao":
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha rotulo={c.oQue} opcoes={TIPOS_EVACUACAO} rotulos={d.evacuacao} valor={ler(r, "tipo")} onChange={(v) => v && alterar(com(r, "tipo", v))} />
          <Escolha opcional rotulo={c.onde} opcoes={ONDE_EVACUACAO} rotulos={d.ondeEvacuacao} valor={ler(r, "onde")} onChange={(v) => alterar(com(r, "onde", v))} />
          {ler(r, "tipo") === "coco" ? (
            <Recolhivel titulo={c.maisDetalhes}>
              <Campo rotulo={c.aspecto} multilinha valor={ler<string>(r, "aspecto") ?? ""} onChange={(v) => alterar(com(r, "aspecto", v))} max={LIMITES.observacao} />
            </Recolhivel>
          ) : null}
        </View>
      );

    case "positivo":
      return (
        <View style={{ gap: espaco.l }}>
          <Escolha rotulo={c.oQue} opcoes={TIPOS_POSITIVO} rotulos={d.positivo} valor={ler(r, "tipo")} onChange={(v) => v && alterar(com(r, "tipo", v))} />
          <Campo rotulo={c.descricao} multilinha valor={ler<string>(r, "descricao") ?? ""} onChange={(v) => alterar(com(r, "descricao", v))} max={LIMITES.observacao} />
        </View>
      );
  }
}

const DURACOES = [5, 15, 30, 60] as const;

function CamposComportamento({ rascunho: r, alterar, sugestoesAjudou }: Props) {
  const { t, d } = useTextos();
  const c = t.campos;
  const episodio = ler<Record<string, unknown>>(r, "episodio") ?? {};
  const comEpisodio = (k: string, v: unknown) => alterar(com(r, "episodio", { ...episodio, [k]: v }));
  const ajudou = ler<string[]>(episodio, "ajudou") ?? [];
  const [novoAjudou, setNovoAjudou] = useState("");
  const duracao = ler<number>(episodio, "duracaoMin");
  const sugestoes = [...new Set([...sugestoesAjudou, ...ajudou])];
  const ehEpisodio = ler<boolean>(r, "ehEpisodio") === true;

  return (
    <View style={{ gap: espaco.l }}>
      <EscolhaMultipla
        rotulo={c.observadoTitulo}
        opcoes={OBSERVADOS}
        rotulos={d.observado}
        valor={ler<(typeof OBSERVADOS)[number][]>(r, "observado") ?? []}
        onChange={(v) => alterar(com(r, "observado", v))}
      />
      <Chip multiplo rotulo={c.foiEpisodio} selecionado={ehEpisodio} onPress={() => alterar(com(r, "ehEpisodio", !ehEpisodio))} />
      {ehEpisodio ? (
        <Recolhivel titulo={c.detalhesEpisodio} abertoInicial>
          <View style={{ gap: espaco.s }}>
            <Text style={estilos.rotulo}>{c.duracao}</Text>
            <View style={estilos.linhaChips}>
              {DURACOES.map((m) => (
                <Chip key={m} rotulo={m === 60 ? c.umaHora : c.minutos(m)} selecionado={duracao === m} onPress={() => comEpisodio("duracaoMin", duracao === m ? undefined : m)} />
              ))}
            </View>
          </View>
          <EscolhaIntensidade rotulo={c.intensidade} valor={ler(episodio, "intensidade")} onChange={(v) => comEpisodio("intensidade", v)} />
          <Campo rotulo={c.antes} multilinha valor={ler<string>(episodio, "contextoAntes") ?? ""} onChange={(v) => comEpisodio("contextoAntes", v)} max={LIMITES.observacao} />
          <Campo rotulo={c.voceFez} multilinha valor={ler<string>(episodio, "medidas") ?? ""} onChange={(v) => comEpisodio("medidas", v)} max={LIMITES.observacao} />
          <Campo rotulo={c.comoTerminou} multilinha valor={ler<string>(episodio, "desfecho") ?? ""} onChange={(v) => comEpisodio("desfecho", v)} max={LIMITES.observacao} />
          <Escolha
            opcional
            rotulo={c.houveLesao}
            opcoes={["sim", "nao", "nao_sei"] as const}
            rotulos={d.lesao}
            valor={ler(episodio, "lesao")}
            onChange={(v) => comEpisodio("lesao", v)}
          />
          <View style={{ gap: espaco.s }}>
            <Text style={estilos.rotulo}>{c.ajudou}</Text>
            {sugestoes.length ? (
              <View style={estilos.linhaChips}>
                {sugestoes.map((s) => (
                  <Chip
                    key={s}
                    multiplo
                    rotulo={s}
                    selecionado={ajudou.includes(s)}
                    onPress={() => comEpisodio("ajudou", ajudou.includes(s) ? ajudou.filter((x) => x !== s) : [...ajudou, s])}
                  />
                ))}
              </View>
            ) : null}
            <Campo rotulo={c.acrescentar} valor={novoAjudou} onChange={setNovoAjudou} max={LIMITES.textoCurto} dica={c.acrescentarDica} />
            <Botao
              variante="secundaria"
              rotulo={c.acrescentarBotao}
              desabilitado={!novoAjudou.trim() || ajudou.length >= LIMITES.itensAjudou}
              onPress={() => {
                const v = novoAjudou.trim();
                if (v && !ajudou.includes(v)) comEpisodio("ajudou", [...ajudou, v]);
                setNovoAjudou("");
              }}
            />
          </View>
        </Recolhivel>
      ) : null}
    </View>
  );
}
