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
      "png-to-webp": {
        title: "PNG a WebP — Camaleon",
        description: "Convierte PNG a WebP sin perdida en tu navegador. Archivos mas pequenos para graficos web — local y privado.",
      },
      "jpg-to-webp": {
        title: "JPEG a WebP — Camaleon",
        description: "Convierte JPEG a WebP sin perdida en tu navegador. Local y privado — nota: el resultado puede ser mas grande.",
      },
      "gif-to-png": {
        title: "GIF a PNG — Camaleon",
        description: "Convierte GIF a PNG en tu navegador. Elige cualquier fotograma — exportacion raster sin perdida.",
      },
      "gif-to-jpg": {
        title: "GIF a JPG — Camaleon",
        description: "Convierte GIF a JPG en tu navegador. Elige cualquier fotograma — comprimido para web.",
      },
      "bmp-to-png": {
        title: "BMP a PNG — Camaleon",
        description: "Convierte BMP a PNG en tu navegador. Compresion sin perdida para bitmaps sin comprimir.",
      },
      "bmp-to-jpg": {
        title: "BMP a JPG — Camaleon",
        description: "Convierte BMP a JPG en tu navegador. Archivos mas pequenos para fotos y web.",
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
    about: "Acerca de",
    contact: "Contacto",
    privacyPolicy: "Privacidad",
    terms: "Términos",
    legalNav: "Legal",
    copyright: "© {year} {name} · {license}",
    version: "v{version}",
    github: "GitHub",
    shortcuts: "Atajos",
    shortcutsTitle: "Atajos de teclado",
    shortcutOpenPalette: "Abrir transmutaciones",
    shortcutClose: "Cerrar",
    engineReady: "Motor listo",
    engineInit: "Motor iniciando...",
  },

  legal: {
    backHome: "Volver al inicio",
    lastUpdated: "Última actualización: {date}",
  },

  landing: {
    hero: {
      title: "Transmutar archivos",
      tagline: "La materia no se crea ni se destruye, solo se transmuta.",
    },
    privacy: {
      text: "100% local. Tus archivos nunca salen de tu dispositivo.",
      learnMore: "Política de privacidad",
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

  prepare: {
    ariaLabel: "Preparando archivo: {phase}, {percent}% completado",
    progressLabel: "Progreso",
    switchToBar: "Cambiar a vista de barra",
    switchToRing: "Cambiar a vista de anillo",
    gifFrameProgress: "Fotograma {current}",
    phases: {
      reading: "Leyendo archivo…",
      engine: "Cargando motor de conversion…",
      analyze: "Analizando imagen…",
      analyzeGif: "Leyendo fotogramas de animacion…",
      analyzeSkippedLimit: "Analisis profundo omitido — archivo supera el limite del motor",
      finalize: "Preparando espacio de trabajo…",
      transmuting: "Transmutando…",
    },
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
    prepareFailed: "No se pudo preparar este archivo. Prueba otra imagen o un formato distinto.",
    transmuteUnavailable: "Archivo supera el limite del motor",
    largeFile: {
      title: "Archivo supera el limite del motor",
      body: "Este archivo es mayor que el limite de {limit}. Puedes ajustar opciones, pero la conversion esta deshabilitada hasta usar un archivo mas pequeno.",
    },
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
      estimateUnavailable: "Estimacion no disponible — el archivo supera el limite de 50 MB del motor.",
      cacheReady: "Listo para transmutar",
    },
    gifFrame: {
      title: "Fotograma de animacion",
      counter: "{current} / {total}",
      hint: "Desliza para vista previa instantanea — suelta para actualizar la estimacion de peso. Se aplican los metodos de disposicion GIF89a.",
      sliderAria: "Selector de fotograma GIF",
      previewAlt: "Vista previa del fotograma {index}",
      loadingMeta: "Leyendo fotogramas del GIF…",
      loadingPreview: "Generando vista previa…",
      noPreview: "Vista previa no disponible",
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
    "png-to-webp": {
      actionTitle: "Convertir a WebP sin Perdida",
      description: "WebP sin perdida — preserva cada pixel incluyendo transparencia.",
      fidelityHint: "El resultado es WebP VP8L sin perdida. Graficos y capturas suelen reducirse 20-30%; PNGs fotograficos pueden terminar mas grandes que el original.",
    },
    "jpg-to-webp": {
      actionTitle: "Convertir a WebP sin Perdida",
      description: "WebP sin perdida desde JPEG — cada pixel decodificado preservado en formato VP8L.",
      fidelityHint: "WebP sin perdida desde un JPEG ya comprimido suele producir un archivo mucho mas grande (a menudo 2x-10x). Ideal para archivado, no para reducir fotos.",
    },
    "gif-to-png": {
      actionTitle: "Convertir a PNG",
      description: "PNG sin perdida desde GIF — paleta y transparencia como pixels raster.",
      fidelityHint: "GIFs animados: elige cualquier fotograma con el deslizador. El PNG resultante puede ser mucho mas grande que el GIF.",
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
    "gif-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Convierte GIF a JPEG — archivos mas pequenos a la calidad elegida.",
      fidelityHint: "GIFs animados: elige cualquier fotograma con el deslizador. JPEG tiene perdida — la transparencia se aplana al fondo elegido.",
      options: {
        quality: { label: "Calidad JPEG", hint: "Mayor calidad = archivo mas grande. La perdida de calidad siempre es irreversible.", lowerLabel: "Mas liviano", upperLabel: "Mas fiel", presets: { web: "Web", balanced: "Balanceado", high: "Alto" } },
        background: { label: "Color de fondo", hint: "Solo afecta imagenes con transparencia.", customAria: "Color de fondo personalizado", swatches: { white: "Blanco", black: "Negro", gray: "Gris" } },
      },
    },
    "bmp-to-png": {
      actionTitle: "Convertir a PNG",
      description: "PNG sin perdida desde BMP — compresion DEFLATE para bitmaps sin comprimir.",
      fidelityHint: "BMP suele estar sin comprimir; PNG a menudo reduce el tamano. Bitmaps muy grandes pueden seguir produciendo PNGs grandes.",
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
    "bmp-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Convierte BMP a JPEG — archivos mucho mas pequenos para fotos y web.",
      fidelityHint: "JPEG tiene perdida — irreversible. La transparencia de BMP de 32 bits se aplana al fondo elegido.",
      options: {
        quality: { label: "Calidad JPEG", hint: "Mayor calidad = archivo mas grande. La perdida de calidad siempre es irreversible.", lowerLabel: "Mas liviano", upperLabel: "Mas fiel", presets: { web: "Web", balanced: "Balanceado", high: "Alto" } },
        background: { label: "Color de fondo", hint: "Solo afecta imagenes con transparencia.", customAria: "Color de fondo personalizado", swatches: { white: "Blanco", black: "Negro", gray: "Gris" } },
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
