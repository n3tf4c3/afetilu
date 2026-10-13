# Elo Azul — experiência com o mascote slime

Proposta de 13/10/2026, ainda em discussão. Nada foi implementado ou contratado, e nenhuma foto real foi usada.

Este documento complementa `viabilidade-e-escopo.md`. Quando os dois divergirem quanto às categorias de registro e às etapas, vale este documento. As decisões já tomadas continuam valendo:
- dados só no aparelho;
- backup cifrado salvo onde o responsável escolher;
- nenhuma cobrança antes da aprovação nas lojas.

---

## 0. Decisão de conceito (13/10/2026)

O centro da tela passa a ser um **mascote slime original**, translúcido e acolhedor, que reage aos registros com expressões, cores passageiras e sons opcionais. **O avatar da criança e o uso de foto saem do escopo.**

Motivos:
- **Arte gratuita:** o slime pode ser desenhado e animado inteiramente em código.
- **Privacidade:** sem imagem nem semelhança com a criança, deixa de haver tratamento de imagem ou dado biométrico.
- **Leitura clínica:** um mascote que reage a um registro não é confundido com o estado da criança.

### Por que não um avatar 3D gerado por foto (registro da avaliação)

- Serviços de imagem para 3D (Meshy, Tripo, Rodin, Hunyuan3D) levam ~10 s a ~4 min por modelo ([comparativo 2026](https://www.3daistudio.com/blog/best-3d-model-generation-apis-2026), fontes não neutras). Entregam malhas estáticas, sem expressões, com semelhança instável em rostos ([guia 2026](https://app.cinevva.com/guides/ai-3d-model-generators)). Para animar, exigem rig automático e limpeza manual ([teste 2026](https://www.strayspark.studio/blog/ai-auto-rigging-showdown-2026-tripo-meshy-cascadeur-mixamo)), e todos dependem de enviar a foto a um servidor.
- Rodar no aparelho (ports de TripoSR/SF3D) significa ~1,6 GB de modelo, nenhuma medição em celulares e uma malha bruta sem rig ([port TripoSR](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/can-mobile-phones-generate-a-3d-object-at-game-runtime-in-unity-here-is-what-actually-happens); [SF3D-iOS](https://huggingface.co/jc-builds/sf3d-ios), com licença comercial limitada).
- O Ready Player Me, de avatar por selfie, [encerrou os serviços em 31/01/2026](https://genies.com/blog/ready-player-me-shutdown).

---

## 1. Lojas: o que muda com o mascote

A apresentação lúdica não muda a natureza dos dados: continuam sendo registros de saúde e comportamento, frequentemente de criança. Vale o enquadramento de `viabilidade-e-escopo.md` (seção 1). Fontes acessadas em 13/10/2026.

| Tema | Regra | Consequência |
|---|---|---|
| Propriedade intelectual | Google Play: política de Propriedade Intelectual; Apple: [Guideline 5.2.1](https://developer.apple.com/app-store/review/guidelines/) | O slime deve ser **original**. Não pode copiar personagem de anime ou jogo (por exemplo, Rimuru, de *Tensei shitara Slime Datta Ken*, ou o slime de *Dragon Quest*) no desenho, no rosto, no nome, nos sons ou na ficha (seção 3). |
| Aparência infantil na ficha | [Target audience and content](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en): personagens e animação com cara infantil na ficha podem levar a Google a tratar o app como infantil ([Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)). Apple: [2.3.8](https://developer.apple.com/app-store/review/guidelines/) | Mascote fofo ainda é um risco, menor que um avatar de criança. Ícone e capturas devem priorizar o registro e o relatório, com o slime discreto. Público declarado: adultos. |
| Saúde e conta de organização | [Play Console Requirements](https://support.google.com/googleplay/android-developer/answer/10788890?hl=en); [Apple 5.1.1(ix)](https://developer.apple.com/app-store/review/guidelines/) | Sem mudança. A estratégia decidida continua: revisão cedo pelas faixas de teste. |
| Fotos | [Photo and Video Permissions](https://support.google.com/googleplay/android-developer/answer/14115180) | Não se aplica: o app não usa fotos. |
| Declarações de privacidade | Data safety / App Privacy | Inalterado: tende a "nenhum dado coletado", a conferir no preenchimento. |

---

## 2. Tecnologia

**Decisão (13/10/2026):** o slime será **3D real e translúcido**. O rascunho 2D aprovado (`docs/slime/rascunho-expressoes-v0.svg`) define formato, rosto, cores e expressões.

| Item | Escolha | Motivo |
|---|---|---|
| Renderização 3D | **[react-native-filament](https://unpkg.com/react-native-filament@1.11.0/README.md)** (motor Filament, da Google: Metal no iOS, Vulkan/OpenGL no Android) | Gratuito e de código aberto. O material translúcido usa a transmissão do glTF (`KHR_materials_transmission`, `volume`, `ior`), de modo que o alimento aparece **dentro** do corpo naturalmente. Os clipes de animação do glTF (achatar, quicar, respirar) rodam no motor nativo. Exige build de desenvolvimento, o que o SQLCipher já exigia. |
| Modelo do slime | **GLB gerado por script no Blender 4.5 LTS** (`ferramentas/slime/gerar_slime.py`), sem add-ons; saída em `apps/mobile/assets/slime/slime.glb` e prévias em `docs/slime/previas-3d/` | Sem arte paga e reproduzível. Cúpula com *morph targets* (achatar, esticar, amassar, respirar). Olhos, bochechas e bocas são nós separados, mostrados ou escondidos por escala. Um clipe por reação, cada um com o estado visual completo. A cor muda pelo material em tempo de execução. Contrato detalhado em `ferramentas/slime/README.md`. |
| Plano B | **`@shopify/react-native-skia` + `react-native-reanimated`**, com sombreamento "de vidro" que imita 3D (2,5D) | Se a prova técnica mostrar desempenho, aquecimento ou qualidade de translucidez ruins em Android de entrada, ou se a troca de cor e expressão não funcionar pelo Filament. |
| Recusado | `@react-three/fiber` / expo-gl | O [pacote nativo](https://github.com/pmndrs/native) se declara instável, e o expo-gl usa OpenGL ES, depreciado no iOS. |
| Sons | **`expo-audio`** | Gratuito; respeita o modo silencioso do sistema. |
| Origem dos sons | Pacotes **CC0** (por exemplo, [Kenney](https://kenney.nl/assets/category:Audio)) ou sons próprios criados em geradores gratuitos (jsfxr, ChipTone) | Uso comercial sem atribuição obrigatória. **Nada recortado de anime, jogo ou vídeo.** A licença de cada arquivo fica registrada em `assets/sons/LICENCAS.md`. |
| Ícones | Conjunto gratuito de licença livre (Phosphor, MIT, ou Lucide, ISC) | Sem custo, e as licenças permitem uso comercial. |

### 2.1 Prova técnica do slime 3D (antes de integrar ao app)

Uma tela isolada, com o slime fictício em GLB, testa:
1. translucidez com o alimento visível dentro;
2. troca de cor passageira e volta ao azul;
3. troca de expressão (neutro, enjoo, sono);
4. achatar e quicar;
5. modo de movimento reduzido.

Medições num **Android de entrada** e num iPhone:
- quadros por segundo (meta: 60, aceitável: 30 estável);
- memória;
- aumento do tamanho do app;
- tempo até o slime aparecer;
- aquecimento em 5 minutos;
- consumo com o app parado na tela inicial.

O slime para de renderizar quando não está animando, para poupar bateria. Se a prova falhar, o app segue com o plano B (2,5D), sem mudar o restante do produto.

---

## 3. O personagem

### 3.1 Diretrizes de originalidade

Em comparação com slimes conhecidos:
- **Silhueta (decisão de 13/10/2026):** cúpula baixa e larga, de base achatada e translúcida. É o formato genérico de slime, como uma gota de gelatina pousada, escolhido pelo usuário. O formato sozinho não identifica um personagem, mas aproxima o visual do Rimuru. Por isso, **rosto, cor, nome e sons precisam ser claramente próprios**, e o desenho final deve ser comparado lado a lado com o personagem antes de ir para as lojas.
- **Rosto:** olhos em ponto oval, escuros, com brilho branco, e bochechas rosadas suaves. Não usa os olhos de linha fechada nem o rosto característico do Rimuru.
- **Cor:** azul-sereno próprio (`#79AEE0`, com luz `#D3E8FA` e sombra `#4C82BE`). Os tons podem ser ajustados no rascunho.
- **Nome:** próprio, a definir. Nenhuma referência a anime ou jogo no app, na ficha ou nos materiais.
- **Rascunho:** `docs/slime/rascunho-expressoes-v0.svg`. É uma versão 0 para discussão, não a arte final.

### 3.2 Reações (cores, expressões e sons)

Regras gerais:
- **Duração:** a reação dura no máximo 3 s, pode ser interrompida com um toque e volta ao azul neutro.
- **Sem acúmulo:** só a última reação é mostrada; reações nunca se misturam nem entram em fila.
- **Cor passageira:** a cor nunca fica no slime depois da reação, para que ele não vire indicador do estado do dia.
- **Cor nunca sozinha:** sempre vem com expressão, ícone e legenda textual que descreve o registro e o horário do evento, como "Enjoo registrado · 14:20".
- **Alimentos não mudam a cor,** para não sugerir relação entre alimento e sintoma.

| Registro | Cor | Expressão e movimento | Som (se ativado) |
|---|---|---|---|
| Neutro (repouso) | azul-sereno | respiração lenta, piscar raro | — |
| Alimentação | não muda | o ícone do alimento flutua dentro do slime e se dissolve; bochechas | "nham" curto |
| Bebida | não muda | bolhinhas sobem por dentro | borbulho suave |
| Enjoo | verde-claro suave | boca ondulada, olhar cansado, "braço" na barriga | nenhum |
| Dor ou desconforto | pêssego suave | sobrancelhas preocupadas, sem choro; balão com a região registrada | nenhum |
| Sono e descanso | não muda | achata como uma poça, olhos fechados, "z z" | ronco muito suave |
| Banho e higiene | brilho extra | bolhas ao redor, olhos fechados contentes | bolhas |
| Calma e momentos positivos | azul mais luminoso | sorriso aberto, quique leve | "blop" alegre |
| Conquista | azul mais luminoso | pulinho, sem pontos nem medalhas | "tum-tum" alegre |
| Emoções e comportamentos difíceis, episódios | **não muda** | **permanece neutro**; aparece só o card "Registro salvo" | **nenhum** |
| Evacuação | não muda | sem reação; só a confirmação textual | nenhum |
| Suspeita do responsável | igual ao tipo, em tom mais claro | igual | igual |

Na suspeita, a legenda diz, por exemplo, "Suspeita de enjoo registrada".

**Registros retroativos:**
- Rotina (sono, banho, alimentação): a reação aparece, com a legenda "registrado para ontem, 22:10".
- Enjoo, dor ou desconforto com evento há mais de 60 min: **sem reação do slime**, só a confirmação textual.
- Episódios: nunca animam o slime.

**Sem gamificação:** nenhum ponto, sequência de "dias sem crise", recompensa por comer ou obedecer, nem mensagem de cobrança.

---

## 4. Tela principal e registro rápido

### 4.1 Layout

```
┌──────────────────────────────────┐
│ [Lia ▾]          Hoje, 13 out    │  ← pessoa acompanhada e data
│                                  │
│        ambiente tranquilo        │
│            (slime)               │  ← ~45% da altura
│   "Sono registrado · 13:10" ✓    │  ← legenda da última ação
│                                  │
│  [Alimentação     [Dor e         │
│   e bebidas]       desconforto]  │
│  [Emoções e       [Banho e       │  ← ícones com rótulo, 2 colunas,
│   comportamentos]  higiene]      │    alvos ≥ 48 dp
│  [Sono e          [Evacuação]    │
│   descanso]                      │
│  [Atividades e    [Dia sem       │
│   conquistas]      crises]       │
│                                  │
│ Início · Linha do tempo · Resumo · Ajustes │
└──────────────────────────────────┘
```

- Os ícones ficam abaixo do slime, para uso com uma mão. Em tablets, podem formar um arco ao redor dele.
- O resumo textual de "Hoje" fica acessível por um toque. **O slime nunca representa o estado atual da criança.**

### 4.2 Registro rápido (folha inferior)

O registro abre imediatamente, sem esperar animação.

1. **Quando?** "Agora" vem pré-selecionado. Há atalhos (−15 min, −1 h) e um seletor completo (data, hora e precisão).
2. **Campos essenciais da categoria.** Os detalhes opcionais ficam recolhidos (tabela abaixo).
3. **Origem**, sempre visível: "Vi acontecer" (padrão), "Me contaram" ou "Suspeita minha".
4. **Observação**, opcional.
5. **Salvar.** "Desfazer" fica disponível por 5 s, para corrigir toques acidentais, inclusive de uma criança.

| Ícone | Campos essenciais | Detalhes opcionais |
|---|---|---|
| Alimentação e bebidas | comida ou bebida; o quê (sugestões dos já usados) | quantidade aproximada; aceitação; "como ficou depois" |
| Dor e desconforto | tipo percebido (dor, enjoo, coceira, tontura percebida, outro) e região (lista acessível) | sinais observados; intensidade percebida, com critérios; duração e término |
| Emoções e comportamentos | o que foi observado (calmo, choro, irritação, agitação, isolamento, agressividade, autoagressão, outro) | se for episódio: duração, intensidade com critérios, contexto anterior, o que o cuidador fez, desfecho, lesão (sim, não, não sei), o que ajudou |
| Banho e higiene | banho, escovação, troca, outro | aceitação; observação |
| Sono e descanso | dormiu ou acordou (ou o intervalo); cochilo ou noturno | despertares; observação |
| Evacuação | ocorreu | aspecto (texto livre); observação |
| Atividades e conquistas | comunicação, atividade, conquista, período tranquilo, estratégia que funcionou | descrição |

**Contexto calculado, nunca causal:** ao registrar enjoo, dor ou desconforto, o app pode mostrar "Última refeição registrada: 12:30 (40 min antes)". A legenda fica "Enjoo registrado após a refeição", indicando só a ordem no tempo. O app não sugere causa nem cria sintomas.

**Duração e término:** episódios e desconfortos podem ficar "em aberto". Um card em "Hoje" (sem notificação) pede o término depois. O slime voltar ao neutro não encerra nada.

---

## 5. Acolhimento, acessibilidade e sons

- **Movimento:** segue o "reduzir movimento" do sistema ou o ajuste do app (Completo, Reduzido ou Sem animação).
  - No modo reduzido, a expressão e a cor trocam suavemente, sem deslocamento.
  - Nada pisca e não há movimentos rápidos.
- **Sons:**
  - **Desligados até a pessoa escolher.** Na primeira abertura, o app pergunta "Quer ativar sons suaves?". A escolha muda depois em Ajustes, separada do controle de movimento.
  - Respeitam o modo silencioso, duram menos de 1 s, tocam em volume baixo e nunca ao abrir o app.
  - Não há som em episódios difíceis, enjoo, dor ou evacuação.
  - Motivo da cautela: muitas pessoas autistas têm sensibilidade sonora, e o registro pode ser feito com a criança por perto.
- **Modo simples:** grade de ícones e lista de "Hoje", sem slime. É uma tela completa, e **todo o app funciona nela**.
- **Leitores de tela:** o slime é decorativo; a reação é anunciada pela legenda. Ícones e campos têm rótulo.
- **Texto e contraste:** WCAG AA, tamanho dinâmico, nenhuma informação transmitida só pela cor. As cores de enjoo e desconforto sempre vêm com legenda, por causa do daltonismo.
- **Tom:** neutro e descritivo ("Registro salvo"). Sem "parabéns" por ausência de crise e sem frases de culpa.

---

## 6. Privacidade

- **Sem foto e sem imagem da criança** em qualquer etapa planejada.
- **Preferências** de movimento, som e modo visual ficam no banco cifrado do aparelho.
- O slime **não aparece** no relatório PDF.
- Desenvolvimento, testes, demonstrações e capturas das lojas usam só dados fictícios.
- Nenhum dado é usado para treinar modelos, para publicidade ou para análise de marketing.

---

## 7. Histórico e relatório

Mantêm-se as regras de `viabilidade-e-escopo.md` (seções 3.2 e 8):
- horário do evento separado do horário do lançamento;
- origem da informação (vi, me contaram, suspeita);
- dias marcados explicitamente sem crises e cobertura no relatório;
- correções com histórico;
- exportação escolhida pelo responsável.

O relatório também mostra:
- frequência e duração dos episódios, com o critério de intensidade;
- **eventos registrados próximos** (refeição, sono, desconforto), em linha do tempo com a distância em minutos e o aviso de que proximidade não indica causa;
- desconfortos por tipo e região;
- estratégias que ajudaram, em contagem literal.

Gráficos permitidos:
- contagem por dia, com os dias sem registro marcados como "sem informação";
- duração do sono por noite registrada.

Sem gráfico de correlação.

### 7.1 Ajustes no modelo de dados

- `registro.categoria`: `alimentacao | dor_desconforto | comportamento | higiene | sono | evacuacao | positivo`.
  - `bem_estar` se divide em `dor_desconforto` e `evacuacao`.
  - `episodio` vira `comportamento` com `eh_episodio = true`.
- `detalhe_dor(registro_id, tipo_percebido, regiao?, intensidade_percebida?, sinais?)`.
  - `tipo_percebido`: `dor | enjoo | coceira | tontura | outro`.
  - `regiao`: cabeça, boca/dentes, ouvido, garganta, peito, barriga, costas, braços, pernas, pele, outra, não sei.
- `detalhe_comportamento(registro_id, observado[], eh_episodio, …detalhes de episódio)`.
- `detalhe_higiene(registro_id, tipo, aceitacao?)`.
- `registro.em_aberto` e `registro.encerrado_em?`.
- `preferencias(movimento, som, modo_visual)`, sendo `som` desligado até a escolha do responsável.
- A tabela `avatar` e a foto de referência saem do modelo.

---

## 8. Essencial do MVP × futuro

| MVP | Futuro |
|---|---|
| Slime original com as reações da seção 3.2 | Ambientes alternativos e acessórios do slime |
| Sons opcionais (CC0 ou próprios), desligados até a escolha | Mais variações de som |
| 7 ícones e "Dia sem crises", registro rápido e desfazer | Voz, anexos, múltiplos cuidadores, assinatura |
| Modo simples sem slime; movimento reduzido | — |
| Linha do tempo, correções e eventos em aberto | — |
| Relatório PDF descritivo, backup cifrado e exclusão | — |

## 9. Etapas

1. **Aprovação do desenho do slime** pelo rascunho SVG v0 → verificar: escolhas de silhueta, rosto e cores registradas.
2. **Núcleo sem slime:** `packages/core` + `apps/mobile` com as 7 categorias, registro rápido, linha do tempo, dia sem crises, correções e modo simples → verificar: registro mínimo em até 3 toques; testes de domínio ("sem registro" ≠ "sem crises"; retroativo; em aberto).
3. **Prova técnica e slime no app:** prova técnica 3D (seção 2.1) e depois integração das reações e dos sons → verificar no Android de entrada e no iPhone:
   - medições da seção 2.1 registradas e decisão 3D ou plano B tomada;
   - com movimento reduzido, nada se desloca;
   - episódio nunca anima nem toca som;
   - o leitor de tela anuncia as legendas;
   - sons desligados até a escolha.
4. **Primeira build de teste nas lojas** com dados fictícios, ficha sem apelo infantil e declarações fiéis → verificar: resultado das revisões registrado antes de qualquer usuário real.
5. **Relatório PDF, backup cifrado, importação e exclusão** → verificar conforme `viabilidade-e-escopo.md`, etapa 6.

## 10. Riscos específicos

| Risco | Mitigação |
|---|---|
| Semelhança com personagem protegido | Diretrizes da seção 3.1; revisão do desenho antes da arte final; nada de nome, som ou referência a anime |
| Mascote fofo levar a Google a aplicar a Families Policy | Ficha centrada em registro e relatório; slime discreto; público adulto declarado |
| Cor ou careta lida como estado clínico ou como algo acontecendo agora | Cor passageira; legenda com o horário do evento; regras de retroativo; episódios neutros |
| Som incomodar a criança ou o ambiente | Desligado até a escolha; modo silencioso respeitado; sons curtos e baixos |
| Criança mexer no app | Desfazer por 5 s; bloqueio opcional; episódios sem representação visual |
| Desempenho, aquecimento ou bateria do 3D em Android de entrada | Prova técnica (seção 2.1); slime para de renderizar quando parado; plano B 2,5D; modo simples sempre disponível |
| Biblioteca 3D com comunidade pequena | Isolar o slime num componente com interface própria, para trocar a implementação (Filament ↔ Skia) sem afetar o app |
