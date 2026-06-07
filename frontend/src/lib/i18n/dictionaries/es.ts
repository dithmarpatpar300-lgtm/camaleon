import type { Dictionary } from "../types";

const es: Dictionary = {
  meta: {
    title: "Camaleon — Transmuta archivos en tu navegador",
    description: "Transmutacion de archivos local y privada",
    tools: {
      "jpg-to-png": {
        title: "JPG a PNG — Camaleon",
        description: "Conversion sin perdida de JPG a PNG. Preserva cada pixel — local y privada.",
      },
      "png-to-jpg": {
        title: "PNG a JPG — Camaleon",
        description: "Convierte PNG a JPG en tu navegador. Comprimido para web — local y privado.",
      },
      "webp-to-jpg": {
        title: "WebP a JPG — Camaleon",
        description: "Convierte WebP a JPG en tu navegador. Comprimido para web — local y privado.",
      },
      "webp-to-png": {
        title: "WebP a PNG — Camaleon",
        description: "Convierte WebP a PNG en tu navegador. Almacenamiento sin perdida — local y privado.",
      },
    },
  },

  nav: {
    transmutations: "Transmutaciones",
    mainNavAria: "Navegacion principal",
  },

  lang: {
    switchToEn: "Cambiar idioma a ingles",
    switchToEs: "Cambiar idioma a espanol",
  },

  theme: {
    switchToLight: "Cambiar a tema claro",
    switchToDark: "Cambiar a tema oscuro",
  },

  footer: {
    privacy: "100% local. Tus archivos nunca salen de tu dispositivo.",
    version: "v{version} . MIT",
    github: "GitHub",
    shortcuts: "Atajos",
    shortcutsTitle: "Atajos de teclado",
    shortcutOpenPalette: "Abrir transmutaciones",
    shortcutClose: "Cerrar",
    engineReady: "Motor listo",
    engineInit: "Motor iniciando...",
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
      comingSoon: "Proximamente",
    },
  },

  badges: {
    lossless: "Sin perdida",
    lossy: "Con perdida",
    soon: "Pronto",
  },

  toolCard: {
    transmute: "Transmutar",
  },

  dropzone: {
    idleLabel: "Arrastra una imagen aqui, o haz clic para seleccionar",
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
    size: "Tamano",
    result: {
      final: "Tamano final",
    },
    download: "Descargar",
    transmuteAnother: "Transmutar otro",
    errorTitle: "Transmutacion fallida",
    adjustAndRetry: "Ajustar y reintentar",
    startOver: "Empezar de nuevo",
    engineReady: "Listo",
    engineInit: "Inicializando...",
    engineLabel: "Motor: {status}",
    fmtError: "Esta herramienta acepta: {formats}",
    notReadyError: "El motor aun esta inicializando. Espera un momento e intentalo de nuevo.",
    unexpectedError: "Ocurrio un error inesperado",
    previewAlt: "Vista previa de {fileName}",
    transparencyNotice: {
      title: "Esta imagen tiene transparencia",
      bodyPrefix: "Las areas transparentes se aplanaran sobre ",
      bodySuffix: " antes de codificar a JPEG. JPEG no soporta transparencia.",
      pillAriaLabel: "Color de fondo: {color}. Clic para cambiar.",
      pickerTitle: "Aplanar sobre",
      pickerHint: "Solo afecta pixeles transparentes.",
    },
    metrics: {
      original: "Peso original",
      estimated: "Peso estimado",
      calculating: "Calculando",
      calculate: "Calcular estimacion",
      largeFileHint: "Archivo grande — toca para calcular el peso estimado.",
      cacheReady: "Listo para transmutar",
    },
  },

  tools: {
    "jpg-to-png": {
      actionTitle: "Preservar Calidad",
      description: "Conversion sin perdida — preserva cada pixel perfectamente.",
      fidelityHint: "El tamano puede aumentar para fotos — PNG es un formato maestro/edicion, no para comprimir.",
      options: {
        compression: {
          label: "Compresion PNG",
          hint: "Siempre sin perdida — mas compresion = archivo mas pequeno + proceso mas lento.",
          lowerLabel: "Mas rapido",
          upperLabel: "Mas pequeno",
          presets: { fast: "Rapido", balanced: "Balanceado", minimal: "Minimo" },
        },
      },
    },
    "png-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Comprimido para web — archivos mas pequenos a calidad 85.",
      fidelityHint: "La perdida de calidad es irreversible. La transparencia se aplana a blanco por defecto.",
      options: {
        quality: {
          label: "Calidad JPEG",
          hint: "Mayor calidad = archivo mas grande. La perdida de calidad siempre es irreversible.",
          lowerLabel: "Mas liviano",
          upperLabel: "Mas fiel",
          presets: { web: "Web", balanced: "Balanceado", high: "Alto" },
        },
        background: {
          label: "Color de fondo",
          hint: "Solo afecta imagenes con transparencia.",
          customAria: "Color de fondo personalizado",
          swatches: { white: "Blanco", black: "Negro", gray: "Gris" },
        },
      },
    },
    "webp-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Convierte WebP a JPEG — archivos mas pequenos a la calidad elegida.",
      fidelityHint: "JPEG tiene perdida — la perdida de calidad es irreversible. WebP probablemente ya estaba comprimido; la re-codificacion anade una segunda generacion con perdida. La transparencia se aplana al fondo elegido.",
      options: {
        quality: { label: "Calidad JPEG", hint: "Mayor calidad = archivo mas grande. La perdida de calidad siempre es irreversible.", lowerLabel: "Mas liviano", upperLabel: "Mas fiel", presets: { web: "Web", balanced: "Balanceado", high: "Alto" } },
        background: { label: "Color de fondo", hint: "Solo afecta imagenes con transparencia.", customAria: "Color de fondo personalizado", swatches: { white: "Blanco", black: "Negro", gray: "Gris" } },
      },
    },
    "webp-to-png": {
      actionTitle: "Convertir a PNG",
      description: "Almacenamiento sin perdida — preserva cada pixel del WebP original.",
      fidelityHint: "El PNG resultante sera mas grande que el WebP fuente — PNG almacena el raster sin comprimir.",
      options: {
        compression: {
          label: "Compresion PNG",
          hint: "Siempre sin perdida — mas compresion = archivo mas pequeno + proceso mas lento.",
          lowerLabel: "Mas rapido",
          upperLabel: "Mas pequeno",
          presets: { fast: "Rapido", balanced: "Balanceado", minimal: "Minimo" },
        },
      },
    },
  },

  errors: {
    emptyInput: "El archivo esta vacio. Selecciona una imagen valida.",
    tooLarge: "El archivo es demasiado grande. El tamano maximo es 50 MB.",
    wrongFormat: "Formato no soportado. Usa {formats}.",
    corrupt: "El archivo parece estar danado. Selecciona una imagen valida.",
    dimensionsTooLarge: "Las dimensiones de la imagen exceden el maximo permitido ({max} pixeles).",
    notAvailable: "Esta conversion aun no esta disponible.",
    engineNotReady: "El motor de transmutacion aun esta iniciando. Intentalo de nuevo.",
    generic: "La transmutacion fallo. Intentalo de nuevo.",
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

  commandPalette: {
    ariaLabel: "Paleta de comandos — navegar transmutaciones",
    triggerAriaLabel: "Abrir paleta de comandos",
    title: "Transmutaciones",
    categoryImage: "Imagen",
    categorySoon: "Proximamente",
    closeHint: "Esc para cerrar",
  },
};

export default es;
