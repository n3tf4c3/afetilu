import type { TextosSite } from "./tipo.ts";

export const en: TextosSite = {
  nomeDoIdioma: "English",
  meta: {
    titulo: "Afetilu — day-to-day notes to bring to appointments",
    descricao:
      "Free app for family members and caregivers of autistic people to log meals, sleep, discomfort, behavior and positive moments, and bring a descriptive summary to appointments. Data stays only on the device.",
    tituloPolitica: "Privacy Policy — Afetilu",
  },
  nav: {
    inicio: "Home",
    privacidade: "Privacy",
    baixar: "Get the app",
    idiomas: "Language",
    pularParaConteudo: "Skip to content",
  },
  hero: {
    selo: "For families and caregivers of autistic people",
    titulo: "Day-to-day life, noted calmly and ready for the appointment.",
    subtitulo:
      "Log meals, sleep, discomfort, behavior and positive moments in a few taps. When it is time for the appointment, bring a descriptive summary to the therapist, psychologist or doctor.",
    gratuito: "Free, no account and no ads. Your data stays only on your device.",
  },
  lojas: {
    emBreve: "Coming soon for Android and iPhone.",
    googlePlayTopo: "Get it on",
    appStoreTopo: "Download on the",
  },
  recursosTitulo: "How it works",
  recursos: [
    {
      imagem: "inicio",
      titulo: "Log in a few taps",
      descricao: "Pick the category and save. Forgot at the time? Log it later, with an approximate time.",
    },
    {
      imagem: "linha",
      titulo: "An honest timeline",
      descricao: "A day with no logs shows as “no information”, never as “no crises”. Only you mark a day as crisis-free.",
    },
    {
      imagem: "resumo",
      titulo: "Summary for appointments",
      descricao: "Choose the period and create a descriptive PDF, with the questions you want to ask. All on the device.",
    },
    {
      imagem: "pdf",
      titulo: "Only what was observed",
      descricao: "The summary describes without interpreting: each log with its time, source of information and corrections.",
    },
  ],
  capturaAlt: (titulo) => `${titulo} (app screen with fictional data)`,
  privacidade: {
    titulo: "Your data stays with you",
    itens: [
      "No account, no server and no sync: everything stays on the device, in an encrypted database.",
      "No ads, no analytics and no tracking.",
      "Backups only when you want them, encrypted with your own password and saved where you choose.",
      "Deleting is for real: one person or everything, at any time.",
    ],
    link: "Read the privacy policy",
  },
  limites: {
    titulo: "What Afetilu does not do",
    texto:
      "It does not diagnose, does not suggest treatments, diets or medication, and does not point to causes: events close in time do not mean one caused the other. The app only organizes what you observed, so you can show it to the people who support the person.",
    emergencia: "It is not an emergency service. In an emergency, call your local emergency number.",
  },
  codigoAberto: {
    titulo: "Free and open source",
    texto:
      "Afetilu's code is public, under the MIT license: anyone can check what the app does with the data. If you would like to support the project, you can use GitHub Sponsors; it is voluntary and changes nothing in the app.",
    link: "See the code on GitHub",
  },
  rodape: {
    descricao: "Day-to-day notes about autistic people, logged by the family and brought to appointments.",
    licenca: "Open source under the MIT license.",
    marcas: "Google Play and the Google Play logo are trademarks of Google LLC. Apple and the Apple logo are trademarks of Apple Inc.",
    codigo: "Source code",
  },
  politica: {
    titulo: "Privacy Policy",
    atualizadaEm: "Updated on October 14, 2026.",
    introducao:
      "Afetilu does not collect, receive or sell data. Everything you log stays on your device. This page explains what is stored, how it is protected and how to delete it.",
    secoes: [
      {
        titulo: "What stays on your device",
        paragrafos: [
          "The nickname of each person you support, the logs (with their correction history), days marked as crisis-free, changes in routine, questions for appointments and app preferences.",
          "This data is kept in an encrypted database (SQLCipher). The key is random, stored in the system's secure storage (Keystore on Android, Keychain on iPhone), and only works on that device.",
        ],
      },
      {
        titulo: "What Afetilu does not do",
        paragrafos: [
          "There is no account, server or sync. It uses no ads, no analytics and no third-party crash tracking. It does not write logs of what you record.",
          "It does not ask for access to the camera, microphone, contacts or location.",
        ],
      },
      {
        titulo: "When something leaves the device",
        paragrafos: [
          "Only when you decide: when you share the PDF summary or save a backup through the system share sheet. From then on, the file is with the app or service you chose, and its policy applies.",
          "The PDF summary contains health information. Send it only to people who support the person.",
        ],
      },
      {
        titulo: "Backup",
        paragrafos: [
          "Backups are encrypted with a password only you know (AES-256-GCM, with the key derived from the password by scrypt). Without the password, nobody can open the file, not even us.",
          "On Android, the system's automatic backup is turned off for the app. On iPhone, the system backup may include the database file, but encrypted and without the key.",
        ],
      },
      {
        titulo: "How to delete",
        paragrafos: [
          "In Settings › Your data, you can delete one person or everything, with confirmation. Deletion is permanent. Uninstalling the app also removes the data from the device.",
          "Files you have already exported or shared (PDFs and backups) stay where you saved them and remain under your control.",
        ],
      },
      {
        titulo: "Children and teenagers",
        paragrafos: [
          "Afetilu is made for responsible adults and caregivers. Logs may be about children and teenagers, but they stay only on the caregiver's device, and the caregiver decides what to share.",
        ],
      },
      {
        titulo: "This website",
        paragrafos: [
          "This website uses no cookies, no analytics and no third-party scripts. The hosting provider (Vercel) may record technical access data, such as the IP address, to run and protect the service.",
        ],
      },
      {
        titulo: "Changes to this policy",
        paragrafos: ["If anything changes, this page and the update date above will be updated before the change applies in the app."],
      },
      {
        titulo: "Contact",
        paragrafos: [
          "Questions and suggestions can be sent through the project's repository on GitHub. Do not include personal or health information in public messages.",
        ],
      },
    ],
  },
};
