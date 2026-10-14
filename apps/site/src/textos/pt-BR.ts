import type { TextosSite } from "./tipo.ts";

export const ptBR: TextosSite = {
  nomeDoIdioma: "Português",
  meta: {
    titulo: "Afetilu — observações do dia a dia para levar à consulta",
    descricao:
      "App gratuito para familiares e cuidadores de pessoas autistas registrarem alimentação, sono, desconfortos, comportamentos e momentos positivos, e levarem um resumo descritivo às consultas. Os dados ficam só no aparelho.",
    tituloPolitica: "Política de Privacidade — Afetilu",
  },
  nav: {
    inicio: "Início",
    privacidade: "Privacidade",
    baixar: "Baixar o app",
    idiomas: "Idioma",
    pularParaConteudo: "Pular para o conteúdo",
  },
  hero: {
    selo: "Para famílias e cuidadores de pessoas autistas",
    titulo: "O dia a dia registrado com calma, pronto para a consulta.",
    subtitulo:
      "Anote alimentação, sono, desconfortos, comportamentos e momentos positivos em poucos toques. Na hora da consulta, leve um resumo descritivo para a terapeuta, a psicóloga ou o médico.",
    gratuito: "Gratuito, sem conta e sem anúncios. Os dados ficam só no seu aparelho.",
  },
  lojas: {
    emBreve: "Em breve para Android e iPhone.",
    googlePlayTopo: "Disponível no",
    appStoreTopo: "Baixar na",
  },
  recursosTitulo: "Como funciona",
  recursos: [
    {
      imagem: "inicio",
      titulo: "Registro em poucos toques",
      descricao: "Escolha a categoria e salve. Esqueceu na hora? Registre depois, com o horário aproximado.",
    },
    {
      imagem: "linha",
      titulo: "Linha do tempo honesta",
      descricao: "Dia sem registro aparece como “sem informação”, nunca como “sem crises”. Só você marca um dia sem crises.",
    },
    {
      imagem: "resumo",
      titulo: "Resumo para a consulta",
      descricao: "Escolha o período e gere um PDF descritivo, com as perguntas que você quer fazer. Tudo no aparelho.",
    },
    {
      imagem: "pdf",
      titulo: "Só o que foi observado",
      descricao: "O resumo descreve, sem interpretar: cada registro com horário, origem da informação e correções.",
    },
  ],
  capturaAlt: (titulo) => `${titulo} (tela do app com dados fictícios)`,
  privacidade: {
    titulo: "Seus dados ficam com você",
    itens: [
      "Sem conta, sem servidor e sem sincronização: tudo fica no aparelho, num banco de dados cifrado.",
      "Sem anúncios, sem analytics e sem rastreamento.",
      "Backup só quando você quiser, cifrado com uma senha sua e salvo onde você escolher.",
      "Apagar é de verdade: uma pessoa ou tudo, a qualquer momento.",
    ],
    link: "Ler a política de privacidade",
  },
  limites: {
    titulo: "O que o Afetilu não faz",
    texto:
      "Não faz diagnóstico, não sugere tratamento, dieta ou medicamento e não aponta causas: acontecimentos próximos no tempo não indicam que um causou o outro. O app só organiza o que você observou, para você mostrar a quem acompanha a pessoa.",
    emergencia: "Não é serviço de emergência. Em caso de urgência, ligue 192 (SAMU).",
  },
  codigoAberto: {
    titulo: "Gratuito e de código aberto",
    texto:
      "O código do Afetilu é público, com licença MIT: qualquer pessoa pode conferir o que o app faz com os dados. Quem quiser apoiar o projeto pode usar o GitHub Sponsors; é voluntário e não muda nada no app.",
    link: "Ver o código no GitHub",
  },
  rodape: {
    descricao: "Observações do dia a dia de pessoas autistas, registradas pela família e levadas à consulta.",
    licenca: "Código aberto sob a licença MIT.",
    marcas: "Google Play e o logotipo do Google Play são marcas da Google LLC. Apple e o logotipo da Apple são marcas da Apple Inc.",
    codigo: "Código-fonte",
  },
  politica: {
    titulo: "Política de Privacidade",
    atualizadaEm: "Atualizada em 14 de outubro de 2026.",
    introducao:
      "O Afetilu não coleta, não recebe e não vende dados. Tudo o que você registra fica no seu aparelho. Esta página explica o que fica guardado, como é protegido e como apagar.",
    secoes: [
      {
        titulo: "O que fica no seu aparelho",
        paragrafos: [
          "O apelido de cada pessoa acompanhada, os registros (com o histórico de correções), os dias marcados sem crises, as mudanças na rotina, as perguntas para a consulta e as preferências do app.",
          "Esses dados ficam num banco de dados cifrado (SQLCipher). A chave é aleatória, fica no armazenamento seguro do sistema (Keystore no Android, Keychain no iPhone) e só funciona nesse aparelho.",
        ],
      },
      {
        titulo: "O que o Afetilu não faz",
        paragrafos: [
          "Não tem conta, servidor ou sincronização. Não usa anúncios, analytics nem serviços de terceiros para rastrear falhas. Não grava registros em logs.",
          "Não pede acesso a câmera, microfone, contatos ou localização.",
        ],
      },
      {
        titulo: "Quando algo sai do aparelho",
        paragrafos: [
          "Só quando você decide: ao compartilhar o resumo em PDF ou salvar um backup, pela folha de compartilhamento do sistema. A partir daí, o arquivo fica com o app ou serviço que você escolheu, e vale a política dele.",
          "O resumo em PDF traz informações de saúde. Envie apenas para quem acompanha a pessoa.",
        ],
      },
      {
        titulo: "Backup",
        paragrafos: [
          "O backup é cifrado com uma senha que só você conhece (AES-256-GCM, com a chave derivada da senha por scrypt). Sem a senha, ninguém abre o arquivo, nem nós.",
          "No Android, o backup automático do sistema fica desligado para o app. No iPhone, o backup do sistema pode levar o arquivo do banco, mas cifrado e sem a chave.",
        ],
      },
      {
        titulo: "Como apagar",
        paragrafos: [
          "Em Ajustes › Seus dados, você apaga uma pessoa ou tudo, com confirmação. A exclusão é definitiva. Desinstalar o app também remove os dados do aparelho.",
          "Arquivos que você já exportou ou compartilhou (PDFs e backups) ficam onde você os salvou e continuam sob seu controle.",
        ],
      },
      {
        titulo: "Crianças e adolescentes",
        paragrafos: [
          "O Afetilu é feito para adultos responsáveis e cuidadores. Os registros podem ser sobre crianças e adolescentes, mas ficam só no aparelho do responsável, que decide o que compartilhar.",
        ],
      },
      {
        titulo: "Este site",
        paragrafos: [
          "Este site não usa cookies, analytics nem scripts de terceiros. A hospedagem (Vercel) pode registrar dados técnicos de acesso, como o endereço IP, para operar e proteger o serviço.",
        ],
      },
      {
        titulo: "Mudanças nesta política",
        paragrafos: ["Se algo mudar, esta página e a data de atualização acima serão atualizadas antes de a mudança valer no app."],
      },
      {
        titulo: "Contato",
        paragrafos: [
          "Dúvidas e sugestões podem ser enviadas pelo repositório do projeto no GitHub. Não inclua dados pessoais ou de saúde em mensagens públicas.",
        ],
      },
    ],
  },
};
