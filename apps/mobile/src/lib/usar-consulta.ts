import { useCallback, useEffect, useRef, useState } from "react";

export interface Consulta<T> {
  /** `null` enquanto carrega ou depois de uma falha. */
  dados: T | null;
  falhou: boolean;
  tentarDeNovo: () => void;
}

/**
 * Leitura do banco com estado de falha. `chave` identifica o que é lido (pessoa, período); `null`
 * não carrega nada. Resultado de outra chave nunca é devolvido: com filtro novo, a tela mostra
 * carregando, não os dados do filtro anterior. `versao` relê a mesma chave mantendo o resultado
 * atual até o novo chegar. Uma falha aparece como falha, não como "sem informação".
 */
export function useConsulta<T>(chave: string | null, carregar: () => Promise<T>, versao = 0): Consulta<T> {
  const [estado, setEstado] = useState<{ chave: string; dados: T | null; falhou: boolean } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const carregarAtual = useRef(carregar);
  useEffect(() => {
    carregarAtual.current = carregar;
  });

  useEffect(() => {
    if (chave === null) return;
    let ativo = true;
    carregarAtual.current().then(
      (dados) => {
        if (ativo) setEstado({ chave, dados, falhou: false });
      },
      () => {
        if (ativo) setEstado({ chave, dados: null, falhou: true });
      },
    );
    return () => {
      ativo = false;
    };
  }, [chave, versao, tentativa]);

  const tentarDeNovo = useCallback(() => {
    setEstado(null);
    setTentativa((n) => n + 1);
  }, []);
  const atual = estado && estado.chave === chave ? estado : null;
  return { dados: atual?.dados ?? null, falhou: atual?.falhou ?? false, tentarDeNovo };
}
