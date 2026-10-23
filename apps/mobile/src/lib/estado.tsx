import { ehIdioma, resolverIdioma, type Idioma, type Pessoa } from "@afetilu/core";
import { getLocales } from "expo-localization";
import type { SQLiteDatabase } from "expo-sqlite";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExtrasDaReacao } from "../components/slime/reacao-do-registro";
import type { Reacao } from "../components/slime/reacoes";
import { textos, type Textos } from "../i18n";
import { aparenciaDosValores, CHAVES_APARENCIA, type Aparencia } from "./aparencia";
import { abrirBanco, apagarBancoDoAparelho, ErroBanco, type FalhaBanco } from "./db";
import { limparExportacoes } from "./exportacoes";
import { gravarPreferencia, lerPreferencia, listarPessoas } from "./repositorio";

const PREF_PESSOA_ATIVA = "pessoa_ativa";
const PREF_IDIOMA = "idioma";
const DURACAO_DESFAZER_MS = 5000;

export type PreferenciaIdioma = Idioma | "auto";

interface Desfazer {
  texto: string;
  acao: () => Promise<void>;
}

interface EstadoApp {
  db: SQLiteDatabase;
  pessoas: Pessoa[];
  pessoaAtiva: Pessoa | null;
  /** Muda a cada alteração de dados, para as telas recarregarem. */
  versaoDados: number;
  notificarMudanca: () => void;
  recarregarPessoas: () => Promise<void>;
  escolherPessoa: (id: string) => Promise<void>;
  desfazer: Desfazer | null;
  oferecerDesfazer: (texto: string, acao: () => Promise<void>) => void;
  executarDesfazer: () => Promise<void>;
  /** Aviso de gravação que falhou, mostrado por alguns segundos. */
  falhaAoSalvar: boolean;
  /** Executa uma gravação disparada por um toque; se falhar, mostra o aviso em vez de falhar calada. */
  tentar: (acao: () => Promise<unknown>) => void;
  apagarTudo: () => Promise<void>;
  preferenciaIdioma: PreferenciaIdioma;
  definirIdioma: (p: PreferenciaIdioma) => Promise<void>;
  aparencia: Aparencia;
  definirAparencia: (parcial: Partial<Aparencia>) => Promise<void>;
  /** Última reação pedida ao mascote; `disparo` muda a cada pedido. */
  reacaoSlime: ReacaoSlime;
  reagir: (reacao: Reacao | null, extras?: ExtrasDaReacao) => void;
}

/** Última reação pedida ao mascote, com o tom de suspeita e a região da dor. */
export type ReacaoSlime = { reacao: Reacao | null; disparo: number } & ExtrasDaReacao;

export type Situacao =
  | { tipo: "carregando" }
  | { tipo: "erro"; falha: FalhaBanco; causa?: string }
  | { tipo: "pronto"; estado: EstadoApp };

type Abertura =
  | { tipo: "carregando" }
  | { tipo: "erro"; falha: FalhaBanco; causa?: string }
  | {
      tipo: "pronto";
      db: SQLiteDatabase;
      pessoas: Pessoa[];
      ativaId: string | null;
      idioma: PreferenciaIdioma;
      aparencia: Aparencia;
    };

const Contexto = createContext<EstadoApp | null>(null);
const ContextoTextos = createContext<Textos>(textos("pt-BR"));

export function useApp(): EstadoApp {
  const c = useContext(Contexto);
  if (!c) throw new Error("useApp fora do ProvedorApp");
  return c;
}

/** Textos no idioma escolhido (ou no do aparelho). Disponível também nas telas de carga e erro. */
export function useTextos(): Textos {
  return useContext(ContextoTextos);
}

async function abrir(): Promise<Abertura> {
  // PDFs e backups compartilhados numa sessão anterior: o destino já teve tempo de ler.
  limparExportacoes();
  try {
    const db = await abrirBanco();
    const pessoas = await listarPessoas(db);
    const preferida = await lerPreferencia(db, PREF_PESSOA_ATIVA);
    const idioma = await lerPreferencia(db, PREF_IDIOMA);
    const ativaId = pessoas.some((p) => p.id === preferida) ? preferida : (pessoas[0]?.id ?? null);
    const aparencia = aparenciaDosValores({
      modoVisual: await lerPreferencia(db, CHAVES_APARENCIA.modoVisual),
      movimento: await lerPreferencia(db, CHAVES_APARENCIA.movimento),
      local: await lerPreferencia(db, CHAVES_APARENCIA.local),
      som: await lerPreferencia(db, CHAVES_APARENCIA.som),
      corSlime: await lerPreferencia(db, CHAVES_APARENCIA.corSlime),
      comemorativas: await lerPreferencia(db, CHAVES_APARENCIA.comemorativas),
    });
    return { tipo: "pronto", db, pessoas, ativaId, idioma: ehIdioma(idioma) ? idioma : "auto", aparencia };
  } catch (e) {
    return e instanceof ErroBanco ? { tipo: "erro", falha: e.tipo, causa: e.causa } : { tipo: "erro", falha: "nao_abriu" };
  }
}

export function ProvedorApp({ children }: { children: (s: Situacao, recomecar: () => Promise<void>) => ReactNode }) {
  const [abertura, setAbertura] = useState<Abertura>({ tipo: "carregando" });
  const [tentativa, setTentativa] = useState(0);
  const [versaoDados, setVersao] = useState(0);
  const [desfazer, setDesfazer] = useState<Desfazer | null>(null);
  const [falhaAoSalvar, setFalhaAoSalvar] = useState(false);
  const [reacaoSlime, setReacaoSlime] = useState<ReacaoSlime>({ reacao: null, disparo: 0, suspeita: false });
  const [idiomaAparelho] = useState<Idioma>(() => resolverIdioma(getLocales().map((l) => l.languageTag)));

  useEffect(() => {
    let ativo = true;
    void abrir().then((a) => {
      if (ativo) setAbertura(a);
    });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  // O aviso de desfazer some sozinho depois de alguns segundos.
  useEffect(() => {
    if (!desfazer) return;
    const t = setTimeout(() => setDesfazer(null), DURACAO_DESFAZER_MS);
    return () => clearTimeout(t);
  }, [desfazer]);

  useEffect(() => {
    if (!falhaAoSalvar) return;
    const t = setTimeout(() => setFalhaAoSalvar(false), DURACAO_DESFAZER_MS);
    return () => clearTimeout(t);
  }, [falhaAoSalvar]);

  const tentar = useCallback((acao: () => Promise<unknown>) => {
    void acao().catch(() => {
      setDesfazer(null);
      setFalhaAoSalvar(true);
    });
  }, []);

  const db = abertura.tipo === "pronto" ? abertura.db : null;

  const recomecar = useCallback(async () => {
    limparExportacoes();
    await apagarBancoDoAparelho(db ?? undefined);
    setDesfazer(null);
    setAbertura({ tipo: "carregando" });
    setTentativa((t) => t + 1);
  }, [db]);

  const estado = useMemo<EstadoApp | null>(() => {
    if (abertura.tipo !== "pronto") return null;
    const { db: banco, pessoas, ativaId } = abertura;
    return {
      db: banco,
      pessoas,
      pessoaAtiva: pessoas.find((p) => p.id === ativaId) ?? null,
      versaoDados,
      notificarMudanca: () => setVersao((v) => v + 1),
      recarregarPessoas: async () => {
        const lista = await listarPessoas(banco);
        setAbertura((a) =>
          a.tipo === "pronto"
            ? { ...a, pessoas: lista, ativaId: lista.some((p) => p.id === a.ativaId) ? a.ativaId : (lista[0]?.id ?? null) }
            : a,
        );
      },
      escolherPessoa: async (id) => {
        await gravarPreferencia(banco, PREF_PESSOA_ATIVA, id);
        setAbertura((a) => (a.tipo === "pronto" ? { ...a, ativaId: id } : a));
      },
      desfazer,
      oferecerDesfazer: (texto, acao) => {
        setFalhaAoSalvar(false);
        setDesfazer({ texto, acao });
      },
      executarDesfazer: async () => {
        if (!desfazer) return;
        setDesfazer(null);
        await desfazer.acao();
        setVersao((v) => v + 1);
      },
      falhaAoSalvar,
      tentar,
      apagarTudo: recomecar,
      preferenciaIdioma: abertura.idioma,
      definirIdioma: async (p) => {
        await gravarPreferencia(banco, PREF_IDIOMA, p);
        setAbertura((a) => (a.tipo === "pronto" ? { ...a, idioma: p } : a));
      },
      aparencia: abertura.aparencia,
      definirAparencia: async (parcial) => {
        for (const [chave, valor] of Object.entries(parcial) as [keyof Aparencia, string][]) {
          await gravarPreferencia(banco, CHAVES_APARENCIA[chave], valor);
        }
        setAbertura((a) => (a.tipo === "pronto" ? { ...a, aparencia: { ...a.aparencia, ...parcial } } : a));
      },
      reacaoSlime,
      reagir: (reacao, extras) => setReacaoSlime((r) => ({ reacao, disparo: r.disparo + 1, suspeita: false, ...extras })),
    };
  }, [abertura, versaoDados, desfazer, falhaAoSalvar, tentar, recomecar, reacaoSlime]);

  const idioma = abertura.tipo === "pronto" && abertura.idioma !== "auto" ? abertura.idioma : idiomaAparelho;
  const valorTextos = useMemo(() => textos(idioma), [idioma]);

  const situacao: Situacao =
    abertura.tipo === "erro"
      ? { tipo: "erro", falha: abertura.falha, causa: abertura.causa }
      : estado
        ? { tipo: "pronto", estado }
        : { tipo: "carregando" };

  return (
    <ContextoTextos.Provider value={valorTextos}>
      <Contexto.Provider value={estado}>{children(situacao, recomecar)}</Contexto.Provider>
    </ContextoTextos.Provider>
  );
}
