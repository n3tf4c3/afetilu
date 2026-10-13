# Elo Azul — viabilidade nas lojas e proposta de MVP

Proposta de 13/10/2026, ainda em discussão. Nada foi implementado ou publicado nas lojas. A implementação depende da aprovação do escopo e da estratégia de distribuição.

---

## 1. Viabilidade nas lojas

### 1.1 Fontes consultadas (acesso em 13/10/2026)

As páginas da Google e da Apple não exibem data de última atualização; a data abaixo é a do acesso.

| # | Fonte | O que diz de relevante |
|---|---|---|
| G1 | [Play Console Requirements](https://support.google.com/googleplay/android-developer/answer/10788890?hl=en) | Ao criar a conta, desenvolvedores que fornecem *"Health apps, such as Medical apps and Human Subjects Research apps"* **devem se registrar como Organização**. Organização exige D-U-N-S. |
| G2 | [Health apps declaration form](https://support.google.com/googleplay/android-developer/answer/14738291?hl=en) | Declaração obrigatória para todos os apps desde 31/08/2024. Divide categorias em **Health and fitness** (Atividade, Nutrição/peso, Menstruação, Sono, Estresse/relaxamento) e **Medical** (Doenças e condições, Suporte à decisão clínica, **Saúde mental e comportamental**, Gestão de medicamentos/tratamento, Serviços de saúde, que inclui coordenação de cuidado, entre outras). |
| G3 | [Health app categories](https://support.google.com/googleplay/android-developer/answer/13996367?hl=en) | Medical apps incluem *disease management*, monitoramento remoto e prontuários; Health and fitness inclui rastreadores de nutrição e sono. |
| G4 | [Health Content and Services](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en) | Política geral; exige a declaração; o texto não diferencia tipo de conta. |
| G5 | [Families Policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) | Aplica-se quando crianças estão no público-alvo; a Google pode reavaliar o público declarado com base em imagens e termos. |
| G6 | [Testes para contas pessoais novas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en) | Contas pessoais criadas após 13/11/2023 precisam de teste fechado com pelo menos 12 testadores por 14 dias contínuos antes da produção. |
| G7 | [Android developer verification](https://developer.android.com/developer-verification/guides) | Em vigor no Brasil desde 30/09/2026 para apps instalados fora da Play em aparelhos certificados. Pessoa física pode se verificar com documento e comprovante de endereço. A distribuição limitada, sem verificação, vai até 20 aparelhos. |
| A1 | [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 5.1.1(ix) | *"Apps that provide services in highly regulated fields (such as … healthcare …) **or that require sensitive user information** should be submitted by a legal entity that provides the services, and not by an individual developer."* |
| A2 | Mesmas diretrizes — 5.1.3, 1.4.1, 5.1.4, 2.3.8, 5.1.2(i) | 5.1.3(ii): não guardar informação pessoal de saúde no iCloud. 1.4.1: apps médicos recebem escrutínio maior e devem lembrar o usuário de consultar o médico. 5.1.4: dados de menores exigem política de privacidade e conformidade com leis de privacidade infantil. 2.3.8: fora da categoria Kids, o metadado não pode sugerir que o público principal são crianças. 5.1.2(i): compartilhamento com IA de terceiros exige divulgação e permissão explícita. |
| A3 | [Apple Developer Program — Enrollment](https://developer.apple.com/programs/enroll/) | Pessoa física e empresário individual entram como *individual*. Organização precisa ser entidade legal com D-U-N-S, site e e-mail do domínio; nome fantasia não é aceito. |
| A4 | [Notícia Apple de 01/02/2021](https://developer.apple.com/news/?id=3ozbk628) | Data em que a 5.1.1(ix) ganhou a redação atual sobre áreas reguladas. |
| L1 | [Lei 15.211/2025 (ECA Digital) — vigência em 17/03/2026](https://www.gov.br/mj/pt-br/assuntos/noticias/sancionado-projeto-que-fortalece-a-anpd-e-fixa-inicio-da-vigencia-do-eca-digital); [análise da Data Privacy Brasil](https://www.dataprivacybr.org/eca-digital-entra-em-vigor-o-que-a-lei-preve-e-o-que-ainda-falta-regulamentar/) | Deveres para produtos de TI direcionados a crianças e adolescentes ou de acesso provável por eles, com fiscalização da ANPD. O texto oficial precisa ser lido antes de qualquer conclusão. |

### 1.2 Enquadramento do Elo Azul

O Elo Azul deve ser declarado conforme o que realmente faz:

- registra alimentação e sono → **Health and fitness** (Nutrição; Sono);
- registra episódios de agitação, agressividade e autoagressão, além de comportamento e comunicação de uma pessoa autista → muito provavelmente **Medical › Mental and Behavioral Health**, com possível leitura como *Diseases and Conditions Management* ou como coordenação de cuidado em *Healthcare Services and Management*;
- organiza informações para consultas, o que reforça o uso no cuidado em saúde;
- trata dados sensíveis, frequentemente de crianças.

Na Google, uma declaração fiel deve incluir ao menos uma categoria do grupo **Medical**. Pelo G1, isso tende a exigir **conta de organização**. Chamar o app de diário, incluir avisos ou evitar a palavra "saúde" não muda o que ele faz. Para não marcar Medical, seria preciso retirar o registro de episódios, e isso descaracteriza o produto.

Na Apple, a 5.1.1(ix) cita *healthcare* e também apps que *"require sensitive user information"*. A aplicação é caso a caso: existem apps individuais de humor e sintomas publicados e também rejeições documentadas por esse item.

### 1.3 Avaliação por loja

| | Google Play (conta pessoal) | App Store (conta individual) |
|---|---|---|
| Exigência formal | Organização para "Medical apps" (G1) | "Should be submitted by a legal entity" para saúde ou dados sensíveis (A1) |
| Como é aplicada | Pela declaração de saúde e pela revisão | No App Review, conforme o enquadramento do revisor |
| Risco estimado | **Alto** de exigir organização | **Médio**: pode ser aprovado ou rejeitado depois, inclusive numa atualização |
| Fator adicional | Teste fechado obrigatório em contas pessoais criadas após 13/11/2023 (G6) | Rejeição depois do lançamento atinge quem já usa o app |
| Atenuante possível | Nenhum sem mudar a funcionalidade | Sem servidor e sem coleta pelo desenvolvedor, com dados só no aparelho, o argumento de *"require sensitive user information"* enfraquece; o de *healthcare*, não |

**Ponto de parada:** a distribuição pela Google Play provavelmente depende de conta de organização, e a da Apple tem risco real. O desenvolvimento voltado às lojas só começa depois da escolha de uma das opções abaixo.

### 1.4 Opções de distribuição

| Opção | Como funciona | Exige pessoa jurídica? | Prós | Contras e riscos |
|---|---|---|---|---|
| **A. Consulta prévia** | Enviar à Google e à Apple a descrição real das funções e perguntar quais categorias e qual tipo de conta se aplicam, antes do código de loja | Não | Custo zero; resposta por escrito | A resposta do suporte não vincula a revisão; a Apple normalmente não faz pré-aprovação |
| **B. PWA (app web instalável)** | Web app offline, instalado pela tela inicial no Android e no iOS, sem loja | Não | Sem revisão de loja nem conta de organização; atualização imediata; hospedagem estática quase sem custo | Sem presença na loja; no iOS a instalação é manual (Compartilhar › Adicionar à Tela de Início); o armazenamento do navegador pode ser apagado, então o backup exportável passa a ser obrigatório; monetização fora das lojas |
| **C. iOS individual + Android fora da Play** | App Store com conta individual, aceitando o risco da 5.1.1(ix); no Android, PWA ou APK de desenvolvedor verificado (G7) | Não | Mantém presença na App Store | O risco Apple continua; APK fora da Play é difícil para famílias sem familiaridade técnica |
| **D. Organização parceira** | Uma associação de familiares, ONG ou clínica publica como desenvolvedora | Não do autor | Atende à exigência formal | A 5.1.1(ix) pede a entidade que *presta o serviço*: ela passa a responder pelo app e possivelmente pelos dados; exige contrato, governança e confiança |
| **E. Pessoa jurídica própria** | Conta de organização com D-U-N-S nas duas lojas | Sim | Caminho previsto nas regras | Fora da premissa atual do projeto; depende de avaliação contábil |

**Recomendação: A, com arquitetura compatível com B.** Fazer a consulta por escrito e manter o núcleo do app (modelo de dados, regras de registro e relatório) independente da loja. Se a exigência de organização se confirmar, a PWA permite distribuir sem esconder funcionalidade, e as lojas podem entrar depois por D ou E sem refazer o domínio.

A PWA não é uma forma de contornar a política das lojas, porque não passa por elas. Também não dispensa as obrigações de privacidade da seção 5.

**Decisão (13/10/2026):** não haverá consulta prévia aos suportes. A estratégia diante de uma eventual exigência de conta de organização será definida quando a exigência acontecer. Para que isso não ocorra com usuários ativos:
- **Revisão cedo, antes de usuários:** a primeira submissão às lojas acontece pelas faixas de teste (teste fechado na Play, TestFlight externo na Apple), com declarações de saúde e privacidade fiéis ao app. A revisão é feita antes de qualquer usuário real.
- **Sem cobrança antes da aprovação:** nenhuma assinatura ou compra entra antes da aprovação em produção nas duas lojas.
- **Rota alternativa preservada:** o núcleo continua portável, mantendo a PWA (opção B) disponível.

### 1.5 Perguntas para os suportes

**Google Play Developer Support:**
1. Um app em que um responsável registra comportamento, episódios de agitação, agressividade e autoagressão, sono e alimentação de uma pessoa autista, sem diagnóstico, cálculo ou recomendação, para mostrar a profissionais, deve marcar *Mental and Behavioral Health* ou outra categoria Medical na declaração?
2. Marcar qualquer categoria Medical exige conta de organização mesmo que os dados fiquem só no aparelho e não haja servidor?
3. O teste fechado de 12 testadores por 14 dias (G6) se aplica a cada app novo da conta?

**Apple** ([Contact Us › App Review](https://developer.apple.com/contact/app-store/)):
1. Um app individual, sem servidor, que guarda somente no aparelho os registros de comportamento e rotina de uma pessoa autista feitos pelo responsável adulto, se enquadra na 5.1.1(ix)?
2. Excluir o banco local do backup do iCloud atende à 5.1.3(ii)?

---

## 2. Público e proposta

- **Usuário:** o adulto responsável. Sem conta da criança, login infantil, comunidade ou compartilhamento automático.
- **Pessoa acompanhada:** apelido obrigatório e demais campos opcionais. Não pede diagnóstico, documentos, CPF, foto ou nome completo.
- **Perguntas que o app ajuda a responder:** o que aconteceu, quando aconteceu, o que houve antes, quanto durou e o que ajudou.
- **Postura:** relato descritivo. Coincidência temporal nunca aparece como causa. Registros positivos têm o mesmo peso visual dos difíceis.
- **Ficha da loja ou página:** dirigida a familiares e cuidadores adultos, sem linguagem ou imagens infantis (G5; A2, 2.3.8).

## 3. Escopo do MVP

**Inclui:**
1. **Perfil simples:** apelido, faixa etária opcional e observações opcionais. Permite mais de uma pessoa no mesmo aparelho, como no caso de irmãos.
2. **Registro rápido:** horário do evento (por padrão "agora", editável) separado do horário de lançamento. Aceita registros retroativos e indica a precisão do horário: exato, aproximado, só o período do dia ou só a data.
3. **Alimentação:** alimento (texto livre, com sugestões dos já usados), quantidade aproximada opcional (pouco, metade, tudo, recusou) e horário.
4. **Sono:** deitou, dormiu, acordou, despertares (horário e duração aproximados), cochilos e observações.
5. **Bem-estar:** dor ou desconforto percebido (local aproximado e sinais observados), evacuação e outros sinais, todos opcionais.
6. **Episódios:** descrição objetiva, início e duração, intensidade com critérios descritos, contexto anterior, o que o cuidador fez, desfecho, se houve lesão (sim, não, não sei) e o que ajudou.
7. **Origem da informação**, em todo registro: **vi acontecer**, **me contaram** (escola, terapeuta, outro cuidador) ou **suspeita minha**.
8. **Registros positivos:** comunicação, atividade, conquista, período tranquilo e estratégia que funcionou.
9. **Dia anotado:** marcar explicitamente "dia sem crises", com observação opcional. A falta de registro aparece como "sem registro", nunca como "nenhum episódio".
10. **Linha do tempo**, com filtros por período, categoria e pessoa.
11. **Correção com histórico:** cada edição guarda a versão anterior e a linha do tempo indica "corrigido em…".
12. **Resumo para consulta:** texto descritivo do período, gerado no aparelho e exportado em PDF pela folha de compartilhamento do sistema, por escolha do responsável.
13. **Dados:** backup cifrado com senha, salvo onde o responsável escolher (seção 5.2), importação e exclusão total (de uma pessoa ou de tudo).

**Fica fora do MVP:** voz, anexos e fotos, múltiplos cuidadores e sincronização, assinatura, lembretes e notificações, gráficos de correlação, qualquer IA, acesso para profissionais e integração com Saúde ou Health Connect.

**Limites clínicos:** o app não oferece diagnóstico, cálculo de dose, sugestão de medicamento, dieta de exclusão, teste de alergia nem conclusão do tipo "alimento → episódio". Informa que não é serviço de emergência, com orientação genérica para procurar o SAMU (192) em caso de risco imediato, e que não acompanha crises em tempo real.

### 3.1 Intensidade dos episódios (rascunho a validar com profissionais)

- **Leve:** sem risco de lesão; terminou sozinho ou com um redirecionamento simples; a atividade pôde continuar.
- **Moderada:** interrompeu a atividade ou a rotina; exigiu intervenção ativa do cuidador; sem lesão.
- **Intensa:** houve risco ou ocorrência de lesão, na pessoa ou em outros, **ou** foi preciso ajuda de outra pessoa ou afastar todos do ambiente.
- **Não sei avaliar.**

O texto de cada critério aparece na tela de escolha e no relatório.

### 3.2 Regras do resumo

- Sempre mostra a cobertura do período: "X de Y dias com algum registro; Z dias marcados sem crises; W dias sem registro (sem informação)".
- Lista os episódios com data, horário e precisão, duração, intensidade com o critério, contexto anterior, medidas e desfecho, nas palavras do responsável.
- "O que ajudou" aparece só como contagem literal ("anotado em 3 de 5 episódios"), sem ranking de eficácia.
- Indica a origem de cada informação e se houve correções.
- Rodapé fixo: *"Este resumo reflete apenas o que foi registrado. Acontecimentos próximos no tempo não indicam causa. Não substitui avaliação profissional."*
- Os momentos positivos ficam numa seção própria, não num apêndice.

## 4. Fluxos principais

1. **Primeiro uso:** apresentação (o que o app faz e não faz, onde ficam os dados) → bloqueio opcional → perfil por apelido → tela inicial.
2. **Registro rápido:** "Registrar" → categoria (6 botões grandes) → campos essenciais, com os detalhes opcionais recolhidos → "Quando?" (agora, por padrão) → salvar. Meta: um registro mínimo em até 3 toques e 15 segundos.
3. **Fechar o dia:** no card do dia, escolher "Hoje não houve crise" ou "Ver o dia".
4. **Corrigir:** abrir o registro → editar → salvar. A versão anterior vai para o histórico e o registro ganha o selo "corrigido".
5. **Preparar consulta:** Resumo → período (30 dias, por padrão) → categorias → pré-visualizar → exportar PDF → escolher onde compartilhar.
6. **Backup e exclusão:** em Dados, "Exportar backup" (com senha), "Importar", "Apagar pessoa" e "Apagar tudo" (com confirmação digitada).

## 5. Privacidade e segurança

### 5.1 Princípio: os dados ficam só no aparelho (decidido em 13/10/2026)

O app não tem servidor, conta nem sincronização. Isso traz quatro consequências:

- O desenvolvedor não recebe os relatos. As declarações de dados das lojas tendem a "nenhum dado coletado", e isso precisa ser verdade inclusive para os logs de falha.
- Não existe credencial, banco remoto ou ponto central de vazamento.
- Como não há conta, a exclusão é local e imediata.
- **Custo:** se o aparelho for perdido ou trocado, tudo se perde, a menos que exista um backup exportado. É a principal troca deste modelo.

### 5.2 Medidas

- **Coleta mínima:** apelido e campos opcionais, sem identificador civil. O campo de texto livre traz uma dica para não incluir nomes de terceiros.
- **Em repouso:** SQLite cifrado (SQLCipher), com chave no Keychain do iOS ou no Keystore do Android via `expo-secure-store`. Bloqueio opcional do app por biometria ou PIN do sistema. O conteúdo fica oculto no seletor de apps.
- **Backups do sistema:** o banco fica fora do backup automático do Android e do iCloud (A2, 5.1.3(ii)). Por isso o MVP inclui um backup próprio, cifrado com senha do responsável.
- **Backup escolhido pelo responsável:**
  - O app gera um único arquivo cifrado e abre o seletor de arquivos ou a folha de compartilhamento do sistema. O responsável escolhe o destino: o próprio celular, o Google Drive, o OneDrive ou outro app que ele tenha instalado.
  - O app **não se conecta** a nenhuma conta de nuvem: não usa login, OAuth nem as APIs do Drive ou do OneDrive. Quem grava o arquivo é o sistema ou o app de nuvem do próprio responsável. O desenvolvedor não recebe o arquivo nem tem acesso a ele.
  - A cifra é obrigatória, porque o arquivo pode ficar num serviço de terceiros. A chave é derivada da senha por um KDF lento (Argon2id ou scrypt), e o conteúdo é protegido com AES-256-GCM. O arquivo guarda o formato e a versão do esquema, para que a importação seja validada.
  - A senha do backup não é recuperável: sem ela, o backup não abre. O app explica isso antes de criar a senha.
  - A restauração usa o seletor de arquivos do sistema. Antes de substituir ou mesclar dados, o app mostra uma prévia do conteúdo: pessoas, período e quantidade de registros.
  - O app mostra "último backup há N dias" na tela de Dados. Como não há notificações, não existe backup automático.
- **Em trânsito:** o MVP não envia dados pessoais pela rede. Uma futura sincronização usará TLS e, de preferência, cifra de ponta a ponta.
- **Logs e análise:** nenhum SDK de analytics, anúncios ou rastreamento de falhas. Os crashes ficam por conta dos relatórios nativos das lojas, que não incluem o conteúdo do banco. Nenhum log com dados de registro, verificado por regra de lint e por teste.
- **Notificações:** nenhuma no MVP. Se forem adicionadas, terão texto genérico, sem nome nem conteúdo.
- **IA:** nenhuma, nem serviço externo para gerar o PDF.
- **Exportação:** só por ação explícita, com aviso de que o arquivo deixa o controle do app.
- **Dados de teste:** apenas fictícios. O gerador de dados de demonstração existe só nas builds de desenvolvimento, e as capturas das lojas usam apenas dados fictícios.
- **Retenção:** os dados ficam até o responsável apagar; a remoção automática de registros antigos fica para decisão posterior. Desinstalar o app apaga o banco. Os arquivos de backup exportados ficam com quem os guardou, e o app informa isso.

### 5.3 Requisitos legais a avaliar

- **LGPD:** dados de saúde são sensíveis (art. 11), e o tratamento de dados de crianças exige o melhor interesse da criança e consentimento específico de um dos pais ou responsável (art. 14). No modelo só local, quem trata os dados é o próprio responsável, no aparelho e para fins particulares. Isso tende a afastar o desenvolvedor do papel de controlador, mas precisa ser confirmado com um profissional de proteção de dados. Se houver sincronização ou backup em nuvem, o desenvolvedor passa a tratar dados sensíveis de menores. Nesse caso, antes da funcionalidade, serão necessários base legal, consentimento destacado, encarregado, registro das operações, relatório de impacto e plano de resposta a incidentes. Um checkbox de aceite não resolve essas obrigações.
- **ECA Digital (Lei 15.211/2025):** o app é destinado a adultos, mas trata dados sobre crianças. É preciso verificar no texto oficial e nas orientações da ANPD quais deveres se aplicam.
- **Software como dispositivo médico (Anvisa, RDC 657/2022):** um registro descritivo, sem finalidade diagnóstica ou terapêutica, tende a não se enquadrar. Como o enquadramento depende das alegações, a ficha não deve prometer melhora clínica nem "identificar gatilhos".
- **Política de privacidade:** exigida pelas duas lojas mesmo sem coleta, descrevendo o funcionamento real em português simples.

## 6. Experiência

- Interface em português, com tom acolhedor e não alarmista. Episódios não aparecem em vermelho, e os momentos positivos têm o mesmo destaque visual.
- Contraste mínimo WCAG AA, fonte do sistema com tamanho dinâmico, áreas de toque de 48 dp ou mais e uso com uma mão.
- Azul como identidade, em tons sóbrios, sem quebra-cabeça nem ilustrações infantis.
- Parte da comunidade autista critica a associação entre autismo e azul e o símbolo do quebra-cabeça. Vale ouvir familiares e adultos autistas sobre o nome e a paleta antes da ficha da loja.

## 7. Arquitetura sugerida

| Decisão | Proposta | Motivo | Alternativas |
|---|---|---|---|
| App | **Expo / React Native + TypeScript** | Um código para Android e iOS; EAS tem plano gratuito, e build local também é possível | Flutter; nativo duplo, que dobra o custo |
| Dados | **SQLite local cifrado** (`expo-sqlite` com SQLCipher) e migrações versionadas | Funciona offline; consultas de linha do tempo e filtros ficam simples | AsyncStorage/MMKV, fracos para consultas; WatermelonDB, que só compensa com sincronização |
| Domínio | Pacote `core` em TypeScript puro: tipos, validação, cobertura e texto do resumo | Testável sem aparelho e reaproveitável numa PWA (opção B) | Lógica dentro das telas, difícil de testar |
| PDF | `expo-print` + `expo-sharing`, gerados no aparelho | Sem serviço externo | Biblioteca de PDF em JS |
| Servidor | **Nenhum no MVP** | Privacidade, custo zero e nenhuma conta de usuário | Backend com banco e autenticação, que só entra com sincronização |
| Backup | Arquivo cifrado pelo seletor ou compartilhamento do sistema (`expo-sharing` / seletor de documentos para restaurar) | O destino é escolhido pelo responsável, sem integração com contas de nuvem nem acesso do desenvolvedor | Integração direta com as APIs do Drive e do OneDrive, que exige OAuth, revisão de escopos pelo Google e dá acesso à conta do usuário |
| Sincronização futura | Fora de escopo. Se um dia houver múltiplos cuidadores, a escolha será reavaliada sem quebrar o princípio de dados no aparelho. **iCloud não**, por causa da 5.1.3(ii) | — | — |

**Estrutura inicial:** `apps/mobile` + `packages/core`. Web, banco remoto e autenticação só entram quando a sincronização for aprovada.

**Se a opção B (PWA) for escolhida:** o `packages/core` é reaproveitado, e mudam a interface e o armazenamento (IndexedDB, cifrado por senha). O suporte do Expo web ao SQLite ainda é imaturo, e uma prova de conceito deve decidir entre Expo web e uma PWA separada.

## 8. Modelo de dados (rascunho)

```
pessoa(id, apelido, faixa_etaria?, observacoes?, criada_em, atualizada_em)

registro(
  id, pessoa_id, categoria            -- alimentacao|sono|bem_estar|episodio|positivo
  ocorreu_em, ocorreu_fim?            -- horário do evento
  precisao                            -- exato|aproximado|periodo_do_dia|so_data
  periodo_do_dia?                     -- madrugada|manha|tarde|noite
  origem                              -- vi|me_contaram|suspeita
  origem_quem?                        -- texto curto (ex.: "escola")
  observacao?,
  lancado_em, atualizado_em, versao
)

detalhe_alimentacao(registro_id, alimento, quantidade?)        -- pouco|metade|tudo|recusou
detalhe_sono(registro_id, tipo, deitou?, dormiu?, acordou?)     -- tipo: noturno|cochilo
despertar(id, registro_id, horario?, duracao_min?, observacao?)
detalhe_bem_estar(registro_id, tipo, local?, sinais?)           -- tipo: dor_desconforto|evacuacao|outro
detalhe_episodio(registro_id, descricao, duracao_min?, intensidade,  -- leve|moderada|intensa|nao_sei
                 contexto_antes?, medidas?, desfecho?, lesao)        -- lesao: sim|nao|nao_sei
estrategia(id, pessoa_id, nome)                                  -- "o que ajudou", reutilizável
episodio_estrategia(registro_id, estrategia_id, ajudou)          -- ajudou: sim|nao|nao_sei
detalhe_positivo(registro_id, tipo, descricao)                   -- comunicacao|atividade|conquista|tranquilo|estrategia

dia_anotado(pessoa_id, data, sem_crises, observacao?, lancado_em)  -- PK (pessoa_id, data)

registro_revisao(id, registro_id, versao, conteudo_anterior_json, alterado_em)
```

Regras:
- `lancado_em` nunca muda. `ocorreu_em` pode ser corrigido, e a correção fica no histórico.
- A exclusão apaga o registro **e** as suas revisões, porque a privacidade vem antes da auditoria. Já a correção preserva o histórico.
- `dia_anotado.sem_crises = true` só é gravado por ação explícita. Se houver episódio no mesmo dia, o app avisa da inconsistência.
- "Sem registro" é calculado (dia sem `registro` e sem `dia_anotado`) e nunca é gravado como zero.

## 9. Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| Google exigir conta de organização | Sem Play Store | Decidir a distribuição antes do código (seção 1.4); núcleo portável |
| Apple rejeitar pela 5.1.1(ix) depois do lançamento | Perda do canal com usuários ativos | Consulta prévia; período gratuito ou beta antes de qualquer assinatura; PWA como alternativa |
| Perda de dados sem servidor | Família perde o histórico | Backup cifrado no destino escolhido pelo responsável; indicação de "último backup há N dias" |
| Senha do backup esquecida | Backup inutilizável | Aviso explícito antes de criar a senha; o app não guarda cópia da senha |
| Relatório lido como diagnóstico | Dano clínico | Texto descritivo, cobertura explícita, rodapé fixo e nenhuma correlação |
| Vazamento por arquivo exportado | Exposição de dados de menor | Aviso antes de compartilhar; PDF só com o apelido; senha no backup |
| Rejeição da identidade azul e do nome pela comunidade | Reputação | Escuta prévia antes da ficha |
| Enquadramento legal (LGPD, ECA Digital) | Sanção | Avaliação profissional antes de qualquer sincronização |

## 10. Plano após aprovação

1. ~~Consulta prévia às lojas~~ → dispensada em 13/10/2026 (ver seção 1.4).
2. Esqueleto `apps/mobile` + `packages/core` → verificar: typecheck, lint e testes do core passam; o app abre no Android com dados fictícios.
3. Banco cifrado, perfis e registro rápido → verificar: registro mínimo em até 3 toques; banco ilegível sem a chave.
4. Linha do tempo, filtros, dia sem crises e correções → verificar: testes de cobertura mostram "sem registro" diferente de "sem crises".
5. Primeira build de teste nas lojas, com dados fictícios e declarações fiéis, assim que os fluxos 2 a 4 estiverem prontos → verificar: resultado da revisão da Play e da Apple registrado antes de qualquer usuário real.
6. Resumo em PDF, backup, importação e exclusão → verificar: PDF com rodapé e cobertura; o arquivo de backup não é legível sem a senha; salvar e restaurar pelo armazenamento do aparelho e por um app de nuvem; restauração idêntica ao original; exclusão total confirmada.
