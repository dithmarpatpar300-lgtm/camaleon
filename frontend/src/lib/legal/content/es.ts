import type { LegalPageId } from "../types";
import type { LegalPageContent } from "../types";
import { CURRENT_LEGAL_REVISION } from "../constants";
import { COOKIE_NAMES, SESSION_KEYS, STORAGE_KEYS } from "@/lib/storage/keys";
import {
  SITE_CONTACT_BUG_URL,
  SITE_CONTACT_FEATURE_URL,
  SITE_REPO_URL,
  SITE_SECURITY_ADVISORY_URL,
} from "@/lib/site";

const REVISION = CURRENT_LEGAL_REVISION;

const privacyStorageRows: string[][] = [
  [STORAGE_KEYS.USER_SETTINGS, "Preferencias (S1–S7): idioma, tema, defaults de transmutacion, rendimiento, avisos, offline, modo riesgo, actualizaciones, batch, carril/tab/densidad del navegador de herramientas"],
  [STORAGE_KEYS.THEME, "Espejo de tema (oscuro/claro) — sincronizado con cookie"],
  [STORAGE_KEYS.LOCALE, "Espejo de idioma (en/es) — sincronizado con cookie"],
  [STORAGE_KEYS.ONBOARDING, "Si el onboarding de bienvenida fue completado"],
  [STORAGE_KEYS.LAST_SEEN_RELEASE, "Ultima version de release mostrada en el modal de changelog"],
  [STORAGE_KEYS.RELEASE_SNOOZE, "Timestamp ISO — ocultar release notes hasta esta fecha"],
  [STORAGE_KEYS.APP_UPDATE_SNOOZE, "Timestamp ISO — ocultar banner de actualizacion hasta esta fecha"],
  [STORAGE_KEYS.LEGAL_REVISION_ACK, "Confirmacion de revision legal ({ revision, acknowledgedAt })"],
];

const privacyCookieRows: string[][] = [
  [COOKIE_NAMES.LOCALE, "Idioma para primer pintado SSR (en/es)"],
  [COOKIE_NAMES.THEME, "Tema para primer pintado SSR (oscuro/claro)"],
  [COOKIE_NAMES.TOOL_LANE, "Carril Convert vs Optimize para primer pintado SSR"],
  [COOKIE_NAMES.TOOL_TAB, "Pestaña de formato activa para primer pintado SSR"],
  [COOKIE_NAMES.TOOL_DENSITY, "Densidad de la grilla de herramientas para primer pintado SSR"],
];

export const legalPagesEs: Record<LegalPageId, LegalPageContent> = {
  about: {
    title: "Acerca de Camaleon",
    description:
      "Camaleon v3.4 — transmutacion de imagenes local en tu navegador, sin nada que ocultar.",
    lastUpdated: "20 de junio de 2026",
    legalRevision: REVISION,
    intro:
      "Camaleon es una aplicacion web de codigo abierto que transmuta imagenes enteramente dentro de tu navegador. La construimos porque convertir formatos no deberia exigir subir tus fotos al servidor de un desconocido.",
    sections: [
      {
        id: "what-is",
        title: "Que es Camaleon",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon es un toolkit de imagenes orientado a la privacidad. Sueltas un archivo, eliges herramienta o formato de salida y descargas el resultado — todo en tu dispositivo. Sin cuentas, sin inicio de sesion, sin backend de conversion.",
          },
        ],
      },
      {
        id: "capabilities",
        title: "Que puedes hacer",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon v3.4 incluye 25 herramientas de transmutacion en carriles Convert y Optimize en el navegador de herramientas del inicio.",
          },
          {
            type: "list",
            items: [
              "Convertir entre JPEG, PNG, WebP, AVIF, SVG, GIF, TIFF, BMP, TGA e ICO donde este soportado.",
              "Transmutador universal — suelta cualquier imagen soportada y elige formato de salida; Camaleon te lleva a la herramienta correcta.",
              "Carril Optimize — re-codifica con presets de calidad y metricas honestas de tamano (el resultado puede crecer o reducirse).",
              "Flujos batch — procesa multiples archivos, con seleccion por fila y descarga individual o ZIP.",
              "Semantic Alpha y opciones de transmutacion donde el formato lo permita.",
            ],
          },
        ],
      },
      {
        id: "how-it-works",
        title: "Como funciona",
        blocks: [
          {
            type: "paragraph",
            text: "La decodificacion y codificacion ocurren en un Web Worker usando Rust compilado a WebAssembly (motor v1.6.0). El sitio entrega HTML, JavaScript y modulos Wasm desde el mismo origen. Los bytes de tu archivo se leen en memoria del navegador, se procesan localmente y se ofrecen como descarga. Los operadores de Camaleon nunca reciben tus imagenes.",
          },
        ],
      },
      {
        id: "privacy-first",
        title: "Privacidad por diseno",
        blocks: [
          {
            type: "paragraph",
            text: "Por defecto, Camaleon aplica una politica StripAll de metadatos: EXIF, perfiles ICC y metadatos similares no se copian a las salidas. Tu archivo original en disco no se modifica — solo el resultado descargado refleja esta politica.",
          },
          {
            type: "callout",
            variant: "info",
            title: "100% local",
            text: "Los bytes del archivo nunca salen de tu dispositivo durante la transmutacion. Consulta nuestra Politica de Privacidad para detalles de almacenamiento y offline.",
          },
        ],
      },
      {
        id: "pwa-offline",
        title: "Instalacion y offline",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon es una Progressive Web App (PWA). Tras al menos una visita online, un Service Worker puede cachear el shell de la app y los motores Wasm que uses — o, si activas la opcion en Ajustes → Offline y cache, el toolkit completo (~10–17 MB). La transmutacion offline funciona sin enviar archivos a un servidor; la primera visita y las actualizaciones siguen requiriendo red.",
          },
        ],
      },
      {
        id: "open-source",
        title: "Codigo abierto",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon se publica bajo licencia MIT. El codigo fuente, el pipeline de build y los modulos WebAssembly son publicos para que cualquiera pueda verificar como funciona la conversion.",
          },
          {
            type: "paragraph",
            text: `Repositorio: ${SITE_REPO_URL}`,
          },
        ],
      },
      {
        id: "what-we-dont-do",
        title: "Que no hacemos",
        blocks: [
          {
            type: "paragraph",
            text: "Evitamos a proposito practicas comunes en convertidores en linea:",
          },
          {
            type: "list",
            items: [
              "No subimos tus archivos a nuestros servidores — no hay backend de conversion.",
              "No pedimos cuentas ni inicio de sesion.",
              "No usamos analitica de terceros ni rastreadores publicitarios en la app.",
              "No vendemos ni compartimos contenido de archivos — nunca tenemos acceso a el.",
            ],
          },
        ],
      },
      {
        id: "project-status",
        title: "Estado del proyecto",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon esta en desarrollo activo. Etiquetamos con honestidad conversiones sin perdida vs con perdida, documentamos cuando el tamano de salida puede crecer, y ampliamos formatos y herramientas con el tiempo. Los ajustes (idioma, tema, rendimiento, offline, modo riesgo, defaults batch y mas) viven en un drawer unificado de preferencias.",
          },
        ],
      },
    ],
  },

  contact: {
    title: "Contacto",
    description: "Como contactar al proyecto Camaleon — comentarios, errores, preguntas legales y contribuciones.",
    lastUpdated: "20 de junio de 2026",
    legalRevision: REVISION,
    intro:
      "Camaleon se mantiene como proyecto de codigo abierto. GitHub es el canal principal — leemos issues y pull requests alli.",
    sections: [
      {
        id: "overview",
        title: "Como contactarnos",
        blocks: [
          {
            type: "paragraph",
            text: "Elige el canal que mejor coincida con tu tema. No adjuntes imagenes personales ni documentos privados en issues publicos — describe el problema y los pasos para reproducirlo.",
          },
        ],
      },
      {
        id: "bugs",
        title: "Reportes de errores",
        blocks: [
          {
            type: "paragraph",
            text: "Si algo falla, una conversion se ve mal o la UI se comporta mal, abre un Issue en GitHub con la plantilla de bug report. Incluye navegador, sistema operativo, nombre de herramienta y pasos para reproducir.",
          },
        ],
      },
      {
        id: "features",
        title: "Sugerencias de funciones",
        blocks: [
          {
            type: "paragraph",
            text: "Ideas para nuevos formatos, herramientas o mejoras de UX son bienvenidas via la plantilla de feature request. Explica el caso de uso — priorizamos funciones local-first y orientadas a la privacidad.",
          },
        ],
      },
      {
        id: "privacy-legal",
        title: "Privacidad y preguntas legales",
        blocks: [
          {
            type: "paragraph",
            text: "Preguntas sobre esta Politica de Privacidad o Terminos de Uso pueden plantearse en un Issue de GitHub con etiqueta apropiada. Para el texto legal, consulta /privacy y /terms en este sitio.",
          },
        ],
      },
      {
        id: "translations",
        title: "Traducciones",
        blocks: [
          {
            type: "paragraph",
            text: "La app soporta ingles y espanol. Mejoras de traduccion e idiomas adicionales son bienvenidos via pull request.",
          },
        ],
      },
      {
        id: "security",
        title: "Vulnerabilidades de seguridad",
        blocks: [
          {
            type: "paragraph",
            text: "Si crees haber encontrado una vulnerabilidad de seguridad en el proyecto (no un tema de privacidad de archivos — los archivos nunca salen del navegador por diseno), reportala de forma responsable via advisory privado de GitHub o un issue con detalle publico minimo hasta resolverla.",
          },
        ],
      },
      {
        id: "releases",
        title: "Notas de release",
        blocks: [
          {
            type: "paragraph",
            text: "Novedades e historial de releases estan disponibles desde Ajustes → Actualizaciones o el drawer de comunicaciones. Los cambios legales importantes se anuncian por separado — no solo en las release notes.",
          },
        ],
      },
      {
        id: "no-support",
        title: "Sin soporte comercial",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon se proporciona tal cual bajo licencia MIT. No ofrecemos soporte de pago, SLAs ni contratos enterprise en este momento.",
          },
        ],
      },
    ],
    actions: [
      { label: "Reportar un error", href: SITE_CONTACT_BUG_URL, external: true, primary: true },
      { label: "Sugerir una mejora", href: SITE_CONTACT_FEATURE_URL, external: true },
      { label: "Advisory de seguridad (privado)", href: SITE_SECURITY_ADVISORY_URL, external: true },
      { label: "Ver codigo fuente", href: SITE_REPO_URL, external: true },
    ],
  },

  privacy: {
    title: "Politica de Privacidad",
    description: "Como Camaleon maneja tus datos — tus archivos permanecen en tu dispositivo.",
    lastUpdated: "20 de junio de 2026",
    legalRevision: REVISION,
    showToc: true,
    intro:
      "Esta politica explica que recopila, almacena y procesa Camaleon. Disenamos la app para que la transmutacion de imagenes no requiera enviarnos tus archivos.",
    sections: [
      {
        id: "summary",
        title: "Resumen",
        blocks: [
          {
            type: "callout",
            variant: "info",
            title: "Tus archivos permanecen locales",
            text: "Los archivos de imagen se procesan en tu navegador. No operamos un servidor que reciba, almacene o analice el contenido de tus archivos.",
          },
        ],
      },
      {
        id: "files",
        title: "Archivos y transmutacion",
        blocks: [
          {
            type: "paragraph",
            text: "Cuando sueltas o seleccionas un archivo, se lee en memoria en tu navegador. La conversion corre en un Web Worker usando modulos WebAssembly descargados del mismo origen. Los bytes de salida se ofrecen como descarga. En ningun momento se transmiten bytes de archivo a los operadores de Camaleon.",
          },
        ],
      },
      {
        id: "no-collection",
        title: "Que no recopilamos",
        blocks: [
          {
            type: "paragraph",
            text: "Respecto a tus imagenes y transmutaciones:",
          },
          {
            type: "list",
            items: [
              "No subimos archivos a nuestra infraestructura.",
              "No registramos nombres, tamanos ni resultados de conversion en un servidor que controlemos.",
              "No usamos APIs de conversion de terceros ni servicios cloud de OCR/vision.",
            ],
          },
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon establece cookies pequenas para que la primera carga coincida con tus preferencias guardadas (sin flash visual). No se usan para rastreo ni publicidad.",
          },
          {
            type: "table",
            headers: ["Cookie", "Proposito"],
            rows: privacyCookieRows,
          },
        ],
      },
      {
        id: "local-storage",
        title: "localStorage",
        blocks: [
          {
            type: "paragraph",
            text: "localStorage del navegador persiste preferencias en tu dispositivo. Los valores no se transmiten a nosotros.",
          },
          {
            type: "table",
            headers: ["Clave", "Proposito"],
            rows: privacyStorageRows,
          },
          {
            type: "paragraph",
            text: "Claves legacy (camaleon.tools.lane.v1, camaleon.tools.tab.v1, camaleon.tools.density.v1) migran una vez a user-settings.tools y se eliminan.",
          },
        ],
      },
      {
        id: "session-storage",
        title: "sessionStorage",
        blocks: [
          {
            type: "paragraph",
            text: `Cuando activas el modo offline voluntario (Ajustes → Offline), la pestaña puede almacenar \`${SESSION_KEYS.FORCE_OFFLINE}\` durante la sesion. Esta bandera se borra al cerrar la pestaña. Se usa para QA y pruebas offline — no para rastreo.`,
          },
        ],
      },
      {
        id: "cache-offline",
        title: "Cache Storage y offline",
        blocks: [
          {
            type: "paragraph",
            text: "Un Service Worker (PWA Serwist) puede cachear HTML, JavaScript, modulos WebAssembly y assets estaticos en tu dispositivo para que la app funcione offline tras una visita online. Por defecto, solo se cachean lazy los motores que uses. El precache opt-in del toolkit completo (Ajustes S5) descarga todos los crates Wasm (~10–17 MB) a Cache Storage. Es almacenamiento gestionado por el navegador — no datos que recibamos. Borralo via Ajustes → Offline y cache o los controles de datos del sitio de tu navegador.",
          },
        ],
      },
      {
        id: "app-updates",
        title: "Comprobacion de actualizaciones",
        blocks: [
          {
            type: "paragraph",
            text: "Cuando la deteccion automatica de actualizaciones esta activa (Ajustes → Actualizaciones, activa por defecto), la app consulta periodicamente /version.json del mismo origen para comparar cadenas de version. No se envian datos de archivos. Tu controlas la recarga cuando hay una actualizacion disponible.",
          },
        ],
      },
      {
        id: "analytics",
        title: "Analitica y terceros",
        blocks: [
          {
            type: "paragraph",
            text: "El codigo de la aplicacion Camaleon no incluye rastreadores de analitica (sin Google Analytics, sin pixels publicitarios). Si accedes al sitio via proveedor de hosting o CDN, ese proveedor puede recopilar logs estandar de servidor web (IP, user agent, URL solicitada) bajo su propia politica — no usamos esos logs para identificar usuarios individuales ni actividad de archivos.",
          },
        ],
      },
      {
        id: "metadata",
        title: "Metadatos en archivos convertidos",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon aplica una politica StripAll de metadatos por defecto: EXIF, perfiles ICC y metadatos similares de las imagenes fuente no se copian a las salidas. Esto reduce la filtracion accidental de ubicacion o informacion del dispositivo en archivos compartidos.",
          },
        ],
      },
      {
        id: "risk-mode",
        title: "Modo riesgo",
        blocks: [
          {
            type: "paragraph",
            text: "Si activas el Modo riesgo en Ajustes, Camaleon almacena riskMode.enabled y un timestamp ISO acknowledgedAt en camaleon-user-settings-v1. Esto registra que aceptaste limites elevados bajo tu propio riesgo. El modo riesgo nunca omite las comprobaciones de seguridad de recursos externos SVG.",
          },
        ],
      },
      {
        id: "legal-revision-ack",
        title: "Aviso de revision legal",
        blocks: [
          {
            type: "paragraph",
            text: `Cuando actualizamos materialmente las paginas legales, Camaleon puede mostrar un aviso dedicado y almacenar tu confirmacion en ${STORAGE_KEYS.LEGAL_REVISION_ACK} hasta que cambie la revision de nuevo.`,
          },
        ],
      },
      {
        id: "children",
        title: "Menores",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon es una utilidad de proposito general. No recopilamos a sabiendas informacion personal de nadie, incluidos menores.",
          },
        ],
      },
      {
        id: "changes",
        title: "Cambios a esta politica",
        blocks: [
          {
            type: "paragraph",
            text: "Podemos actualizar esta politica a medida que evoluciona la app. La fecha de ultima actualizacion y la revision legal en la parte superior cambiaran cuando lo hagamos. El uso continuado tras una actualizacion constituye aceptacion de la politica revisada.",
          },
        ],
      },
      {
        id: "contact",
        title: "Contacto",
        blocks: [
          {
            type: "paragraph",
            text: "Preguntas sobre privacidad: abre un issue en GitHub (ver pagina Contacto).",
          },
        ],
      },
    ],
  },

  terms: {
    title: "Terminos de Uso",
    description: "Terminos que rigen el uso de la aplicacion web Camaleon.",
    lastUpdated: "20 de junio de 2026",
    legalRevision: REVISION,
    showToc: true,
    intro:
      "Al usar Camaleon, aceptas estos terminos. Leelos con atencion. Si no estas de acuerdo, no uses la aplicacion.",
    sections: [
      {
        id: "service",
        title: "El servicio",
        blocks: [
          {
            type: "paragraph",
            text: "Camaleon proporciona herramientas de transmutacion de imagenes en el navegador — convertir, optimizar, redimensionar y operaciones relacionadas. El software corre en tu dispositivo. Alojamos archivos estaticos (HTML, JavaScript, WebAssembly) que constituyen la aplicacion.",
          },
        ],
      },
      {
        id: "no-warranty",
        title: "Sin garantia",
        blocks: [
          {
            type: "paragraph",
            text: 'Camaleon se proporciona "tal cual" y "segun disponibilidad", sin garantia de ningun tipo, expresa o implicita, incluidas garantias de comerciabilidad, idoneidad para un proposito particular o no infraccion. No garantizamos que las conversiones sean libres de errores, sin perdida donde se indique con perdida, ni aptas para uso medico, legal o forense.',
          },
        ],
      },
      {
        id: "responsibility",
        title: "Tu responsabilidad",
        blocks: [
          {
            type: "paragraph",
            text: "Eres unicamente responsable de:",
          },
          {
            type: "list",
            items: [
              "Los archivos que elijas transmutar y como uses los resultados.",
              "Verificar la calidad de salida antes de descartar originales.",
              "Cumplir con derechos de autor y leyes aplicables en tu jurisdiccion.",
              "Mantener copias de seguridad de archivos importantes.",
            ],
          },
        ],
      },
      {
        id: "batch",
        title: "Batch y multi-archivo",
        blocks: [
          {
            type: "paragraph",
            text: "Los flujos batch y multi-archivo procesan archivos que seleccionas explicitamente. Eres responsable de revisar selecciones, nombres de salida y empaquetado de descarga (archivos individuales o ZIP). Camaleon no recupera originales descartados.",
          },
        ],
      },
      {
        id: "optimize",
        title: "Resultados de Optimize",
        blocks: [
          {
            type: "paragraph",
            text: "El carril Optimize re-codifica imagenes con calidad configurable. El tamano de salida puede disminuir, mantenerse similar o aumentar segun el contenido fuente y los ajustes. Presentamos metricas con honestidad pero no garantizamos ratios de compresion ni reduccion de tamano.",
          },
        ],
      },
      {
        id: "risk-mode",
        title: "Modo riesgo",
        blocks: [
          {
            type: "callout",
            variant: "warning",
            title: "Limites elevados bajo tu riesgo",
            text: "El modo riesgo omite limites por defecto de pixeles y bytes y flujos de consentimiento automatico. Lo activas explicitamente en Ajustes. Archivos grandes pueden ralentizar o bloquear la pestaña del navegador. Camaleon no es responsable por perdida de datos, inestabilidad del navegador ni errores OOM derivados del uso del modo riesgo.",
          },
        ],
      },
      {
        id: "pwa-offline",
        title: "PWA y offline",
        blocks: [
          {
            type: "paragraph",
            text: "La operacion offline depende del cache previo en tu navegador. No garantizamos disponibilidad offline ininterrumpida, completitud del cache ni compatibilidad con todo navegador o cuota de almacenamiento. La primera visita y las actualizaciones requieren acceso a red.",
          },
        ],
      },
      {
        id: "app-updates",
        title: "Actualizaciones de la app",
        blocks: [
          {
            type: "paragraph",
            text: "Cuando recargas para aplicar una actualizacion, el trabajo en curso en la pestaña puede perderse. Guarda descargas antes de recargar. La deteccion de actualizaciones usa solo un beacon de version — no se transmiten datos de archivos.",
          },
        ],
      },
      {
        id: "acceptable-use",
        title: "Uso aceptable",
        blocks: [
          {
            type: "paragraph",
            text: "No puedes usar Camaleon para procesar material sobre el que no tengas derecho de convertir, ni para fines ilegales. No monitorizamos el uso (no podemos — el procesamiento es local), pero el mal uso viola estos terminos.",
          },
        ],
      },
      {
        id: "intellectual-property",
        title: "Propiedad intelectual",
        blocks: [
          {
            type: "paragraph",
            text: "El nombre Camaleon, la marca y el codigo fuente se publican bajo licencia MIT salvo que el repositorio indique lo contrario. Las bibliotecas de terceros conservan sus licencias respectivas. Conservas derechos sobre archivos que creas localmente; no reclamamos propiedad de tus salidas.",
          },
        ],
      },
      {
        id: "liability",
        title: "Limitacion de responsabilidad",
        blocks: [
          {
            type: "paragraph",
            text: "En la maxima medida permitida por la ley, los autores y contribuidores de Camaleon no seran responsables por danos indirectos, incidentales, especiales, consecuentes o punitivos, ni por perdida de datos, beneficios o goodwill, derivados de tu uso de la aplicacion.",
          },
        ],
      },
      {
        id: "changes",
        title: "Cambios al servicio y terminos",
        blocks: [
          {
            type: "paragraph",
            text: 'Podemos modificar, suspender o discontinuar funciones en cualquier momento. Podemos actualizar estos terminos; la fecha de "Ultima actualizacion" y la revision legal reflejan la version mas reciente. Cambios legales materiales pueden anunciarse via aviso dedicado en la app.',
          },
        ],
      },
      {
        id: "governing-law",
        title: "Ley aplicable",
        blocks: [
          {
            type: "paragraph",
            text: "Estos terminos estan redactados en ingles. La interpretacion sigue principios generales de derecho contractual en la jurisdiccion del operador, salvo protecciones obligatorias al consumidor locales donde vivas.",
          },
        ],
      },
    ],
  },
};
