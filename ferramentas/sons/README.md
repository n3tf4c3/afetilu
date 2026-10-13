# Sons do slime — geração por síntese

Sons curtos das reações do slime (`docs/experiencia-avatar.md`, seções 3.2 e 5). São sintetizados por script, sem gravações nem bancos de terceiros: são próprios e não há licença a declarar.

- Ferramenta: Node puro (sem dependências).
- Saída: `apps/mobile/assets/sons/<som>.wav`, mono, 22 050 Hz, 16 bits, pico ~ -12 dBFS, menos de 1 s (14–40 KB).
- O mesmo comando gera arquivos idênticos (sorteios com semente fixa).

```sh
node ferramentas/sons/gerar_sons.mjs apps/mobile/assets/sons
```

| Som | Reação | Descrição |
|---|---|---|
| `nham` | alimentação | tom grave e arredondado, curto |
| `ronco` | sono | sopro grave que sobe e desce devagar |
| `bolhas` | banho | estalinhos agudos e curtos |
| `blop` | calma e momentos positivos | bolha que sobe, com eco menor |

O mapa reação → som fica em `apps/mobile/src/components/slime/reacoes.ts` (`SOM_DA_REACAO`); o teste `reacoes.test.ts` confere que todo som usado existe, dura menos de 1 s e que episódio, enjoo e dor não têm som.
