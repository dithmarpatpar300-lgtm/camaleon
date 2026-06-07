import type { Dictionary } from "../types";

const es: Dictionary = {
  meta: {
    title: "Camaleon — Transmuta archivos en tu navegador",
    description: "Transmutación de archivos local y privada",
    tools: {
      "jpg-to-png": {
        title: "JPG a PNG — Camaleon",
        description: "Conversión sin pérdida de JPG a PNG. Preserva cada píxel — local y privada.",
      },
      "png-to-jpg": {
        title: "PNG a JPG — Camaleon",
        description: "Convierte PNG a JPG en tu navegador. Comprimido para web — local y privado.",
      },
    },
  },

  nav: {
    transmutations: "Transmutaciones",
    mainNavAria: "Navegación principal",
  },

  lang: {
    switchToEn: "Cambiar idioma a inglés",
    switchToEs: "Cambiar idioma a español",
  },

  theme: {
    switchToLight: "Cambiar a tema claro",
    switchToDark: "Cambiar a tema oscuro",
  },

  footer: {
    privacy: "100% local. Tus archivos nunca salen de tu dispositivo.",
    version: "Camaleon v{version} — MIT",
  },

  landing: {
    hero: {
      title: "Transmutar archivos",
      tagline: "La materia no se crea ni se destruye, solo se transmuta.",
    },
    privacy: {
      text: "100% local. Tus archivos nunca salen de tu dispositivo.",
    },
    tools: {
      available: "Transmutaciones disponibles",
      comingSoon: "Próximamente",
    },
  },

  badges: {
    lossless: "Sin pérdida",
    lossy: "Con pérdida",
    soon: "Pronto",
  },

  toolCard: {
    transmute: "Transmutar",
  },

  dropzone: {
    idleLabel: "Arrastra una imagen aquí, o haz clic para seleccionar",
    dragLabel: "Suelta para transmutar",
    processingLabel: "Transmutando...",
    ariaLabel: "Selecciona un archivo de imagen para transmutar",
    pageOverlayLabel: "Suelta para transmutar este archivo",
  },

  panel: {
    stagedFileSize: "{size}",
    changeFile: "Cambiar",
    transmuteButton: "Transmutar",
    initializing: "Inicializando...",
    processing: "Transmutando {fileName}...",
    processingFallback: "Transmutando...",
    size: "Tamaño",
    download: "Descargar",
    transmuteAnother: "Transmutar otro",
    errorTitle: "Transmutación fallida",
    adjustAndRetry: "Ajustar y reintentar",
    startOver: "Empezar de nuevo",
    engineReady: "Listo",
    engineInit: "Inicializando...",
    engineLabel: "Motor: {status}",
    fmtError: "Esta herramienta acepta: {formats}",
    notReadyError: "El motor aún está inicializando. Espera un momento e inténtalo de nuevo.",
    unexpectedError: "Ocurrió un error inesperado",
    previewAlt: "Vista previa de {fileName}",
    transparencyNotice: {
      title: "Esta imagen tiene transparencia",
      body: "Las áreas transparentes se aplanarán sobre {color} antes de codificar a JPEG. JPEG no soporta transparencia.",
    },
  },

  tools: {
    "jpg-to-png": {
      description: "Conversión sin pérdida — preserva cada píxel perfectamente.",
      fidelityHint:
        "El tamaño puede aumentar para fotos — PNG es un formato maestro/edición, no para comprimir.",
      options: {
        compression: {
          label: "Compresión PNG",
          hint: "Siempre sin pérdida — más compresión = archivo más pequeño + proceso más lento.",
          lowerLabel: "Más rápido",
          upperLabel: "Más pequeño",
          presets: {
            fast: "Rápido",
            balanced: "Balanceado",
            minimal: "Mínimo",
          },
        },
      },
    },
    "png-to-jpg": {
      description: "Comprimido para web — archivos más pequeños a calidad 85.",
      fidelityHint:
        "La pérdida de calidad es irreversible. La transparencia se aplana a blanco por defecto.",
      options: {
        quality: {
          label: "Calidad JPEG",
          hint: "Mayor calidad = archivo más grande. La pérdida de calidad siempre es irreversible.",
          lowerLabel: "Más liviano",
          upperLabel: "Más fiel",
          presets: {
            web: "Web",
            balanced: "Balanceado",
            high: "Alto",
          },
        },
        background: {
          label: "Color de fondo",
          hint: "Solo afecta imágenes con transparencia.",
          customAria: "Color de fondo personalizado",
          swatches: {
            white: "Blanco",
            black: "Negro",
            gray: "Gris",
          },
        },
      },
    },
    "webp-to-png": {
      description: "Convierte imágenes WebP modernas al formato PNG universal.",
    },
  },

  errors: {
    emptyInput: "El archivo está vacío. Selecciona una imagen válida.",
    tooLarge: "El archivo es demasiado grande. El tamaño máximo es 50 MB.",
    wrongFormat: "Formato no soportado. Usa {formats}.",
    corrupt: "El archivo parece estar dañado. Selecciona una imagen válida.",
    dimensionsTooLarge: "Las dimensiones de la imagen exceden el máximo permitido ({max} píxeles).",
    notAvailable: "Esta conversión aún no está disponible.",
    engineNotReady: "El motor de transmutación aún está iniciando. Inténtalo de nuevo.",
    generic: "La transmutación falló. Inténtalo de nuevo.",
  },

  toast: {
    downloadStarted: "Descarga iniciada",
    dismiss: "Cerrar",
  },

  colors: {
    white: "Blanco",
    black: "Negro",
    gray: "Gris",
  },
};

export default es;
