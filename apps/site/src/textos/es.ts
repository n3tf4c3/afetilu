import type { TextosSite } from "./tipo.ts";

export const es: TextosSite = {
  nomeDoIdioma: "Español",
  meta: {
    titulo: "Afetilu — observaciones del día a día para llevar a la consulta",
    descricao:
      "App gratuita para familiares y cuidadores de personas autistas que quieren registrar alimentación, sueño, molestias, comportamientos y momentos positivos, y llevar un resumen descriptivo a las consultas. Los datos quedan solo en el dispositivo.",
    tituloPolitica: "Política de Privacidad — Afetilu",
  },
  nav: {
    inicio: "Inicio",
    privacidade: "Privacidad",
    baixar: "Descargar la app",
    idiomas: "Idioma",
    pularParaConteudo: "Saltar al contenido",
  },
  hero: {
    selo: "Para familias y cuidadores de personas autistas",
    titulo: "El día a día registrado con calma, listo para la consulta.",
    subtitulo:
      "Anota alimentación, sueño, molestias, comportamientos y momentos positivos en pocos toques. A la hora de la consulta, lleva un resumen descriptivo a la terapeuta, la psicóloga o el médico.",
    gratuito: "Gratuita, sin cuenta y sin anuncios. Los datos quedan solo en tu dispositivo.",
  },
  lojas: {
    emBreve: "Pronto para Android y iPhone.",
    googlePlayTopo: "Disponible en",
    appStoreTopo: "Descárgalo en el",
  },
  recursosTitulo: "Cómo funciona",
  recursos: [
    {
      imagem: "inicio",
      titulo: "Registro en pocos toques",
      descricao: "Elige la categoría y guarda. ¿Se te olvidó en el momento? Regístralo después, con la hora aproximada.",
    },
    {
      imagem: "linha",
      titulo: "Una línea de tiempo honesta",
      descricao: "Un día sin registros aparece como “sin información”, nunca como “sin crisis”. Solo tú marcas un día sin crisis.",
    },
    {
      imagem: "resumo",
      titulo: "Resumen para la consulta",
      descricao: "Elige el período y genera un PDF descriptivo, con las preguntas que quieres hacer. Todo en el dispositivo.",
    },
    {
      imagem: "pdf",
      titulo: "Solo lo que se observó",
      descricao: "El resumen describe sin interpretar: cada registro con su hora, el origen de la información y las correcciones.",
    },
  ],
  capturaAlt: (titulo) => `${titulo} (pantalla de la app con datos ficticios)`,
  privacidade: {
    titulo: "Tus datos se quedan contigo",
    itens: [
      "Sin cuenta, sin servidor y sin sincronización: todo queda en el dispositivo, en una base de datos cifrada.",
      "Sin anuncios, sin analíticas y sin rastreo.",
      "Copia de seguridad solo cuando quieras, cifrada con tu propia contraseña y guardada donde elijas.",
      "Eliminar es de verdad: una persona o todo, en cualquier momento.",
    ],
    link: "Leer la política de privacidad",
  },
  limites: {
    titulo: "Lo que Afetilu no hace",
    texto:
      "No hace diagnósticos, no sugiere tratamientos, dietas ni medicamentos y no señala causas: que dos hechos ocurran cerca en el tiempo no significa que uno causó el otro. La app solo organiza lo que observaste, para que lo muestres a quienes acompañan a la persona.",
    emergencia: "No es un servicio de emergencias. En caso de urgencia, llama al número de emergencias local.",
  },
  codigoAberto: {
    titulo: "Gratuita y de código abierto",
    texto:
      "El código de Afetilu es público, con licencia MIT: cualquiera puede comprobar qué hace la app con los datos. Si quieres apoyar el proyecto, puedes usar GitHub Sponsors; es voluntario y no cambia nada en la app.",
    link: "Ver el código en GitHub",
  },
  rodape: {
    descricao: "Observaciones del día a día de personas autistas, registradas por la familia y llevadas a la consulta.",
    licenca: "Código abierto bajo la licencia MIT.",
    marcas: "Google Play y el logotipo de Google Play son marcas de Google LLC. Apple y el logotipo de Apple son marcas de Apple Inc.",
    contato: "Contacto",
    codigo: "Código fuente",
  },
  politica: {
    titulo: "Política de Privacidad",
    atualizadaEm: "Actualizada el 14 de octubre de 2026.",
    introducao:
      "Afetilu no recopila, no recibe y no vende datos. Todo lo que registras queda en tu dispositivo. Esta página explica qué se guarda, cómo se protege y cómo eliminarlo.",
    secoes: [
      {
        titulo: "Qué queda en tu dispositivo",
        paragrafos: [
          "El apodo de cada persona que acompañas, los registros (con el historial de correcciones), los días marcados sin crisis, los cambios en la rutina, las preguntas para la consulta y las preferencias de la app.",
          "Estos datos se guardan en una base de datos cifrada (SQLCipher). La clave es aleatoria, se guarda en el almacenamiento seguro del sistema (Keystore en Android, Keychain en iPhone) y solo funciona en ese dispositivo.",
        ],
      },
      {
        titulo: "Lo que Afetilu no hace",
        paragrafos: [
          "No tiene cuenta, servidor ni sincronización. No usa anuncios, analíticas ni servicios de terceros para rastrear fallos. No escribe tus registros en logs.",
          "No pide acceso a la cámara, el micrófono, los contactos ni la ubicación.",
        ],
      },
      {
        titulo: "Cuándo algo sale del dispositivo",
        paragrafos: [
          "Solo cuando tú decides: al compartir el resumen en PDF o guardar una copia de seguridad desde la hoja para compartir del sistema. A partir de ahí, el archivo queda en la app o el servicio que elegiste, y rige su política.",
          "El resumen en PDF contiene información de salud. Envíalo solo a quienes acompañan a la persona.",
        ],
      },
      {
        titulo: "Copia de seguridad",
        paragrafos: [
          "La copia de seguridad se cifra con una contraseña que solo tú conoces (AES-256-GCM, con la clave derivada de la contraseña por scrypt). Sin la contraseña, nadie puede abrir el archivo, ni siquiera nosotros.",
          "En Android, la copia automática del sistema está desactivada para la app. En iPhone, la copia del sistema puede incluir el archivo de la base de datos, pero cifrado y sin la clave.",
        ],
      },
      {
        titulo: "Cómo eliminar",
        paragrafos: [
          "En Ajustes › Tus datos puedes eliminar una persona o todo, con confirmación. La eliminación es definitiva. Desinstalar la app también borra los datos del dispositivo.",
          "Los archivos que ya exportaste o compartiste (PDF y copias de seguridad) quedan donde los guardaste y siguen bajo tu control.",
        ],
      },
      {
        titulo: "Niñas, niños y adolescentes",
        paragrafos: [
          "Afetilu está hecha para adultos responsables y cuidadores. Los registros pueden ser sobre niñas, niños y adolescentes, pero quedan solo en el dispositivo del responsable, que decide qué compartir.",
        ],
      },
      {
        titulo: "Este sitio",
        paragrafos: [
          "Este sitio no usa cookies, analíticas ni scripts de terceros. El proveedor de alojamiento (Vercel) puede registrar datos técnicos de acceso, como la dirección IP, para operar y proteger el servicio.",
        ],
      },
      {
        titulo: "Cambios en esta política",
        paragrafos: ["Si algo cambia, esta página y la fecha de actualización se actualizarán antes de que el cambio aplique en la app."],
      },
      {
        titulo: "Contacto",
        paragrafos: [
          "Las dudas y sugerencias se pueden enviar a través del repositorio del proyecto en GitHub. No incluyas datos personales ni de salud en mensajes públicos.",
        ],
      },
    ],
    contatoEmail: "O escribe a:",
  },
};
