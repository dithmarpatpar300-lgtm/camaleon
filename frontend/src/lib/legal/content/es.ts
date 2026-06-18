import type { LegalPageId } from "../types";
import type { LegalPageContent } from "../types";
import {
  SITE_CONTACT_BUG_URL,
  SITE_CONTACT_FEATURE_URL,
  SITE_REPO_URL,
  SITE_SECURITY_ADVISORY_URL,
} from "@/lib/site";

export const legalPagesEs: Record<LegalPageId, LegalPageContent> = {
  about: {
    title: "Acerca de Camaleon",
    description:
      "Por que existe Camaleon — transmutacion de imagenes local en tu navegador, sin nada que ocultar.",
    lastUpdated: "Junio 2026",
    intro:
      "Camaleon es una aplicacion web de codigo abierto que convierte imagenes enteramente dentro de tu navegador. La construimos porque convertir formatos no deberia exigir subir tus fotos al servidor de un desconocido.",
    sections: [
      {
        title: "Que hacemos",
        paragraphs: [
          "Camaleon transmuta formatos de imagen — JPEG, PNG, WebP y mas con el tiempo — usando Rust compilado a WebAssembly. Toda la decodificacion y codificacion ocurre en un Web Worker en tu dispositivo. El sitio entrega la app; nunca recibe los bytes de tus archivos.",
        ],
      },
      {
        title: "Que no hacemos",
        paragraphs: ["Evitamos a proposito practicas comunes en convertidores en linea:"],
        listItems: [
          "No subimos tus archivos a nuestros servidores — no hay backend de conversion.",
          "No pedimos cuentas ni inicio de sesion para transmutar.",
          "No usamos analitica de terceros ni rastreadores publicitarios en la app hoy.",
          "No vendemos ni compartimos contenido de archivos — nunca tenemos acceso a el.",
        ],
      },
      {
        title: "Codigo abierto",
        paragraphs: [
          "Camaleon se publica bajo licencia MIT. El codigo fuente, el pipeline de build y los modulos WebAssembly son publicos para que cualquiera pueda verificar como funciona la conversion.",
          `Repositorio: ${SITE_REPO_URL}`,
        ],
      },
      {
        title: "Metadatos y privacidad",
        paragraphs: [
          "Por defecto, Camaleon elimina metadatos (EXIF, ICC, chunks de texto) de las salidas — una decision orientada a la privacidad documentada en nuestra especificacion tecnica. Tu archivo original en disco no se modifica; solo el resultado descargado refleja esta politica.",
          "Para mas detalle, consulta nuestra Politica de Privacidad.",
        ],
      },
      {
        title: "Estado del proyecto",
        paragraphs: [
          "Camaleon esta en desarrollo activo. Las funciones y formatos soportados crecen con el tiempo. Etiquetamos con honestidad las conversiones sin perdida frente a las con perdida, y documentamos cuando el tamano de salida puede crecer en lugar de reducirse.",
        ],
      },
    ],
  },

  contact: {
    title: "Contacto",
    description: "Como contactar al proyecto Camaleon — comentarios, errores y contribuciones.",
    lastUpdated: "Junio 2026",
    intro:
      "Camaleon se mantiene como proyecto de codigo abierto. La mejor forma de contactarnos es GitHub — leemos issues y pull requests alli.",
    sections: [
      {
        title: "Reportes de errores y sugerencias",
        paragraphs: [
          "Si algo falla, una conversion se ve mal o tienes una idea para un nuevo formato, abre un Issue en GitHub. Incluye navegador, sistema operativo y pasos para reproducir cuando reportes errores.",
        ],
      },
      {
        title: "Contribuciones",
        paragraphs: [
          "Los pull requests son bienvenidos. El repositorio incluye especificaciones tecnicas, documentacion de arquitectura y un pipeline de CI que ejecuta tests de Rust y un build de produccion en cada cambio.",
        ],
      },
      {
        title: "Seguridad",
        paragraphs: [
          "Si crees haber encontrado una vulnerabilidad de seguridad en el proyecto (no un tema de privacidad de archivos de usuario — los archivos nunca salen del navegador por diseno), reportala de forma responsable mediante un advisory privado de GitHub o un issue con detalle publico minimo hasta resolverla.",
        ],
      },
      {
        title: "Sin soporte comercial",
        paragraphs: [
          "Camaleon se ofrece tal cual bajo licencia MIT. No ofrecemos soporte de pago, SLAs ni contratos empresariales en este momento.",
        ],
      },
    ],
    actions: [
      { label: "Reportar un bug", href: SITE_CONTACT_BUG_URL, external: true, primary: true },
      {
        label: "Sugerir una mejora",
        href: SITE_CONTACT_FEATURE_URL,
        external: true,
      },
      {
        label: "Vulnerabilidad de seguridad (privado)",
        href: SITE_SECURITY_ADVISORY_URL,
        external: true,
      },
      { label: "Ver codigo fuente", href: SITE_REPO_URL, external: true },
    ],
  },

  privacy: {
    title: "Politica de Privacidad",
    description:
      "Como Camaleon trata tus datos — spoiler: tus archivos permanecen en tu dispositivo.",
    lastUpdated: "Junio 2026",
    intro:
      "Esta politica explica que recopila, almacena y procesa Camaleon. Disenamos la app para que la transmutacion de imagenes no requiera enviarnos tus archivos.",
    sections: [
      {
        title: "Resumen",
        paragraphs: [
          "Tus imagenes se procesan localmente en tu navegador. No operamos un servidor que reciba, almacene o analice el contenido de tus archivos.",
        ],
      },
      {
        title: "Archivos y transmutacion",
        paragraphs: [
          "Cuando sueltas o seleccionas un archivo, se lee en memoria en tu navegador. La conversion corre en un Web Worker usando modulos WebAssembly descargados del mismo origen que la app. Los bytes de salida se te ofrecen como descarga. En ningun punto de este flujo se transmiten bytes de archivo a los operadores de Camaleon.",
        ],
      },
      {
        title: "Que no recopilamos",
        paragraphs: ["Respecto a tus imagenes y transmutaciones:"],
        listItems: [
          "No subimos archivos a nuestra infraestructura.",
          "No registramos nombres, tamanos ni resultados de conversion en un servidor que controlemos.",
          "No usamos APIs de conversion de terceros ni servicios en la nube de vision/OCR.",
        ],
      },
      {
        title: "Cookies y almacenamiento local",
        paragraphs: [
          "Camaleon usa un conjunto pequeno de mecanismos del navegador para recordar tus preferencias:",
        ],
        listItems: [
          "Cookie de idioma (`camaleon-locale`) — recuerda ingles o espanol.",
          "Cookie de tema (`camaleon-theme`) — recuerda modo oscuro o claro.",
          "localStorage — refleja idioma y tema; guarda preferencias de comunicacion y ajustes (`camaleon-user-settings-v1`, incluidos defaults opcionales de transmutacion, overrides de rendimiento, preferencias de avisos/preparacion, opt-in de cache sin conexion, claves de bienvenida y ultima version vista).",
          "Cache Storage (Service Worker) — cuando usas Camaleon en linea, la app puede almacenar localmente HTML, JavaScript, modulos WebAssembly y recursos estaticos para funcionar sin conexion. Es cache gestionada por tu navegador en tu dispositivo, no un archivo que recibimos. Puedes borrarla en Ajustes → Sin conexion y cache o en los controles de datos del sitio del navegador.",
          "Estos valores no se usan para rastreo ni publicidad — solo idioma, tema, preferencias en la app y operacion sin conexion opcional.",
        ],
      },
      {
        title: "Analitica y terceros",
        paragraphs: [
          "El codigo de la aplicacion Camaleon no incluye rastreadores de analitica (sin Google Analytics, sin pixeles publicitarios). Si accedes al sitio a traves de un proveedor de hosting o CDN, ese proveedor puede recopilar logs estandar de servidor web (IP, user agent, URL solicitada) bajo su propia politica de privacidad — no usamos esos logs para identificar usuarios individuales ni actividad de archivos.",
        ],
      },
      {
        title: "Metadatos en archivos convertidos",
        paragraphs: [
          "Camaleon aplica una politica StripAll de metadatos por defecto: EXIF, perfiles ICC y metadatos similares del contenedor de origen no se copian a las salidas. Esto reduce la fuga accidental de ubicacion o informacion del dispositivo en archivos compartidos. Es una caracteristica, no un error.",
        ],
      },
      {
        title: "Menores",
        paragraphs: [
          "Camaleon es una utilidad de proposito general. No recopilamos a sabiendas informacion personal de nadie, incluidos menores.",
        ],
      },
      {
        title: "Cambios",
        paragraphs: [
          "Podemos actualizar esta politica a medida que evolucione la app. La fecha de \"Ultima actualizacion\" en la parte superior cambiara cuando lo hagamos. El uso continuado tras una actualizacion implica aceptacion de la politica revisada.",
        ],
      },
      {
        title: "Contacto",
        paragraphs: [
          "Preguntas sobre privacidad: abre un issue en GitHub (ver pagina de Contacto).",
        ],
      },
    ],
  },

  terms: {
    title: "Terminos de Uso",
    description: "Terminos que rigen el uso de la aplicacion web Camaleon.",
    lastUpdated: "Junio 2026",
    intro:
      "Al usar Camaleon, aceptas estos terminos. Leelos por favor. Si no estas de acuerdo, no uses la aplicacion.",
    sections: [
      {
        title: "El servicio",
        paragraphs: [
          "Camaleon ofrece herramientas de conversion de formatos de imagen en el navegador. El software se ejecuta en tu dispositivo. Nosotros alojamos archivos estaticos (HTML, JavaScript, WebAssembly) que constituyen la aplicacion.",
        ],
      },
      {
        title: "Sin garantia",
        paragraphs: [
          'Camaleon se proporciona "tal cual" y "segun disponibilidad", sin garantia de ningun tipo, expresa o implicita, incluidas garantias de comerciabilidad, idoneidad para un proposito particular o no infraccion. No garantizamos que las conversiones sean libres de errores, sin perdida donde se indique con perdida, ni aptas para uso medico, legal o forense.',
        ],
      },
      {
        title: "Tu responsabilidad",
        paragraphs: ["Eres unicamente responsable de:"],
        listItems: [
          "Los archivos que eliges convertir y como usas los resultados.",
          "Verificar la calidad de salida antes de descartar originales.",
          "Cumplir con derechos de autor y leyes aplicables en tu jurisdiccion.",
          "Mantener copias de seguridad de archivos importantes.",
        ],
      },
      {
        title: "Uso aceptable",
        paragraphs: [
          "No debes usar Camaleon para procesar material sobre el que no tengas derecho, ni para fines ilegales. No monitoreamos el uso (no podemos — el procesamiento es local), pero el mal uso viola estos terminos.",
        ],
      },
      {
        title: "Propiedad intelectual",
        paragraphs: [
          "El nombre Camaleon, la marca y el codigo fuente se publican bajo licencia MIT salvo que el repositorio indique lo contrario. Las bibliotecas de terceros (crates de Rust, paquetes npm) conservan sus respectivas licencias.",
        ],
      },
      {
        title: "Limitacion de responsabilidad",
        paragraphs: [
          "En la maxima medida permitida por la ley, los autores y colaboradores de Camaleon no seran responsables de danos indirectos, incidentales, especiales, consecuentes o punitivos, ni de perdida de datos, beneficios o buena voluntad, derivados del uso de la aplicacion.",
        ],
      },
      {
        title: "Cambios en el servicio y los terminos",
        paragraphs: [
          "Podemos modificar, suspender o discontinuar funciones en cualquier momento. Podemos actualizar estos terminos; la fecha de \"Ultima actualizacion\" refleja la revision mas reciente. Los cambios materiales se anotaran en el changelog del repositorio.",
        ],
      },
      {
        title: "Ley aplicable",
        paragraphs: [
          "Estos terminos estan redactados en espanol e ingles. La interpretacion sigue principios generales de derecho contractual en la jurisdiccion del operador, salvo protecciones obligatorias al consumidor donde vivas.",
        ],
      },
    ],
  },
};
