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
      "tiff-to-png": {
        title: "TIFF a PNG — Camaleon",
        description: "Convierte TIFF a PNG en tu navegador. Exportacion sin perdida para escaneos, impresion y archivos.",
      },
      "tiff-to-jpg": {
        title: "TIFF a JPG — Camaleon",
        description: "Convierte TIFF a JPEG en tu navegador. Archivos mas pequenos para compartir TIFFs de archivo en web.",
      },
      "ico-to-png": {
        title: "ICO a PNG — Camaleon",
        description: "Extrae PNG de favicons ICO o CUR en tu navegador. Elige un tamano cuando el pack tiene mas de uno.",
      },
      "png-to-ico": {
        title: "PNG a ICO — Camaleon",
        description: "Crea un favicon Windows (.ico) desde PNG en tu navegador. Elige 16, 32, 48 o 256 px — solo reduccion.",
      },
      "tga-to-png": {
        title: "TGA a PNG — Camaleon",
        description: "Convierte texturas Targa y assets de juegos a PNG en tu navegador. Raw y RLE, con alpha preservado.",
      },
      "avif-to-png": {
        title: "AVIF a PNG — Camaleon",
        description: "Convierte AVIF a PNG en tu navegador. Exportacion raster universal desde imagenes AV1 modernas — local y privado.",
      },
      "avif-to-jpg": {
        title: "AVIF a JPG — Camaleon",
        description: "Convierte AVIF a JPEG en tu navegador. Comprimido para web — local y privado.",
      },
      "png-to-avif": {
        title: "PNG a AVIF — Camaleon",
        description: "Convierte PNG a AVIF en tu navegador. Compresion AV1 moderna — local y privado.",
      },
      "jpg-to-avif": {
        title: "JPEG a AVIF — Camaleon",
        description: "Convierte JPEG a AVIF en tu navegador. Formato de entrega moderno mas pequeno — local y privado.",
      },
      "svg-to-png": {
        title: "SVG a PNG — Camaleon",
        description: "Rasteriza SVG a PNG en tu navegador. Elige el tamano de salida — local y privado.",
      },
      "svg-to-jpg": {
        title: "SVG a JPG — Camaleon",
        description: "Rasteriza SVG a JPEG en tu navegador. Comprimido para web — local y privado.",
      },
      "png-compress": {
        title: "Comprimir PNG — Camaleon",
        description: "Re-codifica PNG con mayor compresión DEFLATE en tu navegador. Reduce tamaño con métricas.",
      },
      "jpg-compress": {
        title: "Comprimir JPEG — Camaleon",
        description: "Re-codifica JPEG con menor calidad en tu navegador. Compara el delta de tamaño.",
      },
      "png-resize": {
        title: "Redimensionar PNG — Camaleon",
        description: "Reduce PNG por porcentaje en tu navegador. Remuestreo Lanczos — local y privado.",
      },
      "jpg-resize": {
        title: "Redimensionar JPEG — Camaleon",
        description: "Reduce JPEG por porcentaje en tu navegador. Remuestreo Lanczos — local y privado.",
      },
    },
  },

  nav: {
    transmutations: "Transmutaciones",
    mainNavAria: "Navegacion principal",
    searchPlaceholder: "Buscar herramienta…",
    searchPlaceholderShort: "Buscar…",
    searchAriaLabel: "Buscar herramientas de transmutacion",
  },

  lang: {
    switchToEn: "Cambiar idioma a ingles",
    switchToEs: "Cambiar idioma a espanol",
  },

  theme: {
    switchToLight: "Cambiar a tema claro",
    switchToDark: "Cambiar a tema oscuro",
  },

  settings: {
    title: "Ajustes",
    subtitle: "Preferencias",
    close: "Cerrar ajustes",
    openAria: "Abrir ajustes",
    versionFootnote: "Camaleon v{version}",
    general: {
      section: "General",
      languageLabel: "Idioma",
      languageHint: "Textos de la interfaz y descripciones de herramientas.",
      langEn: "Ingles",
      langEs: "Espanol",
      themeLabel: "Tema",
      themeHint: "Apariencia clara u oscura en toda la app.",
      themeLight: "Claro",
      themeDark: "Oscuro",
    },
    tools: {
      section: "Valores predeterminados",
      jpegQualityLabel: "Calidad JPEG",
      jpegQualityHint: "Predeterminado para rutas con perdida hacia JPEG (PNG/WebP/GIF/BMP/TIFF, etc.).",
      pngCompressionLabel: "Compresion PNG",
      pngCompressionHint: "Esfuerzo predeterminado (1 rapido – 9 minimo) para rutas que generan PNG.",
      avifQualityLabel: "Calidad AVIF",
      avifQualityHint: "Predeterminado para herramientas PNG/JPEG → AVIF.",
      avifSpeedLabel: "Velocidad AVIF",
      avifSpeedHint: "Velocidad ravif predeterminada (1 lento – 10 rapido) al codificar AVIF.",
      backgroundLabel: "Fondo para alpha",
      backgroundHint: "Fondo predeterminado al aplanar transparencia hacia JPEG.",
      backgroundSwatches: {
        white: "Fondo blanco",
        black: "Fondo negro",
        gray: "Fondo gris",
      },
      resetAction: "Restablecer fabrica",
      resetDone: "Valores de transmutacion restablecidos.",
    },
    performance: {
      section: "Rendimiento",
      tierLabel: "Perfil de rendimiento",
      tierHint: "Anula la deteccion adaptativa. Auto usa senales del dispositivo.",
      tierAuto: "Auto",
      tierConservative: "Conservador",
      tierBalanced: "Equilibrado",
      tierAggressive: "Agresivo",
      cacheLabel: "Cache de resultados",
      cacheHint: "Reutiliza la salida codificada al mover sliders en rutas compatibles.",
      autoEstimateLabel: "Auto-estimar tamano",
      autoEstimateHint: "Estima el tamano de salida al cambiar opciones.",
      modeAuto: "Auto",
      modeOn: "Si",
      modeOff: "No",
      resetAction: "Restablecer adaptativo",
      resetDone: "Rendimiento restablecido a valores adaptativos.",
      scoreLabel: "Puntaje del dispositivo — {score}/100",
      scoreHint: "Tu dispositivo obtuvo {score}/100. Se recomienda usar el modo {recommendation} para la mejor experiencia.",
      scoreRecommendation: {
        conservative: "Conservador",
        conservativeReason: "Se detecto poca RAM, pocos nucleos o almacenamiento critico. El modo Conservador desactiva la cache de resultados y reduce el uso de recursos para evitar fallos.",
        balanced: "Equilibrado",
        balancedReason: "Tu dispositivo tiene recursos moderados. El modo Equilibrado activa la cache de resultados con limites y adapta la estimacion automatica.",
        aggressive: "Agresivo",
        aggressiveReason: "Buena cantidad de RAM y CPU disponible. El modo Agresivo activa cache completa, respuesta mas rapida y mayor limite de estimacion.",
      },
    },
    notices: {
      section: "Avisos y preparacion",
      densityLabel: "Detalle de avisos",
      densityHint: "Minimal oculta avisos informativos y de rendimiento rutinario; errores y advertencias de fidelidad importantes siguen visibles.",
      densityNormal: "Normal",
      densityMinimal: "Minimal",
      progressLabel: "Progreso de preparacion",
      progressHint: "Indicador en anillo o barra mientras se prepara el archivo.",
      progressRing: "Anillo",
      progressBar: "Barra",
      resetAction: "Restablecer valores",
      resetDone: "Preferencias de avisos y preparacion restablecidas.",
    },
    offline: {
      section: "Sin conexion y cache",
      description:
        "Camaleon guarda la app y los motores de conversion en tu navegador tras una visita en linea. La transmutacion siempre es local — el modo sin conexion solo afecta lo que se puede descargar de la red.",
      modeOnline: "En linea",
      modeOffline: "Trabajando sin conexion",
      modeOfflineActive: "Modo sin conexion (prueba)",
      modeOnlineDetail: "Red disponible. Las herramientas en cache funcionan; los motores nuevos se descargan bajo demanda.",
      modeOfflineDetail:
        "Trabajando sin conexion — paginas y motores en cache en este dispositivo. Reconecta cuando necesites actualizaciones.",
      modeOfflineActiveDetail:
        "Esta pestaña usa solo la app y motores en cache — las peticiones de red estan bloqueadas. Tu Wi‑Fi puede seguir conectado.",
      badgeSwActive: "Service worker",
      badgeSwPending: "SW pendiente",
      badgeNetworkUp: "Red activa",
      badgeNetworkDown: "Sin conexion activa",
      statusLabel: "Motores Wasm",
      enginesHint: "{pct}% de motores Wasm almacenados en este dispositivo.",
      shellLabel: "App shell",
      shellHint: "{cached}/{total} rutas en cache · {chunks} chunks estaticos.",
      shellReady: "Shell listo para recarga offline.",
      shellPartial: "Shell parcialmente en cache — restaura en linea.",
      shellNeedChunks:
        "Rutas en cache pero faltan bundles JS — pulsa Restaurar cache offline en linea.",
      shellMissing: "Shell no cacheado — restaura en linea.",
      offlineReadyLabel: "Preparacion offline",
      offlineReadyHint: "Minimo de cobertura shell y motores — ambos necesarios para offline fiable.",
      restoreCacheAction: "Restaurar cache offline",
      restoreCacheProgress: "Restaurando shell… {done}/{total}",
      restoreCacheDone: "App shell restaurado. Descarga motores si hace falta.",
      restoreCacheFailed: "No se pudo restaurar el shell. Permanece en linea e intentalo de nuevo.",
      clearDoneShellRestored: "Cache borrada — app shell restaurado.",
      clearDoneShellPending: "Cache borrada. Permanece en linea y pulsa Restaurar cache offline.",
      offlineModeBlockedShell: "App shell no cacheado. Restaura cache offline en linea primero.",
      offlineModeBlockedWasm: "Motores Wasm incompletos. Activa Descargar todas las herramientas primero.",
      statusOnline: "En linea — service worker activo.",
      statusOffline: "Sin conexion — usando app y motores en cache.",
      swPending: "Registrando service worker…",
      swUnsupported: "La cache sin conexion no esta disponible en este navegador.",
      storageLabel: "Tamano de cache Wasm",
      storageHint: "Cache Storage aproximada usada por motores de conversion.",
      cacheProgressLabel: "Cobertura de motores en cache",
      fullToolkitLabel: "Descargar todas las herramientas",
      fullToolkitHint:
        "Descarga solo motores Wasm (~10–17 MB), no el app shell. Usa Restaurar cache offline para rutas HTML y JS.",
      precacheProgress: "Descargando motores… {done}/{total}",
      precacheDone: "Todos los motores Wasm cacheados para conversion offline.",
      precacheFailed: "No se pudieron descargar todos los motores. Intentalo de nuevo en linea.",
      needOnline: "Conectate a internet para descargar los motores sin conexion.",
      clearAction: "Borrar cache sin conexion",
      clearDone: "Cache sin conexion borrada.",
      mobileWarning:
        "Los navegadores moviles pueden eliminar datos en cache por falta de espacio. Se recomienda escritorio para el kit completo.",
      offlineModeTitle: "Modo sin conexion",
      offlineModeHint:
        "Trabaja solo desde cache en esta pestaña. Requiere app shell y motores Wasm cacheados (usa Restaurar cache offline y Descargar todas las herramientas arriba).",
      offlineModeNote:
        "Mismo comportamiento cache-only que offline real tras deploy o npm run preview:cf. Herramientas aun no cacheadas fallaran hasta descargarlas en linea. Primera visita e incognito siempre necesitan red una vez.",
      offlineModeEnter: "Activar modo sin conexion",
      offlineModeExit: "Desactivar modo sin conexion",
      offlineModeOn: "Modo sin conexion activado en esta pestaña.",
      offlineModeOff: "Modo sin conexion desactivado.",
      alreadyOffline: "Ya estas sin conexion — no hace falta activar el modo offline.",
      fireTestTitle: "Lista de verificacion offline",
      fireTestHint:
        "Offline completo tras una configuracion en linea: visita Camaleon en linea (produccion o npm run preview:cf), opcionalmente descarga todas las herramientas, luego deten el servidor o usa modo avion — la app recarga desde cache. Incognito o un dispositivo que nunca visito la app no cargara hasta conectarse una vez. Cargar desde cache puede ser mas lento; es normal.",
    },
    risk: {
      section: "Advanced / Risk",
      intro:
        "El modo Risk desactiva los limites de pixeles, tamano de archivo y consentimiento de Camaleon para procesar archivos muy grandes a resolucion completa. Los limites del navegador y del hardware siguen aplicando.",
      warningTitle: "Antes de activar",
      warningOom: "Imagenes muy grandes pueden agotar la memoria del navegador y cerrar esta pestaña.",
      warningTab: "La pestaña puede congelarse o cerrarse sin guardar — el trabajo no es recuperable.",
      warningHardware: "Usalo solo en PCs, portatiles o telefonos potentes con RAM suficiente.",
      acknowledge: "Entiendo los riesgos y acepto la responsabilidad total de activar el modo Risk.",
      enableLabel: "Activar modo Risk",
      enableHint: "Requiere la casilla de arriba. Puedes desactivarlo en cualquier momento.",
      activeFootnote: "Modo Risk activo — los limites de Camaleon estan desactivados en este navegador.",
    },
    updates: {
      section: "Actualizaciones",
      autoDetectLabel: "Buscar actualizaciones automáticamente",
      autoDetectHint:
        "Consulta Live cada pocos minutos y al volver a esta pestaña. Desactívalo para revisar solo manualmente.",
      checkNowLabel: "Buscar ahora",
      checkNowHint: "Comprueba si hay versión nueva al instante — útil con la búsqueda automática desactivada.",
      checkNowAction: "Buscar ahora",
      checkNowRunning: "Buscando…",
      checkUpToDate: "Ya tienes la última versión.",
      checkFound: "Hay una actualización disponible — usa el aviso en la parte inferior de la pantalla.",
      checkOffline: "Conéctate a internet para buscar actualizaciones.",
      checkUnavailable: "La búsqueda de actualizaciones solo funciona en la app de producción.",
      changelogLabel: "Notas al actualizar",
      changelogHint: "Mostrar novedades cuando visites tras una nueva version.",
      whatsNewLabel: "Historial de versiones",
      whatsNewHint: "Consulta todas las versiones publicadas y sus mejoras.",
      whatsNewAction: "Abrir Novedades",
      welcomeLabel: "Mensaje de bienvenida",
      welcomeHint: "Vuelve a mostrar la intro de privacidad en la pagina de inicio.",
      welcomeAction: "Mostrar de nuevo",
      welcomeResetDone: "El mensaje de bienvenida aparecera en tu proxima visita al inicio.",
    },
    batchUniversal: {
      section: "Batch y Universal",
      selectionLabel: "Seleccion al cargar batch",
      selectionHint: "Al soltar varios archivos en una ruta batch, empieza con todas las filas marcadas o ninguna.",
      selectionAll: "Todas",
      selectionNone: "Ninguna",
      multiDropLabel: "Multi-archivo en Universal",
      multiDropHint: "Permite soltar varios archivos en el transmutador de inicio. Si esta desactivado, solo se usa el primero.",
      mixedPolicyLabel: "Formatos mixtos",
      mixedPolicyHint: "Cuando un drop mezcla formatos: mostrar el selector de cohortes o solo un aviso informativo.",
      mixedPolicyPicker: "Selector de cohortes",
      mixedPolicyHintOnly: "Solo aviso",
      downloadModeLabel: "Formato de descarga batch",
      downloadModeHint: "Tras un batch: guardar cada archivo por separado o en un ZIP.",
      downloadIndividual: "Archivos sueltos",
      downloadZip: "Archivo ZIP",
      resetAction: "Restablecer fabrica",
      resetDone: "Ajustes de Batch y Universal restaurados.",
    },
  },

  offline: {
    banner: "Estás sin conexión — las herramientas en caché siguen funcionando en este dispositivo.",
    bannerForced: "Modo sin conexion — solo cache en esta pestaña.",
    noticeOffline: "Sin conexión de red. Las herramientas en caché siguen funcionando en este dispositivo.",
    noticeWorkingOffline:
      "Trabajando sin conexion — paginas y herramientas en cache en este dispositivo. Reconecta cuando necesites actualizaciones.",
    noticeOfflineMode:
      "Modo sin conexion (prueba) — solo cache. Desactivalo cuando necesites actualizaciones.",
    noticeServerDown:
      "Trabajando sin conexion — paginas y herramientas en cache en este dispositivo. Reconecta cuando necesites actualizaciones.",
    noticeExitOfflineMode: "Desactivar modo sin conexion",
    uncachedTool:
      "Esta herramienta aún no está en caché. Conéctate a internet una vez para descargar su motor.",
    uncachedToolOpenOffline: "Abrir Offline y caché en Ajustes",
    fallbackTitle: "Estás sin conexión",
    fallbackBody:
      "Camaleon necesita conexión en la primera visita. Abre la app en línea y luego la conversión sin conexión funcionará para las herramientas en caché.",
    fallbackHome: "Volver al inicio",
    chunkMissTitle: "Pagina no disponible sin conexion",
    chunkMissBody:
      "Esta pagina no pudo cargarse porque Camaleon esta en modo offline y los recursos necesarios no estan en cache. Recarga la pagina o vuelve a una ruta almacenada.",
    chunkMissRetry: "Reintentar",
    chunkMissHome: "Ir al inicio",
    genericErrorBody:
      "Ocurrio un error inesperado. Recargar la pagina suele solucionarlo.",
  },

  offlinePromo: {
    title: "Convierte sin conexión",
    body: "Instala Camaleon en tu dispositivo y abre Ajustes → Offline y caché para descargar los motores de conversión. Tus archivos nunca salen del navegador.",
    install: "Instalar",
    later: "Recordarme más tarde",
  },

  appUpdate: {
    message: "La versión {version} está disponible",
    messageGeneric: "Hay una nueva versión de Camaleon disponible",
    update: "Actualizar",
    later: "Más tarde",
    updating: "Actualizando…",
  },

  connectivity: {
    online: "En linea",
    offline: "Sin conexion",
    workingOffline: "Trabajando sin conexion",
    offlineMode: "Modo sin conexion (prueba)",
    serverDown: "Trabajando sin conexion",
    statusTitle: "Conexion: {mode}",
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
    whatsNew: "Novedades",
  },

  releaseComms: {
    onboarding: {
      badge: "Bienvenida",
      title: "Tus archivos se quedan en tu dispositivo",
      subtitle:
        "Camaleon convierte imágenes enteramente en tu navegador — sin subidas, sin cuentas, sin esperar a un servidor.",
      gotIt: "Entendido",
      explore: "Explorar transmutaciones",
      about: "Acerca de Camaleon",
      technicalToggle: "Cómo funciona técnicamente",
      technical:
        "Rust compilado a WebAssembly corre dentro de un Web Worker dedicado. Las imágenes científicas grandes pueden reducirse en JavaScript antes de Wasm. Eliminamos metadatos por defecto, aplicamos límites honestos (40 megapíxeles, 150 MB) y reciclamos el worker al salir de una conversión para liberar memoria.",
      highlights: {
        privacy: {
          title: "Procesamiento 100% local",
          body: "No se sube nada. Tus imágenes nunca salen de esta pestaña.",
        },
        tools: {
          title: "21 herramientas de conversion",
          body: "PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, TGA, AVIF (codificar + decodificar) y SVG → PNG/JPEG — rutas con y sin perdida donde importa.",
        },
        limits: {
          title: "Límites honestos",
          body: "Te avisamos cuando un archivo es demasiado grande y ofrecemos opciones seguras de reducción en lugar de fallar.",
        },
        i18n: {
          title: "Inglés y español",
          body: "Interfaz completa en ambos idiomas, más temas claro y oscuro.",
        },
      },
    },
    changelog: {
      title: "Novedades en {version}",
      gotIt: "Entendido",
      remindLater: "Recordarme más tarde",
      viewAll: "Todas las actualizaciones",
    },
    whatsNew: {
      title: "Novedades",
      subtitle: "Historial de versiones",
      current: "Actual",
      close: "Cerrar",
    },
    tags: {
      feature: "Nuevo",
      fix: "Corrección",
      perf: "Rendimiento",
      security: "Seguridad",
    },
    entries: {
      v390: {
        title: "WebP Compress — Tier 4a.2a Matrix Expand",
        summary:
          "Nueva herramienta WebP compress extiende el ladder optimize mas alla de PNG/JPEG. Re-codificacion VP8L lossless con toggle de predictor transform y optimizacion de tipo de color. Avisos honestos para fuentes WebP lossy (expansion de entropia). WebP animado rechazado. Metadatos eliminados por politica de privacidad.",
        technical:
          "transmutador_optimize extendido con image webp feature + image-webp 0.2 (pure Rust VP8L). Nuevos exports: recompress_webp, recompress_webp_with_options, estimate_webp_recompress_*. core_utils: enum WebpFormat + probe_webp_format (parsing de chunk RIFF). Probe client-side en StagedWorkspace para contexto de notices. WebP animado detectado via WebPDecoder::has_animation() — rechazo duro. Optimization level Full: color_type_reduce + ambas configuraciones de predictor probadas, se elige la menor. OptionsControls: value labels para usePredictor + progressive. App v3.9.0 · motor v1.8.0.",
        highlights: {
          webpCompress: {
            title: "Herramienta WebP compress",
            body: "Re-codificacion same-format VP8L lossless con control de predictor transform y optimizacion de tipo de color (RGBA→RGB). Optimization level Full prueba ambas configuraciones de predictor y elige el output mas pequeno.",
          },
          honestyNotices: {
            title: "Avisos honestos para fuentes lossy",
            body: "Fuentes WebP lossy se aceptan con aviso amber sobre expansion de entropia (el tamano del archivo aumentara). Un deep-link sugiere WebP→JPG como alternativa para reduccion de tamano. Los metadatos siempre se eliminan por politica de privacidad.",
          },
        },
      },
      v352: {
        title: "Fix decoder Risk Mode y UX batch",
        summary:
          "El Modo Risk ahora ignora correctamente los límites internos de memoria del decodificador para que archivos grandes (200 MP, 50–80 MB) transmuten sin error. Flujo batch endurecido: los archivos con error se auto-desmarcan, aparece un botón 'Descargar de nuevo' para archivos ya convertidos incluso en estado mixto, y los pesos de archivo siempre son precisos durante el preparado y en el handoff Universal.",
        technical:
          "Los 8 crates transmutadores basados en ImageReader: reader.no_limits() cuando risk_mode_enabled() antes de .decode() — bypassea max_alloc de 512 MB del crate image. Batch: isTransmutableStatus excluye error; items en error auto-deseleccionados + checkbox deshabilitado; handleSelectAll omite error; BatchWorkspace modo normal gana botón onConvertAgain cuando selectedDoneCount > 0. FileHandoffPayload incluye originalSize; WeakMap lo preserva en la reconstrucción; BatchItem.displaySize usado en BatchFileRow. BatchPrepareProgress incluye fileSize para mostrar el peso por archivo durante el preparado. App v3.5.2 · motor 1.6.0.",
        highlights: {
          riskModeDecoder: {
            title: "Modo Risk respeta límites de memoria del decodificador",
            body: "Convertir imágenes grandes (200 MP, 50–80 MB) con Modo Risk activado ahora funciona — el decodificador ya no rechaza archivos que caben dentro del techo elevado de 500 MB del modo risk.",
          },
          batchErrorUx: {
            title: "Manejo inteligente de errores en batch",
            body: "Los archivos que fallan al preparar o transmutar ahora se auto-deseleccionan y sus checkboxes se deshabilitan. Los contadores de descarga ahora solo reflejan archivos válidos y accionables.",
          },
          batchDoneRedownload: {
            title: "Re-descargar archivos terminados en estado mixto",
            body: "Cuando algunos archivos están listos y otros fallaron, seleccionar los terminados ahora muestra un botón 'Descargar de nuevo' — sin esperar a que todos los archivos estén completos.",
          },
          prepareFileSize: {
            title: "Pesos correctos durante el preparado",
            body: "La pantalla de progreso del preparado batch ahora muestra el peso real en disco de cada archivo a medida que se procesa, no un valor fijo.",
          },
        },
      },
      v391: {
        title: "Smart Notice Recommendations",
        summary:
          "El Notice Rail ahora incluye pills de recomendacion accionables. Cuando una transmutacion es suboptima (inflacion lossy→lossless, perdida generacional JPEG, aplanado de alpha), botones sugieren herramientas alternativas con transferencia automatica de archivos — sin necesidad de volver a soltar el archivo. Cero upload, privacidad primero.",
        technical:
          "Componente ActionInlinePill embebido en el texto del notice via marcadores {action:0} en i18n (sigue el patron de TransparencyNotice/BackgroundColorPill). compute-recommendation-notices.ts: 5 reglas heuristicas (R1-R5) + helper alphaPreserveSlug. Navegacion cross-tool via stageFileHandoffFromFile() + router.push(). Deduplicacion: 6 reglas de supresion en pipeline compute-staged-notices. Max visible 2→3. 8 archivos TypeScript, 0 Rust/Wasm/deps. Solo frontend.",
        highlights: {
          inlineRecPills: {
            title: "Pills de recomendacion inline",
            body: "Las recomendaciones se integran directamente en el texto del notice — no debajo. Pills accionables con icono de flecha y fondo accent-subtle, siguiendo el mismo patron inline que BackgroundColorPill en TransparencyNotice.",
          },
          smartEngine: {
            title: "Motor inteligente de 5 reglas",
            body: "El motor detecta inflacion lossy→lossless, perdida generacional JPEG, aplanado de alpha en salidas JPEG, limites de compresion lossless, y aumentos de tamano. Cada regla sugiere la mejor herramienta alternativa con transferencia automatica de archivos via el sistema de handoff existente.",
          },
        },
      },
      v380: {
        title: "Compress Premium Fase C — optimizacion nativa de PNG",
        summary:
          "Un pipeline completo de optimizacion PNG sin perdida construido nativamente en Camaleon. Prueba 5 tipos de filtro, reduce el tipo de color (RGBA→RGB, RGB→Escala de grises), reduce la profundidad de bits (L8→L4→L2→L1), optimiza pixeles transparentes y ajusta la estrategia DEFLATE (Default, Filtered, HuffmanOnly) — todo en un solo pase de optimizacion. Se evaluan 36 candidatos y se elige el mas pequeno.",
        technical:
          "Pipeline nativo: color_type_reduce + optimize_alpha_pixels + filter trial (5 × image::PngEncoder) + encoder custom (5 filtros × 3 estrategias miniz_oxide) + bit depth trial (L1/L2/L4 × 5 filtros). Constructor PNG manual: IHDR + IDAT fragmentado + IEND + CRC32. CompressorOxide con control de estrategia. Motor v1.7.0. App v3.8.0.",
        highlights: {
          nativePngOpt: {
            title: "Optimizacion nativa sin perdida",
            body: "La prueba de filtros elige el mejor filtro PNG para tu imagen. La reduccion de tipo de color convierte RGBA→RGB y RGB→Escala de grises cuando es posible. Todos los cambios son sin perdida — los pixeles nunca cambian.",
          },
          deflateStrategy: {
            title: "Compresion DEFLATE mas inteligente",
            body: "Un codificador PNG personalizado prueba 3 estrategias de compresion por filtro: Default (equilibrada), Filtered (optimizada para scanlines PNG) y HuffmanOnly (la mas rapida). Gana la salida mas pequena.",
          },
          bitDepth: {
            title: "Reduccion automatica de profundidad de bits",
            body: "Las imagenes en escala de grises se detectan automaticamente y se codifican a la menor profundidad de bits posible: 1-bit para blanco y negro puro, 2-bit para 4 colores, 4-bit para 16 colores.",
          },
        },
      },
      v382: {
        title: "Compress Premium Fase E — Zopfli archival y JPEG progresivo",
        summary:
          "Compresion PNG extrema para archivo via Zopfli DEFLATE en opt_level=2 — 3-8% mas pequeno que estandar, pero minutos para imagenes grandes. Toggle JPEG progresivo para carga gradual en navegadores.",
        technical:
          "zopfli v0.8.3 Format::Zlib + Options::default(). try_zopfli_encode: 5 filtros × Zopfli DEFLATE. JPEG progresivo via jpeg-encoder set_progressive(true). App v3.8.2 / motor 1.7.0.",
        highlights: {
          zopfli: {
            title: "Compresion Zopfli para archivo",
            body: "Compresion extrema para almacenamiento en opt_level=2. Archivos 3-8% mas pequenos pero 10-100× mas lento — solo para almacenamiento a largo plazo.",
          },
          progressive: {
            title: "JPEG progresivo",
            body: "Toggle en Compresion JPEG: Baseline (estandar) vs Progressive (carga gradual en navegadores). Tamano de archivo similar.",
          },
        },
      },
      v381: {
        title: "Compress Premium Fase D — cuantizacion PNG con perdida",
        summary:
          "Cuantizacion de paleta con perdida via quantette (metodo Wu + dither FloydSteinberg). Reduce PNGs a 2–256 colores para archivos 60-80% mas pequenos. Codificacion PNG indexada via crate png. Advertencia obligatoria de irreversibilidad. Corregido bug colors: u8→u16 (256 truncado a 0). Descripciones de herramientas actualizadas.",
        technical:
          "quantette v0.6 Pipeline: Wu() + FloydSteinberg dither + PaletteSize + ImageRef + output_srgb8_indexed_image. PNG indexado via png v0.18: ColorType::Indexed, BitDepth::Eight, set_palette, write_image_data. Param colors: u8→u16 (wasm-bindgen truncaba 256→0). App v3.8.1 / motor 1.7.0.",
        highlights: {
          lossyQuant: {
            title: "Cuantizacion PNG con perdida",
            body: "Reduce PNGs fotograficos 60-80% usando cuantizacion de color Wu y dither FloydSteinberg. Configurable de 2 a 256 colores. Desactivado por defecto — advertencia obligatoria antes de usar.",
          },
          colorBugfix: {
            title: "Correccion de 256 colores",
            body: "El compresor con perdida ahora acepta correctamente 256 colores. El tipo `u8` truncaba 256 a 0 — 255 funcionaba pero 256 fallaba. Ahora usa `u16` para el rango completo 2-256.",
          },
        },
      },
      v371: {
        title: "Compress Premium Fase B — encoder JPEG & control de submuestreo",
        summary:
          "El codificador JPEG ha sido reemplazado por jpeg-encoder — una libreria Rust pura que produce archivos 5-15% mas pequenos a la misma calidad mediante tablas Huffman optimizadas. Nuevo control de submuestreo de croma para elegir entre maxima compresion (4:2:0), equilibrado (4:2:2) y maxima fidelidad de color (4:4:4) para texto y capturas.",
        technical:
          "image::JpegEncoder → jpeg-encoder v0.7.0. Tablas Huffman optimizadas activadas por defecto en todas las rutas JPEG (compress + resize). Nuevos exports Wasm: recompress_jpeg_with_options(quality, chroma_code), estimate_jpeg_recompress_with_options. Slider de submuestreo en jpg-compress: 0=4:2:0, 1=4:2:2, 2=4:4:4. Motor v1.7.0. App v3.7.1.",
        highlights: {
          jpegEncoderSwap: {
            title: "Codificacion JPEG mas inteligente",
            body: "El nuevo motor jpeg-encoder usa tablas Huffman optimizadas en cada codificacion, produciendo archivos notablemente mas pequenos al mismo nivel de calidad. Sin necesidad de configuracion.",
          },
          subsampling: {
            title: "Control de submuestreo de croma",
            body: "Nuevo slider en Compresion JPEG: 4:2:0 para maxima compresion (fotos), 4:2:2 para calidad equilibrada, o 4:4:4 para color perfecto en texto, logos y capturas de pantalla.",
          },
        },
      },
      v370: {
        title: "Compress Premium Fase A — honestidad, correccion de color type, valores por defecto",
        summary:
          "Nuevos avisos de honestidad para la perdida generacional JPEG, pistas de compresion rapida/lenta PNG, y advertencias de aumento de tamano. El motor encode_png ahora preserva el tipo de color de origen — sin mas inflacion innecesaria del canal alpha. Los valores por defecto del worker estan alineados con el registro de herramientas.",
        technical:
          "encode_png preserva DynamicImage color() — RGB se queda RGB, RGBA se queda RGBA. FidelityNoticeContext extendido con campos compression/quality. jpg-compress calidad por defecto 85. Worker fallback: PNG comp=9, JPEG quality=75. Motor v1.6.1. App v3.7.0.",
        highlights: {
          compressNotices: {
            title: "Avisos honestos de compresion",
            body: "La re-compresion JPEG ahora advierte sobre perdida generacional. PNG compress muestra las ventajas de velocidad vs tamano. Una nueva advertencia se activa cuando la salida seria mayor que la entrada.",
          },
          colorTypeFix: {
            title: "Preservacion inteligente del tipo de color",
            body: "Cuando comprimes un PNG RGB, la salida ahora es RGB — no RGBA con un canal alpha desperdiciado. Esto evita una inflacion innecesaria del 33% en imagenes opacas.",
          },
          defaults: {
            title: "Mejores valores por defecto",
            body: "Los valores del worker ahora coinciden con el registro de herramientas: la compresion PNG comienza en nivel 9 para archivos mas pequenos. La calidad JPEG por defecto es 85 con el preset balanced en 85.",
          },
        },
      },
      v361: {
        title: "Refactor del motor de actualizaciones y UX de onboarding",
        summary:
          "El sistema de actualizaciones fue reconstruido para una deteccion mas fiable — polling mas corto, maquina de estados centralizada. El boton 'Mostrar de nuevo' en Ajustes ahora muestra el panel de bienvenida inmediatamente en lugar de solo en la proxima visita.",
        technical:
          "lib/app-update/update-engine.ts: maquina de estados centralizada (idle→checking→available→applying). Polling: 5min→2min. Suscripcion SW integrada. AppUpdateProvider ~50 lineas. ReleaseCommsProvider: openOnboarding() + showOnboarding. App v3.6.1 · motor 1.6.0.",
        highlights: {
          updateEngine: {
            title: "Mejor deteccion de actualizaciones",
            body: "El sistema ahora consulta cada 2 minutos (antes 5) y usa una unica maquina de estados para coordinar las comprobaciones del Service Worker y del beacon de version.",
          },
          onboardingUx: {
            title: "Panel de bienvenida bajo demanda",
            body: "Hacer clic en 'Mostrar de nuevo' en Ajustes → Actualizaciones ahora cierra Ajustes y abre el panel de bienvenida inmediatamente — igual que 'Ver Novedades'.",
          },
        },
      },
      v360: {
        title: "Resize Premium — 5 filtros, escalado, control de calidad",
        summary:
          "Las herramientas de redimension obtuvieron una mejora mayor: elige entre 5 filtros de remuestreo (Nitido, Mas nitido, Suave, Pixel Perfecto, Anti-alias), escala imagenes hasta 200%, y controla la calidad JPEG directamente al redimensionar. Las dimensiones objetivo se actualizan en vivo al mover el slider.",
        technical:
          "transmutador_optimize: filter_from_code (0=Nearest..4=Lanczos3), resize_*_with_filter, resize_jpeg_with_filter_and_quality, estimate_resize_*_size. CatmullRom nuevo default. MAX_RESIZE_PERCENT 400 (u16). 5 filtros en FilterSelector UI con toggle avanzado. Avisos de honestidad al escalar, perdida generacional JPEG, advertencias especificas por filtro >200%. Estilo ambar para >100%. Descripciones de herramientas actualizadas. App v3.6.0 · motor 1.6.0.",
        highlights: {
          resizeFilters: {
            title: "5 filtros de remuestreo",
            body: "Elige Nitido (CatmullRom, recomendado), Mas nitido (Lanczos3), Suave (Triangle), Pixel Perfecto (Nearest) o Anti-alias (Gaussian) — cada uno con explicacion de cuando usarlo.",
          },
          resizeUpscale: {
            title: "Escalado con honestidad",
            body: "Redimensiona imagenes mas alla de su tamano original hasta 200% (o 400% con escalado avanzado). Avisos claros explican que no se crea nuevo detalle.",
          },
          resizeQuality: {
            title: "Calidad JPEG al redimensionar",
            body: "Al redimensionar JPEGs, ahora puedes controlar la calidad de compresion independientemente — reduciendo el tamano del archivo o preservando detalle segun necesites.",
          },
          resizeDimensions: {
            title: "Vista previa de dimensiones en vivo",
            body: "Las dimensiones en pixeles se actualizan en tiempo real al mover el slider, para que siempre sepas el tamano exacto de salida antes de transmutar.",
          },
        },
      },
      v354: {
        title: "Correccion de error de carga en modo offline",
        summary:
          "Corregido un fallo critico que mostraba pagina en blanco al navegar entre rutas en modo offline. Ahora aparecen pantallas de error amigables en lugar de paginas en blanco cuando una ruta no esta en cache, y el comportamiento del cache es mas fiable durante sesiones largas.",
        technical:
          "app/error.tsx + app/global-error.tsx capturan ChunkLoadError y Failed to fetch. sw.ts: isAlreadyCachedInSw evita duplicacion en SHELL_CACHE_NAME. tryForceOfflineFallbackInSw mejorado con coincidencia de pathname sin query params. trimShellCache limita SHELL_CACHE_NAME a 75 entradas en put + activate. Listener force-offline sirve /~offline para documentos antes del 503. App v3.5.4 · motor 1.6.0.",
        highlights: {
          chunkErrorBoundary: {
            title: "Pantallas de error amigables offline",
            body: "Cuando una pagina no esta en cache para uso offline, ahora ves un mensaje claro con botones 'Reintentar' e 'Ir al inicio' — en lugar de una pagina blanca.",
          },
          cacheResilience: {
            title: "Cache offline mas fiable",
            body: "El cache ya no duplica archivos que ya estan almacenados, y las entradas antiguas se limpian automaticamente — manteniendo el modo offline estable en sesiones de navegacion largas.",
          },
        },
      },
      v353: {
        title: "Resiliencia en dispositivos basicos",
        summary:
          "Camaleon ahora adapta como carga su motor segun tu dispositivo. En telefonos con poca RAM o almacenamiento critico, usa un metodo de carga mas seguro para evitar fallos. Un nuevo puntaje en Ajustes → Rendimiento muestra como se clasifica tu dispositivo y explica el modo recomendado.",
        technical:
          "device-capability.ts: computeWasmLoadHints, computeStoragePressure, DeviceCapabilityProfile. load-glue.ts: initWasmModule con estrategias streaming/buffered/buffered-with-retry. WorkerRequest.engineLoadHints propagado desde useFileMetrics via sendMessage. navigator.storage.estimate() puntuado en computeResourceProfile. PerformanceSettingsSection: barra de puntaje + recomendacion adaptativa. Las 13 funciones init*Wasm migradas a initWasmModule. App v3.5.3 · motor 1.6.0.",
        highlights: {
          adaptiveWasm: {
            title: "Carga inteligente del motor en telefonos basicos",
            body: "Si tu dispositivo tiene poca RAM, Camaleon obtiene el motor como un buffer completo en lugar de streaming — evitando fallos causados por datos parciales en conexiones lentas o inestables.",
          },
          deviceScore: {
            title: "Puntaje del dispositivo en Ajustes",
            body: "Abre Ajustes → Rendimiento para ver el puntaje de tu dispositivo (0–100) y una recomendacion — Conservador, Equilibrado o Agresivo — con una explicacion de por que fue elegido.",
          },
          storagePressure: {
            title: "Deteccion de presion de almacenamiento",
            body: "Camaleon ahora puede detectar si el almacenamiento de tu navegador esta casi lleno y ajusta su comportamiento automaticamente — toda la deteccion ocurre en tu dispositivo, nada se envia a ningun lado.",
          },
        },
      },
      v351: {
        title: "Fix arrastre batch y UX de descarga",
        summary:
          "Arrastrar varios archivos desde el escritorio a un transmutador dedicado (p. ej. PNG→JPEG) ahora carga todos en modo batch — igual que el selector de archivos y el Transmutador Universal. El workspace batch también sugiere el formato de descarga opuesto con enlace directo a Ajustes.",
        technical:
          "stopPropagation en drag/drop del dropzone de herramienta; PageDropOverlay pointer-events-none; usePageFileDrop omite .transmute-dropzone; getDroppedFiles() vía dataTransfer.items. Tip de descarga batch + openSettings({ focus: batch-download }) pulso en fila. useBatchDownloadMode pref reactiva. SPEC §7.17. App v3.5.1 · motor 1.6.0.",
        highlights: {
          toolRouteDrop: {
            title: "Arrastre multiarchivo en rutas de herramienta",
            body: "Arrastra varias imágenes desde el Explorador de Windows a PNG→JPEG (y otras rutas batch) — todos los archivos entran en modo batch en lugar de solo el primero.",
          },
          batchDownloadUx: {
            title: "Pistas de descarga batch más claras",
            body: "Con varios archivos, el workspace recomienda ZIP o descargas individuales y enlaza directo a la fila de formato de descarga en Ajustes.",
          },
        },
      },
      v350: {
        title: "Fiabilidad offline y conectividad",
        summary:
          "El modo offline PWA es estable en producción: preparación honesta shell + Wasm, actualizaciones fiables y conectividad que funciona en localhost, túnel y pérdida real de red — sin falsos offline ni logo ausente en el header.",
        technical:
          "Doble preparación shellReady+wasmReady. reprecacheAppShell + ShellCacheBootstrap. /api/health + sondas origin-reachability con histéresis. SW cache-first brand/static antes de Serwist. CamaleonMark img nativo. Stack unificado de avisos inferiores en móvil. SPEC §7.15–§7.16. App v3.5.0 · motor 1.6.0.",
        highlights: {
          offlineStable: {
            title: "Base offline estable",
            body: "Borrar cache, actualizar la app o recargar sin red — el shell y los motores se recuperan por separado y el modo sin conexión espera a que ambos estén listos.",
          },
          connectivity: {
            title: "Conectividad honesta",
            body: "Sondas de salud con histéresis — sin falso offline cuando el servidor está activo en túnel o localhost; la pérdida real de red se detecta igual de rápido.",
          },
          brandOffline: {
            title: "Logo persiste navegando offline",
            body: "La marca Camaleon permanece en el header al cambiar de ruta sin red — igual en móvil y escritorio.",
          },
          mobileNotices: {
            title: "Avisos móviles apilados",
            body: "Banner offline, promo de instalación, actualización y toasts comparten un dock inferior — sin solapamiento en pantallas pequeñas.",
          },
        },
      },
      v341: {
        title: "Fix persistencia offline",
        summary:
          "El modo offline PWA vuelve a ser fiable tras borrar cache, actualizar la app o recargar sin red. Ajustes muestra shell y motores Wasm por separado.",
        technical:
          "Doble preparacion: shellReady + wasmReady. applyAppUpdate ya no purga precache activo post-activate. reprecacheAppShell + ShellCacheBootstrap. Force-offline sirve /~offline antes de 503. SPEC §7.15. App v3.4.1 · engine 1.6.0.",
        highlights: {
          shellReadiness: {
            title: "Preparacion offline honesta",
            body: "Ajustes muestra rutas del app shell y motores Wasm por separado. Modo sin conexion bloqueado hasta que ambas capas esten en cache.",
          },
          updatePurgeFix: {
            title: "Actualizar ya no borra el shell",
            body: "Update now conserva el precache del nuevo service worker. Reprecache del shell automatico tras recarga cuando haga falta.",
          },
          forceOffline: {
            title: "Force-offline alineado con Serwist",
            body: "Modo sin conexion intenta paginas y chunks en cache antes del 503 — menos ChunkLoadError al recargar.",
          },
        },
      },
      v340: {
        title: "Refresh de páginas legales",
        summary:
          "About, Contact, Privacy y Terms fueron reescritas por completo para Camaleon v3.4. Un aviso dedicado te pide revisar Privacy y Terms — separado de las notas de funciones.",
        technical:
          "lib/legal modelo de bloques (paragraph, list, callout, table). LegalSubnav + LegalToc. Layout tipográfico minimal. camaleon-legal-revision-ack. Modal LegalRefreshNotice. SPEC §7.14. App v3.4.0 · motor 1.6.0.",
        highlights: {
          legalContent: {
            title: "Contenido legal alineado a v3.4",
            body: "25 herramientas, PWA/offline, storage unificado, batch, optimize y modo riesgo están documentados en Privacy y Terms — no solo en About.",
          },
          legalNotice: {
            title: "Aviso legal dedicado",
            body: "En la primera visita tras la actualización, un modal pide revisar Privacy y Terms. La confirmación se guarda localmente hasta la próxima revisión legal.",
          },
          legalDesign: {
            title: "Diseño minimal refinado",
            body: "Las páginas legales usan una columna tipográfica limpia — subnav, índice, callouts y tablas de claves — coherente con Ajustes y ToolBrowser.",
          },
        },
      },
      v334: {
        title: "Ajustes + toasts, seed de storage y persistencia de carriles",
        summary:
          "Ajustes y toasts inferiores conviven — las acciones del toast siguen siendo clicables. Las preferencias se guardan con valores de fábrica en la primera visita; el carril Convertir/Optimizar no parpadea al recargar.",
        technical:
          "Portal modal-floating-notices en SurfaceDialog (subárbol inert del dialog). lib/storage: factory-defaults, seed-storage, prefs tools en user-settings.tools. Cookies SSR + bootstrap para carril. Dock offline móvil. data-scroll-behavior en html. App v3.3.4 · motor 1.6.0.",
        highlights: {
          settingsToastCoexist: {
            title: "Ajustes y toasts a la vez",
            body: "Abre Ajustes con un toast de actualización u offline visible — pulsa sus botones sin cerrar el panel. El aviso offline superior queda detrás del drawer.",
          },
          clientStorage: {
            title: "Preferencias desde el primer día",
            body: "Borra storage y recarga — cada valor de fábrica se guarda al instante en camaleon-user-settings-v1, no solo cuando cambias algo.",
          },
          lanePersistence: {
            title: "El carril se mantiene al recargar",
            body: "Elige Optimizar y refresca — el control muestra Optimizar desde el primer frame, sin flash breve a Convertir.",
          },
          mobileOfflineDock: {
            title: "Dock offline en móvil",
            body: "En pantallas pequeñas el banner offline va sobre los toasts inferiores, lejos de la barra sticky del navegador.",
          },
        },
      },
      v333: {
        title: "Carriles de herramientas, avisos móvil y deep-links en Ajustes",
        summary:
          "Convertir y Optimizar tienen carriles separados en el navegador y la paleta de comandos. Los avisos offline superiores ya no chocan con la barra sticky en móvil.",
        technical:
          "useTopFloatingNoticeOffset + --layout-top-notice-height; avisos superiores a ancho completo en móvil. tool-lanes.ts; carriles en ToolBrowser + CommandPalette; alias optimize en filter-tools. SettingsFocusLink; UncachedToolNotice → openSettings({ focus: offline }). App v3.3.3 · motor 1.6.0.",
        highlights: {
          toolLanes: {
            title: "Carriles Convertir vs Optimizar",
            body: "Explora 21 herramientas de conversión y 4 de optimización por separado — mismos chips en la paleta. La búsqueda encuentra compress y resize por palabra clave.",
          },
          mobileNotices: {
            title: "Avisos móvil sin solaparse",
            body: "Los toasts offline y de servidor caído van a ancho completo bajo la cabecera; la barra de transmutaciones se fija debajo en lugar de chocar al hacer scroll.",
          },
          settingsFocusUncached: {
            title: "Motor sin caché → Ajustes Offline",
            body: "Si el Wasm de una herramienta no está en caché, pulsa Abrir Offline y caché — Ajustes baja a la sección de descarga con el mismo pulse de foco.",
          },
        },
      },
      v332: {
        title: "Modo offline — descúbrelo desde inicio",
        summary:
          "Un aviso discreto en la página principal explica cómo instalar Camaleon y guardar los motores para usar sin conexión.",
        technical:
          "OfflineInstallPromoNotice; useOfflineInstallPromo; offline-promo-storage (snooze 7 días); host FloatingNotices bottom-left; openSettings({ focus: offline }). App v3.3.2 · motor 1.6.0.",
        highlights: {
          offlinePromo: {
            title: "Convierte sin conexión",
            body: "Nuevo aviso en inicio: instala Camaleon y descarga motores en Ajustes → Offline y caché. Se puede cerrar — te recuerda en una semana si lo pospones.",
          },
          settingsFocusOffline: {
            title: "Un toque a Ajustes Offline",
            body: "Pulsa Instalar en el aviso — Ajustes se abre en Offline y caché con el mismo pulse de foco que los hints de Risk mode.",
          },
        },
      },
      v331: {
        title: "Flujo Risk unlock y deep-link en Ajustes",
        summary:
          "Al activar Risk mode tras un bloqueo por limite, el archivo se conserva y puedes continuar — sin callejon sin salida. Los avisos de limite abren Ajustes en la seccion correcta.",
        technical:
          "risk-unlock.ts + RiskUnlockProceedPanel; TransmutationPanel hardLimitPendingFile; StagedWorkspace + BatchTransmutationPanel re-prepare al Continuar. settings-focus.ts; openSettings({ focus }); LimitUnlockHint → foco risk; CSS settingsSectionFocusPulse. Vitest risk-unlock + settings-focus. App v3.3.1 · motor 1.6.0.",
        highlights: {
          riskUnlock: {
            title: "Modo Risk — continuar donde lo dejaste",
            body: "Superaste el limite de tamano? Activa Risk en Ajustes y Camaleon conserva tu archivo — confirma con Continuar en lugar de empezar de cero. Funciona en herramientas sueltas, handoff Universal y batch.",
          },
          settingsFocus: {
            title: "Ajustes va a la seccion correcta",
            body: "“Abrir Ajustes” desde los avisos de limite lleva a Avanzado / Risk y resalta la seccion para encontrar el toggle mas rapido.",
          },
        },
      },
      v330: {
        title: "Optimización de imagen activa e iconos PWA corregidos",
        summary:
          "Las cuatro herramientas de comprimir y redimensionar ya funcionan de punta a punta en el navegador, y los iconos de instalación usan la marca Camaleon real a las dimensiones correctas.",
        technical:
          "Tier 4a.0: warmup-wasm transmutador_optimize; wasm-modules.d.ts; alias JPEG en source-image-meta; Vitest warmup/format-alias. PWA: generate-brand-assets → icon-192/512/maskable; manifest maskable separado. App v3.3.0 · motor 1.6.0.",
        highlights: {
          optimizeActivation: {
            title: "Comprimir y redimensionar — ya funcionan",
            body: "Las herramientas PNG/JPEG compress y resize completan el flujo prepare → estimate → transmute. Misma privacidad: todo en tu dispositivo.",
          },
          pwaIcons: {
            title: "Iconos de instalación actualizados",
            body: "Los iconos del manifiesto PWA se regeneran desde la marca Lamina 3C — dimensiones correctas, sin avisos en DevTools.",
          },
        },
      },
      v329: {
        title: "Cohortes universales, batch pulido y optimización",
        summary:
          "Los drops de formatos mixtos muestran un selector de cohortes en inicio, el batch gana ajustes de descarga ZIP y re-descargas más inteligentes, y cuatro herramientas nuevas de comprimir/redimensionar en el navegador.",
        technical:
          "Tier 3.6.1 Slice C (UniversalCohortPicker, cohort-session); prefs S7 batch (multi-drop, política mixta, modo descarga); Tier 3.6.2 (batch-zip-export, pickers GIF/TIFF/ICO por fila); Tier 4a transmutador_optimize + 4 tools; entrega desde result almacenado + cancelación de runs; cancel batch contextual (handoff → inicio). App v3.2.9 · motor 1.6.0.",
        highlights: {
          universalCohorts: {
            title: "Selector de cohortes mixtas",
            body: "Suelta PNG + SVG en inicio — cada grupo de formato tiene su tarjeta. Elige salida por grupo; las cohortes restantes permanecen hasta el siguiente handoff.",
          },
          batchPolish: {
            title: "Descargas batch más inteligentes",
            body: "Elige archivos sueltos o ZIP en Ajustes. Re-descargar usa resultados en caché al instante si las opciones no cambiaron. Cancelar desde handoff de inicio vuelve a la página principal.",
          },
          optimizeTools: {
            title: "Comprimir y redimensionar",
            body: "Cuatro herramientas nuevas — comprimir PNG/JPEG y redimensionar — 100% en el navegador con el motor optimize. Misma privacidad, sin subida.",
          },
          settingsS7: {
            title: "Ajustes Batch y Universal",
            body: "Toggle multi-archivo, política de formatos mixtos (selector vs aviso) y formato de descarga batch — todo en Ajustes → Batch y Universal.",
          },
        },
      },
      v328: {
        title: "Seleccion batch y toasts adaptativos",
        summary:
          "Elige en Ajustes si las filas batch empiezan marcadas o vacias, y los toasts crecen con mensajes largos sin recortarse abajo.",
        technical:
          "batch-universal-prefs.ts (defaultSelection all|none); BatchUniversalSettingsSection S7; batchItemsFromFiles lee pref; viewport toast sin tope para ≤3 items, line-clamp-3 en mensajes. App v3.2.8.",
        highlights: {
          batchSelectionDefault: {
            title: "Seleccion al cargar batch",
            body: "Ajustes → Batch y Universal — empieza con todos los archivos marcados o ninguno al soltar un batch multi-archivo.",
          },
          adaptiveToasts: {
            title: "Toasts mas inteligentes",
            body: "Mensajes largos ocupan hasta tres lineas sin borde inferior cortado. El peek en cola sigue desde el cuarto toast.",
          },
        },
      },
      v327: {
        title: "Toasts y pulido de UI",
        summary:
          "Sistema unificado de toasts para feedback en toda la app, avisos flotantes más inteligentes y correcciones del blur del modal y apilado de toasts con Ajustes abierto.",
        technical:
          "ToastProvider + ToastViewport (peek con máscara desde el 4.º toast), FloatingNoticesRoot (promote popover solo con dialog abierto); AppUpdateProvider/AppUpdateNotice (v3.2.5); updates-prefs auto-detect + Buscar ahora (v3.2.6); SurfaceDialog demote restaura blur ::backdrop en preview:cf. App v3.2.7.",
        highlights: {
          toastSystem: {
            title: "Toasts centralizados",
            body: "Las acciones de Ajustes y comprobaciones de actualización muestran toasts claros abajo al centro — en cola, auto-dismiss, con peek sutil cuando se apilan cuatro o más.",
          },
          floatingNotices: {
            title: "Pila de avisos",
            body: "El pill de actualización y los toasts comparten una pila flotante sin solaparse. Los toasts suben sobre paneles abiertos cuando hace falta.",
          },
          modalPolish: {
            title: "Blur del modal",
            body: "Ajustes y otros diálogos mantienen el backdrop difuminado en builds de producción — mismo aspecto que en dev local.",
          },
        },
      },
      v326: {
        title: "Detección de actualizaciones en Ajustes",
        summary:
          "Elige si Camaleon busca versiones nuevas en Live automáticamente, o ejecuta una comprobación manual desde Ajustes cuando prefieras.",
        technical:
          "updates-prefs.ts (autoDetectUpdates en camaleon-user-settings-v1.updates); AppUpdateProvider respeta pref — sin poll interval/visibility/online si off; listener pasivo SW waiting; UpdatesSettingsSection con Buscar ahora + toasts. App v3.2.6.",
        highlights: {
          autoDetectToggle: {
            title: "Comprobaciones automáticas",
            body: "Activa o desactiva el polling en segundo plano en Ajustes → Actualizaciones. Por defecto activo — con off solo manual.",
          },
          checkNow: {
            title: "Buscar ahora",
            body: "Ejecuta una comprobación inmediata en Live desde Ajustes. Toast claro si estás al día o si hay pill de actualización.",
          },
          productionOnly: {
            title: "Builds de producción",
            body: "Las comprobaciones requieren la PWA desplegada con service worker — en dev local verás un aviso amigable.",
          },
        },
      },
      v325: {
        title: "Actualizaciones inteligentes",
        summary:
          "Camaleon detecta nuevas versiones en Live en segundo plano y las aplica con un refresco profundo — sin pestañas obsoletas ni recargas superficiales.",
        technical:
          "Módulo app-update: beacon /version.json (no-store), poll SW cada 5 min + visibility/online; skipWaiting + espera controllerchange; purge shell cache (Wasm preservado); pill AppUpdateNotice reemplaza banner SwUpdatePrompt. App v3.2.5.",
        highlights: {
          deepUpdate: {
            title: "Refresco profundo",
            body: "Actualizar espera al nuevo service worker, limpia cachés obsoletas de la app y recarga con cache-bust — obtienes la versión real más reciente.",
          },
          liveDetection: {
            title: "Detecta releases en Live",
            body: "Las pestañas abiertas consultan actualizaciones cada pocos minutos y al volver — no necesitas F5 manual para saber que hay versión nueva.",
          },
          minimalNotice: {
            title: "Aviso minimalista",
            body: "Un pill flotante compacto reemplaza el banner superior anterior. Actualiza ahora o posponer 24 horas.",
          },
        },
      },
      v324: {
        title: "Multi-archivo en el transmutador universal",
        summary:
          "Suelta varias imágenes del mismo formato en inicio — elige la salida una vez y conviértelas juntas en la herramienta correcta.",
        technical:
          "Tier 3.6.1 Slice A+B: buildCohorts, batch-handoff (?batch=), resolveUniversalDrop, UniversalTransmutator multi-drop homogéneo; consumer batch en TransmutationPanel. UI cohortes mixtas pendiente. App v3.2.4.",
        highlights: {
          universalBatch: {
            title: "Muchos archivos, un formato",
            body: "En el transmutador universal, suelta varios JPG, PNG u otros archivos compatibles del mismo tipo. Elige la salida batch — abrimos la herramienta con todos cargados.",
          },
          batchHandoff: {
            title: "Handoff fluido",
            body: "Tus archivos viajan en la pestaña a la ruta del transmutador — misma privacidad que archivo único, sin subida. El workspace batch queda listo para preparar y convertir.",
          },
          mixedHint: {
            title: "Formatos mixtos",
            body: "Si sueltas formatos distintos juntos, verás un aviso claro hoy. La selección batch de formatos mixtos llegará pronto.",
          },
        },
      },
      v323: {
        title: "Pulido batch multi-archivo",
        summary:
          "Suelta varias imágenes en rutas compatibles, ajusta una vez y convierte con una experiencia batch más fluida.",
        technical:
          "Exit gate Tier 3.6.0: 14 slugs raster; FilePrepareGate inicial en primer drop; prepare inline después; preparedOptions + hints; Convert again encode-only; Download again desde caché; fix commitItems sync. App v3.2.3.",
        highlights: {
          multiFileRoutes: {
            title: "Multi-archivo en rutas de herramienta",
            body: "Arrastra varios archivos en JPG→PNG y otras 13 herramientas raster. Opciones compartidas, selección por fila, una descarga por archivo — en tu navegador, de uno en uno.",
          },
          batchUx: {
            title: "UX batch pulida",
            body: "La primera subida muestra la pantalla de prepare; después la lista sigue visible. Cambia compresión y Volver a convertir sin releer. Descargar de nuevo si la caché coincide.",
          },
          syncFix: {
            title: "Fix botón Transmutar",
            body: "Las filas en Listo coinciden con lo que usa Transmutar — sin toast “selecciona un archivo listo” cuando el botón ya muestra un conteo.",
          },
        },
      },
      v322: {
        title: "Pulido UX batch — prepare inline y re-codificar sin releer",
        summary:
          "El batch ya no ocupa toda la pantalla tras el primer prepare. Cambia la compresión y vuelve a convertir sin releer tus imágenes.",
        technical:
          "Panel batch: FilePrepareGate inicial en primer drop; prepare inline en lista después; snapshot preparedOptions + hints; Convert again encode-only en rutas raster; bytes/prepared post-Done hasta Cancelar. App v3.2.2.",
        highlights: {
          inlinePrepare: {
            title: "Prepare tras el primer drop",
            body: "La primera subida usa la pantalla de prepare como archivo único. Después, Preparando… en la lista — opciones y filas visibles.",
          },
          sliderNoReprepare: {
            title: "Slider = solo re-codificar",
            body: "En rutas raster batch, mover compresión o calidad no relee archivos. Los hints muestran ajuste validado vs actual.",
          },
          convertAgain: {
            title: "Convert again más inteligente",
            body: "Tras Hecho: Descargar de nuevo si la caché coincide; si no, Volver a convertir re-codifica en sitio — sin pantalla de carga.",
          },
        },
      },
      v321: {
        title: "Batch multi-archivo + fix JPEG de cámara",
        summary:
          "Convierte varias imágenes a la vez en rutas compatibles — y las fotos de móvil/cámara con EXIF grande ya funcionan en batch y archivo único.",
        technical:
          "Tier 3.6.0 batch en 14 slugs raster; escaneo metadata JPEG 512 KiB (core_utils + probe frontend); validación decode en prepare batch; UX Convert again. Recompilar Wasm tras pull. App v3.2.1.",
        highlights: {
          batchRoutes: {
            title: "Batch en rutas de herramienta",
            body: "Arrastra varios archivos en JPG→PNG y otras 13 herramientas raster. Opciones compartidas, selección por fila, una descarga por archivo — procesado secuencialmente en el navegador.",
          },
          cameraJpeg: {
            title: "JPEG de móvil y cámara",
            body: "Las fotos con bloques EXIF grandes ya no se marcan como corruptas. Resolución y profundidad de bits al subir; estimate y transmute funcionan.",
          },
          batchUx: {
            title: "Cuando termina un batch",
            body: "Si todo está Hecho, usa Volver a convertir para repetir con otros ajustes — sin toasts engañosos de “selecciona un archivo listo”.",
          },
        },
      },
      v320: {
        title: "Batch multi-archivo",
        summary:
          "Suelta varias imagenes en rutas de transmutador compatibles — opciones compartidas, elige que archivos convertir, una descarga por resultado.",
        technical:
          "Tier 3.6.0: workspace batch en 14 slugs raster; partitionFilesForTool; prepare/transmute secuencial; descarga por archivo con deduplicacion. Multi-drop universal en 3.6.1. App v3.2.0.",
        highlights: {
          batchRoutes: {
            title: "Batch en rutas de herramienta",
            body: "PNG→JPEG y otras 13 herramientas raster aceptan varios archivos. Elige un subconjunto o transmuta todos los listos — el procesamiento es de uno en uno en tu navegador.",
          },
          strictContract: {
            title: "Formatos mixtos en una ruta",
            body: "Los archivos incompatibles (p. ej. SVG en PNG→JPEG) se omiten con aviso claro — usa el Transmutador universal en inicio para drops de formatos mixtos.",
          },
        },
      },
      v312: {
        title: "Offline en Firefox",
        summary:
          "Recarga sin conexión y rutas de transmutador funcionan en Firefox Android — mismo shell en caché que Chrome y escritorio.",
        technical:
          "sw.ts navigationPreload: false — Firefox resuelve preloadResponse type error en lugar de rechazar (Mozilla #1802711). Precache + fallback /~offline sin cambios. App v3.1.2.",
        highlights: {
          firefoxOffline: {
            title: "Firefox en móvil",
            body: "Modo avión ya no muestra la página de error del navegador — Camaleon sirve desde caché tras la primera visita online.",
          },
        },
      },
      v311: {
        title: "Transmutador universal",
        summary:
          "Suelta cualquier imagen compatible en inicio, elige formato de salida y salta a la herramienta correcta con el archivo listo.",
        technical:
          "universal-matrix.ts; file-handoff con ArrayBuffer; consume seguro en Strict Mode; pulido visual del UniversalTransmutator. App v3.1.1 — fase Tier 3.5.",
        highlights: {
          universalEntry: {
            title: "Una sola puerta",
            body: "Suelta PNG, JPEG, WebP, AVIF, SVG y más — solo salidas que Camaleon realmente ofrece.",
          },
          handoffFix: {
            title: "Handoff que funciona",
            body: "El archivo preparado en inicio llega al transmutador — sin dropzone vacío tras el redirect.",
          },
          universalPolish: {
            title: "Entrada refinada",
            body: "Badge de ruta rápida, superficie con gradiente y drop zone más visible en inicio.",
          },
        },
      },
      v301: {
        title: "Pulido modo sin conexión",
        summary:
          "Modo sin conexión honesto en Ajustes, panel offline rediseñado y offline completo validado en producción tras la primera visita en línea.",
        technical:
          "Modo offline cache-only (fetch guard + SW SET_FORCE_OFFLINE); hero y checklist en OfflineSettingsSection; ConnectivityDot + OfflineStatusNotice; sonda de servidor; guard uncached en load-glue. App v3.0.1.",
        highlights: {
          offlineMode: {
            title: "Modo sin conexión",
            body: "Actívalo en Ajustes para usar solo shell y motores en caché en esta pestaña — igual que offline real en producción.",
          },
          offlineSettings: {
            title: "Panel Sin conexión y caché",
            body: "Estadísticas de motores, descarga completa, checklist offline y borrar caché — con guía honesta para producción.",
          },
          connectivityUx: {
            title: "UX de conectividad",
            body: "Pip de estado minimal en la cabecera y aviso flotante cuando estás offline o en modo sin conexión — sin banner invasivo.",
          },
        },
      },
      v300: {
        title: "PWA sin conexión",
        summary:
          "PWA instalable con service worker — convierte imágenes sin conexión tras la primera visita en línea. Ajustes S5 para descargar todos los motores.",
        technical:
          "SW Serwist: precache shell + 21 rutas; CacheFirst /wasm/**; OfflineProvider + banner; SwUpdatePrompt; S5 precacheFullToolkit; NFR-9 shell offline. App v3.0.0 — Tier 3 completo.",
        highlights: {
          pwaShell: {
            title: "Funciona sin conexión",
            body: "Visita en línea — luego transmuta y descarga sin red para las herramientas en caché.",
          },
          fullToolkit: {
            title: "Descargar todas las herramientas (S5)",
            body: "Actívalo en Ajustes → Sin conexión y caché para precachear todos los motores Wasm de las 21 herramientas.",
          },
          swUpdates: {
            title: "Actualizaciones controladas",
            body: "Las nuevas versiones te piden recargar — la transmutación nunca se interrumpe a mitad de sesión.",
          },
        },
      },
      v238: {
        title: "Risk mode y hotfixes",
        summary:
          "Modo Advanced / Risk (S6) mas correcciones del pipeline de limites, estimaciones mas inteligentes y scrollbar overlay mas fluido.",
        technical:
          "S6 RiskModeProvider + set_risk_mode Wasm; applyRiskMode antes del limite de sesion; HardFileBlockPanel; drag scroll instantaneo; filtro minimal reforzado; skip estimacion al volver a pestaña. App v2.3.8.",
        highlights: {
          riskMode: {
            title: "Advanced / Risk mode",
            body: "Activalo en Ajustes para procesar archivos muy grandes a resolucion completa — los limites del navegador siguen aplicando.",
          },
          riskPolish: {
            title: "Pulido del pipeline de limites",
            body: "Al desactivar Risk vuelven los bloqueos; estimacion y transmutacion sincronizados; sin errores obsoletos de limite.",
          },
          scrollbar: {
            title: "Fix scrollbar overlay",
            body: "Arrastrar el thumb evita scroll suave CSS — respuesta nativa en escritorio.",
          },
        },
      },
      v237: {
        title: "Modo Risk",
        summary:
          "Usuarios avanzados pueden activar el modo Risk para quitar limites de pixeles y tamano de Camaleon — los limites del navegador siguen aplicando.",
        technical:
          "Settings S6: RiskModeProvider, export set_risk_mode Wasm, bypass computeLimitContext, tope 500/250 MB, desbloqueo 12K astro. App v2.3.7 — 21 herramientas.",
        highlights: {
          riskMode: {
            title: "Advanced / Risk mode",
            body: "Activalo en Ajustes tras confirmar riesgos de OOM y cierre de pestaña. Desactiva limites de Camaleon en todas las herramientas.",
          },
          riskLimits: {
            title: "Flujos a resolucion completa",
            body: "Procesa PNG tipo Hubble, SVG grandes y archivos elevados sin redimensionado forzado ni consentimiento — si tu hardware lo permite.",
          },
        },
      },
      v236: {
        title: "SVG → JPEG",
        summary:
          "Rasteriza SVG vectorial a JPEG en local — presets de tamano, control de calidad y aplanado de alpha cuando haga falta.",
        technical:
          "Tier 3.3.2: transmutar_svg_a_jpg_with_options, sonda assess_svg_meaningful_alpha, rutas JPG en worker, LimitUnlockHint en bloqueos. App v2.3.6 — 21 herramientas.",
        highlights: {
          svgToJpg: {
            title: "Nuevo: SVG → JPEG",
            body: "Exporta ilustraciones y logos como JPEG comprimido al tamano en pixeles que elijas — renderizado en tu navegador.",
          },
          limitsUnlockHint: {
            title: "Guia para desbloquear limites",
            body: "Los bloqueos de pixeles, tamano de archivo y redimensionado explican como funcionara el modo Advanced / Risk en Ajustes (proximamente).",
          },
        },
      },
      v235: {
        title: "SVG → PNG",
        summary:
          "Rasteriza SVG vectorial a PNG en local — elige presets de tamano de salida y conserva alpha cuando el arte lo permite.",
        technical:
          "Tier 3.3: transmutador_svg (resvg/usvg 0.44), inspect_svg_meta en prepare, presets outputScale, rutas worker, perfil expensive en Notice Rail. Spike tier3_3_svg_spike_results.md. App v2.3.5 — 20 herramientas.",
        highlights: {
          svgToPng: {
            title: "Nuevo: SVG → PNG",
            body: "Convierte logos, iconos e ilustraciones al tamano en pixeles que necesites — renderizado en tu navegador con resvg.",
          },
          outputScale: {
            title: "Presets de tamano de salida",
            body: "Escala por porcentaje o ajusta el lado largo a 512–2048 px. El tope de 40 MP sigue protegiendo tu pestaña.",
          },
        },
      },
      v234: {
        title: "Ajustes de avisos y preparacion",
        summary:
          "Elige densidad del rail de avisos y estilo de progreso en Ajustes — minimal oculta avisos solo informativos.",
        technical:
          "Settings S4: notices-prefs.ts, filterNoticesForDensity en NoticeRail, estilo prepare en user-settings con migracion legacy. Vitest test:notices-prefs. App v2.3.4.",
        highlights: {
          noticeDensity: {
            title: "Rail de avisos mas limpio",
            body: "Densidad minimal oculta avisos informativos; las advertencias de limites, rendimiento y fidelidad siguen visibles.",
          },
          prepareProgress: {
            title: "Progreso de preparacion en Ajustes",
            body: "Elige anillo o barra al preparar archivos — misma preferencia que el toggle en flujo, ahora en el panel.",
          },
        },
      },
      v233: {
        title: "Ajustes de rendimiento",
        summary:
          "Anula el tier adaptativo, la cache de resultados y el auto-estimado desde Ajustes — los cambios se aplican al instante.",
        technical:
          "Settings S3: performance-prefs.ts, buildResourceProfileForTier, applyPerformancePrefs en useAdaptiveResourceProfile. Almacenado en camaleon-user-settings-v1.performance. Vitest test:performance. App v2.3.3.",
        highlights: {
          performancePrefs: {
            title: "Ajusta a tu dispositivo",
            body: "Elige Conservador, Equilibrado o Agresivo para anular la deteccion automatica — o fuerza cache y estimado de forma independiente.",
          },
          settingsPerformance: {
            title: "Seccion Rendimiento en Ajustes",
            body: "Nuevo bloque con segmentos Auto/Si/No y restablecer adaptativo — mismo patron estatico que el tema.",
          },
        },
      },
      v232: {
        title: "Valores predeterminados de transmutacion",
        summary:
          "Define calidad JPEG, compresion PNG, opciones AVIF y fondo alpha en Ajustes — cada herramienta arranca con tus valores.",
        technical:
          "Settings S2: transmutation-defaults.ts, build-default-options.ts, resolveSpecDefault por formato de salida. Almacenado en camaleon-user-settings-v1.transmutation. Vitest test:defaults. App v2.3.2.",
        highlights: {
          defaults: {
            title: "Tus defaults de codificacion",
            body: "Ajusta una vez en Ajustes; PNG→JPG, JPG→PNG, PNG→AVIF y rutas con alpha los usan en la siguiente conversion.",
          },
          settingsTools: {
            title: "Seccion Herramientas en Ajustes",
            body: "Nuevo bloque de defaults con restablecer fabrica — los sliders de cada herramienta siguen pudiendo sobreescribir en sesion.",
          },
        },
      },
      v231: {
        title: "Panel de ajustes",
        summary:
          "Un nuevo drawer de preferencias centraliza idioma, tema y avisos de actualizacion — mas un cluster del header refinado con tuerca animada.",
        technical:
          "SettingsProvider + SettingsDrawer (S1). user-settings.ts (camaleon-user-settings-v1). ThemeSegment con celdas activas estaticas. Alineacion utility cluster + estados del trigger. SPEC §7.13. App v2.3.1.",
        highlights: {
          settingsPanel: {
            title: "Preferencias en un solo lugar",
            body: "Abre la tuerca del header para idioma, tema, toggle de notas de version, Novedades y reset de bienvenida — sin perder los toggles rapidos.",
          },
          utilityCluster: {
            title: "Controles del header pulidos",
            body: "Settings, idioma y tema alineados; la tuerca brilla en verde en reposo y rojo con Ajustes abierto.",
          },
          releasePrefs: {
            title: "Controla avisos de actualizacion",
            body: "Elige si ver notas de version tras un bump — el historial completo sigue a un toque.",
          },
        },
      },
      v230: {
        title: "Rail de avisos operacionales",
        summary:
          "Un nuevo rail de contexto en cada herramienta explica cuándo la estimación o transmutación pueden tardar más, cuándo aplican límites y avisos específicos del formato — adaptativo en las 19 herramientas.",
        technical:
          "NoticeRail + resolvers lib/notices (limit, fidelity, performance, estimate). tool-notice-profiles.ts por herramienta; tiers L0–L3; useEstimateElapsed; cacheReadySlow; detailLabel en FilePrepareGate. Vitest test:notices. Componentes legacy eliminados. App v2.3.0.",
        highlights: {
          noticeRail: {
            title: "Rail de contexto en cada herramienta",
            body: "Hasta dos avisos priorizados entre opciones y métricas — advertencias, límites y honestidad de formato sin modales invasivos.",
          },
          adaptivePerf: {
            title: "Guía adaptativa en rutas lentas",
            body: "Encode AVIF, archivos de muchos megapíxeles, presets de velocidad baja y zonas elevadas muestran expectativas claras antes de transmutar.",
          },
          estimateLifecycle: {
            title: "Feedback más inteligente en estimación y transmutación",
            body: "Estimaciones largas muestran copy de progreso tras 3 segundos; ajustes pesados obtienen estado “puede tardar” y hints en el spinner.",
          },
        },
      },
      v220: {
        title: "PNG y JPEG → AVIF",
        summary:
          "Decimoctava y decimonovena herramientas: crea AVIF en el navegador desde PNG o JPEG. Sliders de calidad y velocidad, alpha semántico en PNG y aviso honesto de pérdida generacional en JPEG.",
        technical:
          "Tier 3.2.0–3.2.2: transmutador_avif_encode (ravif, ~1,67 MB Wasm separado del decode). estimate_png/jpg_to_avif_size; worker encodeSource. Motor v1.6.0.",
        highlights: {
          pngAvif: {
            title: "PNG → AVIF",
            body: "Codifica AV1 moderno en local — control de calidad y velocidad; alpha significativo preservado cuando los píxeles son realmente transparentes.",
          },
          jpgAvif: {
            title: "JPEG → AVIF",
            body: "Completa el par AVIF de entrada — archivos más pequeños para la web con aviso claro de pérdida lossy-on-lossy.",
          },
          encodeCrate: {
            title: "Módulo encode separado",
            body: "El encode AVIF es su propio Wasm lazy-load para que decode y encode cumplan cada uno el presupuesto de 3 MB.",
          },
        },
      },
      v211: {
        title: "AVIF → JPEG + vistas previas más fluidas",
        summary:
          "Decimoséptima herramienta: convierte AVIF a JPEG en el navegador. Los scrubbers de AVIF y GIF animado decodifican en segundo plano — cambios de fotograma instantáneos tras el warm-up, sin parpadeos.",
        technical:
          "Tier 3.1.2: exports JPEG en transmutador_avif + assess_alpha. frame-preview.worker + caché de sesión; pintura coalescida RgbaFrameScrubber; Transmutar bloqueado con estimación obsoleta. Motor v1.5.1.",
        highlights: {
          avifJpg: {
            title: "AVIF → JPEG",
            body: "Completa el par AVIF de salida — control de calidad, aplanado de fondo, alpha semántico y aviso lossy-on-lossy.",
          },
          framePreview: {
            title: "Vista previa animada",
            body: "Los fotogramas se preparan fuera del hilo principal; el scrubber responde al instante con caché LRU y sin overlay por fotograma.",
          },
          transmuteSync: {
            title: "Transmutar alineado con estimación",
            body: "El botón espera cuando el tamaño en pantalla está desactualizado y aún se recalcula — se reactiva al quedar alineado.",
          },
        },
      },
      v200: {
        title: "Tier 3 — decodificación AVIF",
        summary:
          "Camaleon 2.0 abre la era de formatos modernos: convierte AVIF a PNG en el navegador, elige frames en AVIF animado y procesa imágenes científicas grandes con límites 150 MB / 40 MP restaurados.",
        technical:
          "Tier 3.1.0–3.1.1: transmutador_avif (zenavif), normalize_avif_input, AvifFrameScrubber, estimate + worker frame_index. Hotfixes: sessionLimitForBytes, guardia de píxeles en prepare, consentimiento post-resize astro. Motor v1.5.0. Ver docs/LIMIT_PIPELINE.md.",
        highlights: {
          avifPng: {
            title: "AVIF → PNG",
            body: "Decimosexta herramienta — decodifica AV1 en contenedores HEIF a PNG con control de compresión y estimaciones honestas.",
          },
          avifAnimated: {
            title: "Frames AVIF animado",
            body: "Elige qué frame exportar con un scrubber perezoso — el prepare sigue respondiendo en archivos multiframe.",
          },
          limitPipeline: {
            title: "Pipeline imágenes grandes",
            body: "PNG científicos hasta 150 MB pueden reducirse con presets 4K–12K antes de Wasm; reglas documentadas para mantenedores.",
          },
        },
      },
      v1122: {
        title: "Estimaciones de tamaño más rápidas",
        summary:
          "El motor de estimación es más ágil — la inspección GIF ya no decodifica todos los frames, los escaneos alpha reutilizan hints del prepare y los sliders recientes quedan en caché en dispositivos capaces.",
        technical:
          "Pre²-Tier 3 en dev: GIF skip_frame_decoding + composite incremental; alpha hint prepare→worker→Wasm; ResultCache LRU multi-entrada; core_utils flatten_rgba + alpha_scan SIMD128; release LTO + simd128/bulk-memory. Motor v1.4.3.",
        highlights: {
          gifEstimate: {
            title: "Hot path de estimación GIF",
            body: "Los GIF animados inspeccionan metadatos sin decodificar todos los frames y componen solo hasta el índice del frame seleccionado.",
          },
          estimateCache: {
            title: "Caché multi-entrada de estimaciones",
            body: "Los sliders de calidad y compresión consultan un LRU pequeño de estimaciones exactas recientes en lugar de re-codificar en cada movimiento.",
          },
          wasmPerf: {
            title: "Build Wasm y rutas raster",
            body: "LTO en release, SIMD128, flatten compartido y escaneo alpha vectorizado reducen trabajo redundante manteniendo la doctrina de estimación byte-exacta.",
          },
        },
      },
      v1121: {
        title: "Marca Camaleon",
        summary:
          "El camaleón de Lámina 3C llega al header y a la pestaña del navegador — cabeza ovalada, favicon transparente y espaciado afinado en todos los breakpoints.",
        technical:
          "BrandLink + CamaleonMark (PNG de referencia), assets en public/brand, app/icon.png (transparente) + apple-icon.png, scripts/generate-brand-assets.mjs. Header reemplaza el SVG inline anterior. Verde Camaleón #22C55E.",
        highlights: {
          brandMark: {
            title: "Marca Lámina 3 opción C",
            body: "Silueta fiel del camaleón en espiral con cabeza ovalada y cola — extraída de la referencia aprobada, sin SVG trazado a mano.",
          },
          favicon: {
            title: "Favicon transparente",
            body: "El icono de pestaña ya no muestra un cuadrado oscuro — mark centrado con padding seguro sobre tile transparente.",
          },
          headerBrand: {
            title: "Enlace de marca en header",
            body: "Wordmark visible en móvil, hover con anillo accent y marco óptico más grande para que el mark respire junto al título.",
          },
        },
      },
      v1120: {
        title: "Identidad visual y shell de descubrimiento",
        summary:
          "Pase UI completo Pre-Tier 3 — nuevas superficies, navegador de herramientas escalable, command palette v2 y workspace de transmutación refinado en desktop y móvil.",
        technical:
          "UX-0–UX-8 en dev: tokens surface-raised/floating/subnav, SurfaceDialog/Sheet, ModalPortal + useModalDialog, guard de scroll-lock, AmbientBloom (tier móvil), ToolBrowser (tabs + filas compactas), búsqueda/grupos en palette, transmute-shell + ToolPageHeader. SPEC §7.4.1. Plan: docs/planning/pre_tier3_ui_ux_plan.md.",
        highlights: {
          visualIdentity: {
            title: "Sistema de superficies Camaleon",
            body: "Overlays opacos unificados, header/subnav sticky, bloom ambiental accent y paleta light sincronizada — legible en todo dispositivo.",
          },
          toolBrowser: {
            title: "Tool browser v2",
            body: "Tabs por familia, filas compactas, toggle de densidad y jerarquía en toolbar — reemplaza el grid acordeón, listo para 25+ herramientas.",
          },
          surfacesHotfix: {
            title: "Hotfixes de modales y scroll",
            body: "Sincronía de cierre What's New, recuperación de scroll-lock, race del portal modal, overlap de píldoras en Huawei y fixes z-index al filtrar tabs.",
          },
          transmuteShell: {
            title: "Refresh del workspace transmute",
            body: "Nuevo header de herramienta, dropzone accent y shell transmute elevado — mismo motor, UX radicalmente más clara.",
          },
        },
      },
      v1110: {
        title: "Detección honesta de transparencia",
        summary:
          "Las conversiones con pérdida solo avisan cuando los píxeles son realmente transparentes — no cuando el archivo solo tiene canal alpha.",
        technical:
          "Semantic Alpha Engine: core_utils::semantic_alpha (sonda + raster completo), Wasm assess_alpha / assess_page_alpha en BMP, PNG, WebP, GIF, TIFF, frontend lib/semantic-alpha en prepare. Aplanado en encode alineado con assess. SPEC §5.5.3.",
        highlights: {
          semanticAlpha: {
            title: "Semantic Alpha Engine",
            body: "PNG, WebP, GIF, BMP y TIFF → JPEG comparten una evaluación Wasm en prepare. El aviso de transparencia y el selector de fondo aparecen solo cuando el alpha cambiaría la salida.",
          },
          tiffOpaque: {
            title: "Corrección TIFF RGBA opaco",
            body: "TIFF archivales con canal alpha pero píxeles totalmente opacos ya no muestran un aviso falso de transparencia — el caso que motivó esta versión.",
          },
        },
      },
      v1104: {
        title: "TGA → PNG",
        summary: "Texturas de juego y assets Targa a PNG — raw, RLE, indexado y alpha 32-bit.",
        technical:
          "Nuevo modulo Wasm transmutador_tga (image 0.25 tga+png). Sonda de cabecera, ruta TgaDecoder, normaliza orientacion, aviso rgb555, estimate dentro del 5%.",
        highlights: {
          tgaPng: {
            title: "TGA → PNG",
            body: "Convierte Targa legacy para web y editores — texturas sin comprimir y RLE, alpha cuando existe.",
          },
        },
      },
      v1103: {
        title: "PNG → ICO",
        summary: "Crea favicons desde PNG — elige 16, 32, 48 o 256 px con reduccion honesta sin ampliar.",
        technical:
          "Ruta encode en transmutador_ico: downscale Lanczos3 si el borde maximo supera el objetivo, sin upscale, IcoEncoder PNG-in-ICO una entrada, presets validate_icon_size.",
        highlights: {
          pngIco: {
            title: "PNG → ICO",
            body: "Exporta un favicon de una sola resolucion para Windows y navegadores legacy — presets de tamanos habituales.",
          },
        },
      },
      v1102: {
        title: "ICO → PNG",
        summary: "Extrae bitmaps de favicon y cursor como PNG — con selector multiples tamanos.",
        technical:
          "Nuevo modulo Wasm transmutador_ico (image 0.25 ico+png). Sonda ICONDIR, decode entry_index para PNG embebido, default tamano mayor, acepta .ico y .cur.",
        highlights: {
          icoPng: {
            title: "ICO → PNG",
            body: "Saca un tamano concreto de packs favicon — scrubber cuando hay mas de una resolucion embebida.",
          },
        },
      },
      v1101: {
        title: "TIFF → JPEG",
        summary: "Exportacion web con perdida desde TIFF de archivo — calidad y aplanado de alpha.",
        technical:
          "Ruta JPEG en transmutador_tiff: flatten_rgba_on_background, validacion de calidad, page_index en transmute/estimate, deteccion de alpha por IFD para el selector de fondo.",
        highlights: {
          tiffJpg: {
            title: "TIFF → JPEG",
            body: "Reduce escaneos y masters de impresion para web — mismo selector multipagina, presets de calidad y color de fondo cuando hay alpha.",
          },
        },
      },
      v1100: {
        title: "TIFF → PNG",
        summary: "Soporte TIFF de archivo con selector de paginas y normalizacion 16-bit.",
        technical:
          "Nuevo modulo Wasm transmutador_tiff (image 0.25 + tiff 0.11). Sonda IFD para page_count, rechazo palette/CMYK, page_index en transmute/estimate, y downshift 8-bit alineado con image.",
        highlights: {
          tiff: {
            title: "TIFF → PNG",
            body: "Convierte escaneos, masters de impresion y TIFF multipagina en local — elige una pagina cuando hay mas de un IFD.",
          },
          bitdepth: {
            title: "Honestidad 16-bit",
            body: "Fuentes de alta profundidad se normalizan a PNG 8-bit con mapeo documentado — la vista previa coincide con la salida.",
          },
        },
      },
      v190: {
        title: "Tier 2 Ola 1",
        summary: "Suites GIF y BMP, límites más inteligentes y reducción para imágenes científicas.",
        technical:
          "Cuatro módulos Wasm nuevos (lectura/escritura GIF/BMP), composición de frames GIF89a, preflight LimitContext, reducción astro en cliente vía Canvas, y reciclaje del worker al salir de la ruta para liberar memoria del heap Wasm.",
        highlights: {
          formats: {
            title: "Formatos GIF y BMP",
            body: "Cuatro herramientas nuevas: GIF↔PNG y BMP↔PNG, llevando el catálogo a 10 transmutaciones activas.",
          },
          gif: {
            title: "Selector de frame GIF",
            body: "Previsualiza y elige un frame concreto antes de convertir, con composición correcta de transparencia GIF89a.",
          },
          limits: {
            title: "Límites adaptativos",
            body: "LimitContext unificado con mensajes de error precisos, bloqueos por dimensiones y consentimiento para archivos grandes.",
          },
          astro: {
            title: "Reducción para imágenes científicas",
            body: "Presets 4K–8K redimensionan imágenes astronómicas enormes en el navegador antes de Wasm, manteniendo conversiones dentro de límites de memoria seguros.",
          },
          memory: {
            title: "Ciclo de vida de memoria más inteligente",
            body: "Al salir de una ruta de transmutación se recicla el worker Wasm para que sesiones pesadas no permanezcan en memoria.",
          },
        },
      },
    },
  },

  legal: {
    backHome: "Volver al inicio",
    lastUpdated: "Última actualización: {date}",
    revision: "Revisión {revision}",
    subnavLabel: "Páginas legales",
    tocLabel: "En esta página",
    tocHeading: "Contenido",
    tocSection: "{count} sección",
    tocSections: "{count} secciones",
    tableEntry: "{count} entrada",
    tableEntries: "{count} entradas",
  },

  legalRefresh: {
    eyebrow: "Importante — actualización legal",
    title: "Actualizamos nuestras páginas legales",
    body: "About, Contact, Privacy y Terms fueron reescritas por completo para Camaleon v3.4 — reflejando herramientas actuales, comportamiento offline/PWA, almacenamiento, batch, optimize y modo riesgo.",
    strong: "Estos documentos son tu referencia legal. Te recomendamos encarecidamente leer Privacy y Terms antes de continuar.",
    readPrivacy: "Leer Política de Privacidad",
    readTerms: "Leer Términos de Uso",
    acknowledge: "Entiendo — continuar",
    revisionNote: "Revisión {revision}. Puedes revisar todas las páginas legales en cualquier momento desde el footer.",
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
    universal: {
      title: "Transmutador universal",
      subtitle: "Suelta cualquier imagen compatible — elige el formato de salida. Te llevamos a la herramienta correcta.",
      badge: "Ruta rápida",
      dropLabel: "Suelta tu imagen aquí",
      dragLabel: "Suelta para elegir salida",
      browseHint: "o haz clic para buscar",
      dropAria: "Suelta un archivo compatible o haz clic para buscar",
      outputAria: "Elegir formato de salida",
      pickOutput: "Elige salida · {count} opciones",
      changeFile: "Cambiar archivo",
      redirecting: "Abriendo transmutador…",
      handoffFailed: "No se pudo preparar el archivo. Inténtalo de nuevo.",
      oneFileOnly: "Un archivo a la vez — usando el primero.",
      unsupported: "«{name}» aún no es un formato que Camaleon admita.",
      tryAgain: "Probar otro archivo",
      formatsHint: "Compatibles: {formats}",
      batch: {
        dropHint: "Suelta uno o varios archivos del mismo formato para convertirlos juntos.",
        filesSummary: "{format} · {count} archivos",
        totalSize: "Total ~{size}",
        changeFiles: "Cambiar archivos",
        fileCountBadge: "{count} archivos",
        filesListAria: "Archivos seleccionados",
        pickOutput: "Elige salida batch · {count} opciones",
        chooseOutput: "Elegir salida →",
        mixedGroupsTitle: "{fileCount} archivos en {groupCount} grupos",
        mixedGroupsHint:
          "Cada grupo se convierte por separado. Elige uno para continuar — los demas permanecen aqui hasta que los proceses.",
        dismissGroups: "Limpiar todo",
        mixedFormatsHint:
          "Se detectaron {count} grupos de formato — suelta archivos del mismo formato para batch, o activa el selector de cohortes en Ajustes.",
        noBatchRoute:
          "El batch multi-archivo para {format} aún no está disponible — suelta un archivo a la vez, o usa PNG, JPEG, WebP o AVIF para batch.",
        unsupportedSkipped: "{count} archivo(s) no compatible(s) omitido(s) ({names}).",
        capped: "Solo se conservó el límite máximo de archivos del batch.",
      },
    },
    tools: {
      available: "Transmutaciones disponibles",
      comingSoon: "Proximamente",
      jumpNavAria: "Ir a familias de herramientas",
      tabsAria: "Familias de herramientas",
      lanesAria: "Categoría de herramientas",
      lanes: {
        convert: "Transmutar",
        optimize: "Optimizar",
      },
      densityAria: "Densidad de la lista",
      jumpLinks: {
        avif: "AVIF",
        svg: "SVG",
        "jpeg-png": "JPEG",
        webp: "WebP",
        "gif-bmp": "GIF",
        archival: "TIFF",
        icons: "ICO",
      },
      tabs: {
        all: "Todas",
      },
      density: {
        compact: "Vista compacta",
        detailed: "Vista detallada",
      },
      toolbarMeta: {
        all: "{count} herramientas en {families} familias",
        filtered: "{count} herramientas",
      },
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
    avifFrameProgress: "Fotograma {current} de {total}",
    bmpMeta: "{width} × {height} · {bpp} bits",
    phases: {
      reading: "Leyendo archivo…",
      engine: "Cargando motor de conversion…",
      analyze: "Analizando imagen…",
      analyzeGif: "Leyendo fotogramas de animacion…",
      analyzeAvif: "Decodificando AVIF…",
      analyzeSvg: "Analizando SVG…",
      analyzeBmp: "Leyendo cabecera del bitmap…",
      analyzeSkippedLimit: "Analisis profundo omitido — archivo supera el limite del motor",
      finalize: "Preparando espacio de trabajo…",
      resizing: "Redimensionando imagen…",
      transmuting: "Transmutando…",
    },
  },

  dropzone: {
    idleLabel: "Arrastra una imagen aqui, o haz clic para seleccionar",
    idleLabelBatch: "Arrastra imagenes aqui, o haz clic para seleccionar varios archivos",
    dragLabel: "Suelta para transmutar",
    processingLabel: "Transmutando...",
    ariaLabel: "Selecciona un archivo de imagen para transmutar",
    pageOverlayLabel: "Suelta para transmutar este archivo",
  },

  panel: {
    handoffExpired: "Esa sesión de archivo expiró — suelta el archivo de nuevo en inicio o aquí.",
    batchHandoffToolMismatch: "Ese batch era para otro transmutador — suelta tus archivos de nuevo.",
    batch: {
      toolbarSummary: "{total} archivos · {selected} seleccionados",
      selectAll: "Seleccionar todo",
      selectNone: "Quitar selección",
      transmuteSelected: "Transmutar {count}",
      downloadSelected: "Descargar {count}",
      downloadSelectedZip: "Descargar ZIP ({count})",
      transmuteAll: "Transmutar todos los listos",
      downloadAll: "Descargar todos los listos",
      downloadAllZip: "Descargar todo en ZIP",
      preparing: "Preparando {current} / {total}",
      processing: "{current} / {total} · {fileName}",
      rowReady: "Listo",
      rowElevated: "Listo · elevado",
      rowBlocked: "Bloqueado",
      rowError: "Error",
      rowPreparing: "Preparando…",
      rowDone: "Hecho",
      skippedIncompatible:
        "{count} archivo(s) omitido(s) — no aceptados en esta herramienta ({names}). Usa el Transmutador universal para formatos mixtos.",
      noneCompatible: "Ningún archivo coincide con esta herramienta ({formats}).",
      useUniversal: "Usar Transmutador universal",
      notSupported: "El modo batch no está disponible en esta herramienta — solo se cargó el primer archivo.",
      capped: "Solo se añadieron los primeros {max} archivos (límite de batch).",
      selectAtLeastOne: "Selecciona al menos un archivo listo para transmutar.",
      doneSummary: "{done} de {total} convertidos",
      noneTransmuted: "No se convirtió ningún archivo — revisa el estado de cada fila o inténtalo de nuevo.",
      allFailed: "Todos los archivos seleccionados fallaron — revisa los errores abajo.",
      fileListAria: "Lista de archivos del batch",
      missingPrepared: "Se perdieron los datos del archivo antes de transmutar — quítalo y vuelve a añadirlo.",
      convertAgain: "Volver a convertir",
      convertAgainCount: "Volver a convertir ({count})",
      downloadAgain: "Descargar de nuevo",
      downloadAgainCount: "Descargar de nuevo ({count})",
      downloadAgainZip: "Descargar ZIP de nuevo ({count})",
      allDoneSelectHint: "Selecciona uno o más archivos arriba para descargar o convertir de nuevo.",
      allDoneReencodeHint:
        "Los archivos seleccionados se volverán a codificar con los ajustes de arriba — cada uno se descarga por separado.",
      allDoneReencodeHintZip:
        "Los archivos seleccionados se volverán a codificar con los ajustes de arriba — luego se empaquetan en un ZIP.",
      allDoneOptionsChangedHint:
        "La última corrida usó {option} {lastRun}; el ajuste actual es {current}. Volver a convertir para re-codificar — archivos por separado.",
      allDoneOptionsChangedHintZip:
        "La última corrida usó {option} {lastRun}; el ajuste actual es {current}. Volver a convertir para re-codificar y descargar en un ZIP.",
      optionsValidatedHint:
        "Archivos validados en {option} {prepared}. Cambia el slider para ajustar la salida — cada archivo se descarga por separado al listo.",
      optionsValidatedHintZip:
        "Archivos validados en {option} {prepared}. Cambia el slider para ajustar la salida — al descargar se empaquetan en un ZIP.",
      optionsChangedHint:
        "Validados en {option} {prepared}; ajuste actual {current}. Transmuta para aplicar — archivos por separado.",
      optionsChangedHintZip:
        "Validados en {option} {prepared}; ajuste actual {current}. Transmuta para re-codificar y descargar en un ZIP.",
      downloadFormatSuggestZip:
        "¿Prefieres una sola descarga? Usa archivo ZIP — los convertidos se empaquetan automáticamente tras cada corrida.",
      downloadFormatSuggestIndividual:
        "¿Prefieres archivos sueltos? Usa descargas individuales — cada convertido se guarda por separado.",
      downloadFormatSwitchToZip: "Cambiar a ZIP en Ajustes",
      downloadFormatSwitchToIndividual: "Cambiar a archivos sueltos en Ajustes",
      optionCompression: "compresión",
      optionQuality: "calidad",
      optionSettings: "ajustes",
      allDoneHint:
        "Los archivos seleccionados se prepararán de nuevo con las opciones de arriba. Los no seleccionados siguen en Hecho.",
      allDoneCacheHint:
        "Mismos ajustes que la última corrida para los seleccionados — descarga instantánea desde caché cuando esté disponible.",
      allDoneCacheHintZip:
        "Mismos ajustes que la última corrida — ZIP instantáneo desde resultados en caché (sin re-codificar).",
      cachedDownloadSummary: "Descargados {count} archivo(s) desde caché — sin re-codificar.",
      cachedDownloadSummaryZip: "ZIP descargado con {count} archivo(s) en caché — sin re-codificar.",
      cacheRedownloadMiss:
        "Caché expirada o no disponible — cambia un ajuste o usa Volver a convertir para reprocesar.",
      transmuteAnother: "Transmutar más",
      cancelBatch: "Cancelar batch",
      backToHome: "Volver al inicio",
      aggregateWarning: "Tamaño total ~{size} — los archivos se procesan de uno en uno.",
      elevatedBatchBody: "{count} archivo(s) necesitan confirmación de archivo grande antes de transmutar.",
      rowFrame: "Fotograma",
      rowPage: "Página",
      rowEntry: "Tamaño de icono",
      downloadZip: "Descargar ZIP",
      zipNeedTwo: "Se necesitan al menos dos archivos convertidos para un ZIP.",
      zipDone: "ZIP descargado ({count} archivos).",
    },
    stagedFileSize: "{size}",
    changeFile: "Cambiar",
    svgIntrinsic: "Tamano vectorial intrinseco: {width} × {height}",
    cancel: "Cancelar",
    transmuteButton: "Transmutar",
    transmuteSyncing: "Actualizando estimación…",
    transmuteBlockedLimits: "Resuelve los limites arriba para transmutar",
    transmuteBlockedEstimate: "Corrige el error de estimacion para transmutar",
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
    unexpectedError: "Ocurrio un error inesperado",
    prepareFailed: "No se pudo preparar este archivo. Prueba otra imagen o un formato distinto.",
    hardLimit: {
      title: "Archivo demasiado grande",
      body: "Este archivo supera el tamano maximo admitido ({limit}). Intenta reducirlo o usa una herramienta de escritorio antes de convertir aqui.",
    },
    oversize: {
      title: "Archivo grande — confirmacion requerida",
      body: "Este archivo pesa {size} (por encima del limite habitual de {softLimit}). Procesarlo puede usar temporalmente unos {peakRam} de memoria del navegador y ralentizar esta pestana.",
      nearPixelLimit: "Esta imagen tiene {megapixels} MP — cerca del limite de seguridad de {maxMp} MP en el navegador.",
      outputHint: "El peso de salida depende de la calidad y el formato — puede ser mayor o menor que el original.",
      privacy: "Tu archivo nunca sale de este dispositivo — todo el procesamiento ocurre localmente en tu navegador.",
      consent: "Entiendo — procesar este archivo igualmente",
      blockedButton: "Confirma arriba para transmutar",
    },
    dimensionsBlock: {
      title: "Imagen demasiado grande para procesar en el navegador",
      body: "{width} × {height} ({megapixels} MP) supera el limite de {maxMp} MP para conversion en el navegador.",
      astroHint: "Imagenes cientificas y espaciales (Hubble, JWST, etc.) suelen superar los limites del navegador. Reduce o divide la imagen con un pipeline astronomico antes de convertir aqui.",
      action: "Reduce dimensiones en un editor de escritorio, o exporta una vista previa mas pequena desde tu archivo fuente.",
      resizeHint: "Puedes reducir en el navegador para continuar — se pierde resolucion, pero se conservan tono y color.",
      resizeCta: "Redimensionar para continuar",
      svgScaleHint: "Reduce el preset de escala de salida — las dimensiones raster deben respetar el limite de pixeles del navegador.",
    },
    limitsUnlock: {
      title: "Necesitas quitar los limites de Camaleon?",
      intro: "Usuarios avanzados con hardware potente pueden activar el modo Risk en Ajustes. Por ahora, usa las opciones de redimensionado o escala de arriba.",
      step1: "Abre Ajustes (icono de engranaje en la cabecera)",
      step2: "Desplazate hasta Advanced / Risk",
      step3: "Lee las advertencias, confirma que entiendes los riesgos y activa el modo Risk",
      disclaimer:
        "El modo Risk solo quita los limites de Camaleon — tu navegador y dispositivo aun pueden quedarse sin memoria, congelarse o cerrar esta pestaña.",
      openSettings: "Abrir Ajustes",
    },
    riskMode: {
      bannerTitle: "Modo Risk activo",
      bannerBody:
        "Los limites de seguridad de Camaleon estan desactivados. Conversiones grandes pueden congelar o cerrar esta pestaña — los limites del navegador siguen aplicando.",
    },
    riskDeactivated: {
      title: "Modo Risk desactivado",
      body: "Los limites de Camaleon vuelven a estar activos. Este archivo supera los limites normales — usa redimensionado o escala abajo, o reactiva Risk mode en Ajustes.",
    },
    riskUnlock: {
      title: "Modo Risk activado",
      body: "Los limites de seguridad de Camaleon estan desactivados en esta sesion. Desea continuar con el archivo cargado?",
      bodyBatch:
        "Los limites de seguridad estan desactivados. Re-preparar {count} archivos bloqueados y continuar?",
      continue: "Continuar",
    },
    hardFileBlock: {
      title: "Archivo demasiado grande para modo estandar",
      body: "Este archivo ({size}) supera el limite de {limit} ahora que el modo Risk esta desactivado.",
      resizeHint:
        "Puedes reducir en el navegador para continuar — se pierde resolucion, pero se conservan tono y color.",
      resizeCta: "Redimensionar para continuar",
      action: "Reduce el tamano en un editor de escritorio, o reactiva Risk mode en Ajustes para procesar a resolucion completa.",
    },
    astroResize: {
      title: "Reducir para continuar",
      body: "Elige una longitud maxima del lado. La imagen se redimensiona localmente en tu navegador antes de convertir.",
      target: "Objetivo: {width} × {height} ({megapixels} MP) · RAM pico ~{peakRam}",
      extendedConsent: "Entiendo — redimensionar a 12K puede usar mucha memoria en este dispositivo",
      extendedHint:
        "12K es para equipos de escritorio con RAM suficiente. El resultado debe caber en el limite de {maxMp} MP — imagenes muy anchas pueden necesitar un preset menor.",
      exceedsPixelLimit:
        "{width} × {height} ({megapixels} MP) supera el limite de {maxMp} MP — elige un preset menor.",
      presetOverLimit: "Supera el limite de {maxMp} MP del navegador con esta proporcion de imagen",
      privacy: "Tu archivo original no cambia. El redimensionado ocurre solo en este dispositivo.",
      apply: "Aplicar redimension",
      applying: "Redimensionando…",
      presets: {
        "4k": "4K (4096 px)",
        "6k": "6K (6144 px)",
        "8k": "8K (8192 px)",
        "12k": "12K (12288 px)",
      },
    },
    resizedMeta: {
      notice: "Redimensionado desde {width} × {height} — archivo original sin cambios",
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
      estimateUnavailable: "Estimacion no disponible para este archivo.",
      consentRequired: "Confirma el aviso de archivo grande arriba para habilitar estimacion y transmutacion.",
      pixelsBlocked: "Las dimensiones superan el limite del navegador — estimacion no disponible.",
      estimateInterrupted: "La estimacion se interrumpio — toca Calcular de nuevo.",
      cacheReady: "Listo para transmutar",
      cacheReadySlow: "Listo — la conversión puede tardar con este archivo y ajustes",
    },
    avifFrame: {
      hint: "Los fotogramas cargan en segundo plano — al terminar, el deslizador responde al instante. Elige cual exportar.",
      warmingFrames: "Preparando fotogramas {current} / {total}…",
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
    tiffPage: {
      title: "Pagina TIFF",
      counter: "{current} / {total}",
      hint: "Desliza para previsualizar otro IFD — suelta para actualizar la estimacion de tamano.",
      sliderAria: "Selector de pagina TIFF",
      previewAlt: "Vista previa de la pagina {index}",
      loadingPreview: "Generando vista previa…",
    },
    icoEntry: {
      title: "Tamano del icono",
      counter: "{current} / {total} · {size}px",
      hint: "Desliza para previsualizar otro tamano embebido — suelta para actualizar la estimacion.",
      sliderAria: "Selector de tamano ICO",
      previewAlt: "Vista previa de entrada {size}px ({index})",
      loadingPreview: "Generando vista previa…",
    },
  },

  resize: {
    filterLabel: "Filtro de remuestreo",
    filter: {
      sharp: "Nitido",
      sharpDesc: "CatmullRom — Mejor balance de nitidez y velocidad. Bicubico estandar de la industria.",
      sharpest: "Mas nitido",
      sharpestDesc: "Lanczos3 — Maxima preservacion de detalle. Puede producir halos en bordes de alto contraste.",
      smooth: "Suave",
      smoothDesc: "Triangle — Rapido y sin artefactos. Salida mas suave, adecuado para miniaturas.",
      nearest: "Pixel Perfecto",
      nearestDesc: "Vecino mas cercano — Conserva bordes duros. Lineas dentadas en fotografias. Ideal para pixel art.",
      gaussian: "Anti-alias",
      gaussianDesc: "Gaussiano — Pre-filtro intencionalmente borroso. Ideal para reduccion extrema (<25%) para evitar Moire.",
      advanced: "Avanzado",
    },
    advancedScaling: "Escalado avanzado",
    advancedScalingOn: "Escalado avanzado ON",
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
      description: "WebP VP8L sin perdida desde PNG. Pixeles preservados — sin perdida de calidad. Graficos/capturas reducen 20-30%. Transparencia conservada (RGBA). Fotos: WebP sera MAYOR que JPEG — usa JPEG para web.",
      fidelityHint: "WebP VP8L sin perdida. Graficos y capturas suelen reducirse 20-30%; PNGs fotograficos pueden terminar mas grandes que el original. Para fotos web, JPEG es mas pequeno.",
    },
    "jpg-to-webp": {
      actionTitle: "Convertir a WebP sin Perdida",
      description: "WebP VP8L sin perdida desde JPEG — el output sera SIGNIFICATIVAMENTE MAYOR que el JPEG (expansion de entropia, 2x-10x). Cada pixel decodificado almacenado exactamente. No es para reducir fotos.",
      fidelityHint: "WebP sin perdida desde un JPEG ya comprimido — output MUCHO mas grande (2x-10x). Ideal para archivado. Para archivos mas pequenos en web, usa JPEG o WebP→JPG.",
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
    "tiff-to-png": {
      actionTitle: "Convertir a PNG",
      description: "PNG sin perdida desde TIFF — compresion DEFLATE para archivos e impresion.",
      fidelityHint:
        "Fuentes 16-bit y float se normalizan a PNG 8-bit. TIFF multipagina: elige una pagina. Palette y CMYK no soportados.",
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
    "ico-to-png": {
      actionTitle: "Extraer como PNG",
      description: "PNG sin perdida desde icono o cursor — elige que tamano embebido exportar.",
      fidelityHint:
        "Entradas PNG-in-ICO modernas soportadas. Capas BMP legacy se rechazan con error claro. Los .cur usan el mismo contenedor que .ico.",
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
    "png-to-ico": {
      actionTitle: "Crear ICO",
      description: "Favicon de una resolucion desde PNG — embebido como PNG-in-ICO moderno.",
      fidelityHint:
        "Se reduce si la fuente es mayor que el preset. Fuentes mas pequenas nunca se amplian — el ICO conserva las dimensiones originales.",
      options: {
        iconSize: {
          label: "Tamano del icono",
          hint: "Longitud del borde cuadrado del favicon. Presets habituales: 16, 32, 48 y 256 px.",
          lowerLabel: "",
          upperLabel: "",
          presets: { "16": "16", "32": "32", "48": "48", "256": "256" },
        },
      },
    },
    "tga-to-png": {
      actionTitle: "Convertir a PNG",
      description: "PNG sin perdida desde Targa — compresion DEFLATE para texturas y assets de juego.",
      fidelityHint:
        "TGA raw y RLE soportados. RGB 16-bit usa el bit atributo, no alpha — salida PNG RGB. Mapas de color indexados cuando el decoder lo permite.",
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
    "png-compress": {
      actionTitle: "Comprimir PNG",
      description: "Re-codifica mismo formato con optimizacion sin perdida (prueba de filtros, reduccion de color/bits, ajuste de estrategia DEFLATE) o cuantizacion con perdida por paleta — compara el delta de tamano en las metricas.",
      fidelityHint: "Sin perdida por defecto — los pixeles no cambian. Modo con perdida opcional: cuantizacion por paleta para PNGs 60-80% mas pequenos (irreversible).",
      options: {
        compression: {
          label: "Nivel de compresion",
          hint: "Nivel mas alto = archivo mas pequeno, codificacion mas lenta. Los pixeles permanecen identicos — sin perdida.",
          lowerLabel: "Rapido",
          upperLabel: "Minimo",
          presets: { fast: "Rapido", balanced: "Balanceado", minimal: "Minimo" },
        },
        optimizationLevel: {
          label: "Optimizacion",
          hint: "Off = codificacion estandar. Full = prueba de filtros + estrategias. Archival = Zopfli (3-8% mas, extremadamente lento).",
          lowerLabel: "Off",
          upperLabel: "Archival",
          presets: { off: "Off", full: "Full", archival: "Archival" },
        },
        lossyMode: {
          label: "Compresion con perdida",
          hint: "Reduce la profundidad de color mediante cuantizacion de paleta. Irreversible — la calidad visual cambia. 60-80% mas pequeno para fotos.",
          lowerLabel: "Off",
          upperLabel: "On",
          presets: { off: "Off", on: "On" },
        },
        lossyColors: {
          label: "Numero de colores",
          hint: "Cantidad de colores en la paleta de salida (2-256). Menos colores = archivo mas pequeno pero mayor perdida de calidad.",
          lowerLabel: "2",
          upperLabel: "256",
          presets: { "16": "16", "64": "64", "128": "128", "256": "256" },
        },
      },
    },
    "jpg-compress": {
      actionTitle: "Comprimir JPEG",
      description: "Re-codifica mismo formato con tablas Huffman optimizadas y control de submuestreo de croma — hasta 15% mas pequeno a la misma calidad visual. Reduccion de tamano con metricas y advertencia de perdida generacional.",
      fidelityHint: "Con perdida — cada re-codificacion anade generacion de perdida. Huffman optimizado por defecto (5-15% mas pequeno). Submuestreo: 4:4:4 para texto/capturas. Compara delta en metricas.",
      options: {
        quality: {
          label: "Calidad JPEG",
          hint: "Menor calidad = archivo mas pequeno.",
          lowerLabel: "Mas pequeno",
          upperLabel: "Mas fiel",
          presets: { web: "Web", balanced: "Balanceado", high: "Alto" },
        },
        subsampling: {
          label: "Submuestreo de croma",
          hint: "4:2:0 = mejor compresion para fotos. 4:4:4 = maxima fidelidad de color (texto, capturas).",
          lowerLabel: "4:2:0",
          upperLabel: "4:4:4",
          presets: { s420: "4:2:0", s422: "4:2:2", s444: "4:4:4" },
        },
        progressive: {
          label: "Escaneo progresivo",
          hint: "Baseline = JPEG estandar. Progressive = se carga gradualmente en navegadores. Tamano de archivo similar.",
          lowerLabel: "Baseline",
          upperLabel: "Progressive",
          presets: { off: "Baseline", on: "Progressive" },
        },
      },
    },
    "png-resize": {
      actionTitle: "Redimensionar PNG",
      description: "Escala PNG por porcentaje — 5 filtros de remuestreo, hasta 200%, conserva el formato.",
      fidelityHint: "El remuestreo preserva las dimensiones pero puede suavizar el detalle al reducir. Elige entre 5 filtros.",
      options: {
        resizePercent: {
          label: "Escala de salida",
          hint: "Porcentaje del ancho y alto de origen (proporcion bloqueada).",
          lowerLabel: "Mas pequeno",
          upperLabel: "Mas grande",
          presets: { "25%": "25%", "33%": "33%", "50%": "50%", "66%": "66%", "75%": "75%" },
        },
      },
    },
    "jpg-resize": {
      actionTitle: "Redimensionar JPEG",
      description: "Escala JPEG por porcentaje — 5 filtros, calidad configurable, hasta 200%.",
      fidelityHint: "Remuestreo mas encode JPEG — salida con perdida. Re-codificar agrega otra generacion de compresion.",
      options: {
        resizePercent: {
          label: "Escala de salida",
          hint: "Porcentaje del ancho y alto de origen (proporcion bloqueada).",
          lowerLabel: "Mas pequeno",
          upperLabel: "Mas grande",
          presets: { "25%": "25%", "33%": "33%", "50%": "50%", "66%": "66%", "75%": "75%" },
        },
        quality: {
          label: "Calidad JPEG",
          hint: "Valores mas altos preservan mas detalle pero producen archivos mas grandes.",
          lowerLabel: "Archivo menor",
          upperLabel: "Mayor calidad",
          presets: { "web": "Web", "balanced": "Equilibrado", "high": "Alta", "native": "Nativo" },
        },
      },
    },
    "webp-compress": {
      actionTitle: "Comprimir WebP",
      description: "Re-codificacion same-format VP8L lossless. Pixeles preservados — sin perdida de calidad. WebP lossless ya optimizado mantiene el mismo tamano. Fuentes lossy AUMENTAN (expansion de entropia). Para reducir fotos de verdad, usa WebP→JPG.",
      fidelityHint: "Re-codificacion VP8L lossless — mismo formato, mismos pixeles. WebP lossless ya optimizado no se reducira mas. Fuentes lossy aumentan 2x-10x. Para reducir fotos, usa WebP→JPG.",
      options: {
        optimizationLevel: {
          label: "Nivel de optimizacion",
          hint: "Optimizacion Full prueba ambas configuraciones de predictor y reduce el tipo de color para el menor output.",
          lowerLabel: "Off",
          upperLabel: "Full",
          presets: { "off": "Off", "full": "Full" },
        },
        usePredictor: {
          label: "Predictor transform",
          hint: "Predictor espacial VP8L. On por defecto. Off puede producir archivos mas pequenos en imagenes con mucho ruido.",
          lowerLabel: "Off",
          upperLabel: "On",
          presets: { "off": "Off", "on": "On" },
        },
      },
    },
    "avif-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Convierte AVIF a JPEG — archivos mas pequenos con la calidad que elijas.",
      fidelityHint:
        "JPEG tiene perdida — irreversible. El AVIF ya venia comprimido; volver a codificar anade una segunda generacion con perdida. Fuentes 10/12-bit se normalizan a 8-bit. AVIF animado: elige un fotograma para exportar. La transparencia se aplana al fondo elegido.",
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
    "jpg-to-avif": {
      actionTitle: "Comprimir a AVIF",
      description: "Convierte JPEG a AVIF — recomprime con AV1 para entrega web mas liviana.",
      fidelityHint:
        "Dos generaciones con perdida: el JPEG ya estaba comprimido; AVIF anade otra pasada con perdida. La perdida de calidad es irreversible. La codificacion puede tardar varios segundos en imagenes grandes — usa mayor velocidad para resultados mas rapidos.",
      options: {
        quality: {
          label: "Calidad AVIF",
          hint: "Mayor calidad = archivo mas grande. Con perdida — no reversible.",
          lowerLabel: "Mas pequeno",
          upperLabel: "Mas nitido",
          presets: { web: "Web", balanced: "Balanceado", high: "Alto" },
        },
        speed: {
          label: "Velocidad de codificacion",
          hint: "Mayor velocidad = proceso mas rapido, a menudo archivo mas grande. Menor velocidad usa mas CPU para mejor compresion.",
          lowerLabel: "Archivo menor",
          upperLabel: "Mas rapido",
          presets: { quality: "Calidad", balanced: "Balanceado", fast: "Rapido" },
        },
      },
    },
    "png-to-avif": {
      actionTitle: "Comprimir a AVIF",
      description: "Convierte PNG a AVIF — formato AV1 moderno con controles de calidad y velocidad de codificacion.",
      fidelityHint:
        "La codificacion AVIF es con perdida — los pixeles se recomprimen con AV1. La transparencia significativa se conserva cuando existe. La codificacion puede tardar varios segundos en imagenes grandes; mayor velocidad termina antes pero puede producir archivos mas grandes.",
      options: {
        quality: {
          label: "Calidad AVIF",
          hint: "Mayor calidad = archivo mas grande. Con perdida — no reversible.",
          lowerLabel: "Mas pequeno",
          upperLabel: "Mas nitido",
          presets: { web: "Web", balanced: "Balanceado", high: "Alto" },
        },
        speed: {
          label: "Velocidad de codificacion",
          hint: "Mayor velocidad = proceso mas rapido, a menudo archivo mas grande. Menor velocidad usa mas CPU para mejor compresion.",
          lowerLabel: "Archivo menor",
          upperLabel: "Mas rapido",
          presets: { quality: "Calidad", balanced: "Balanceado", fast: "Rapido" },
        },
      },
    },
    "avif-to-png": {
      actionTitle: "Convertir a PNG",
      description: "PNG sin perdida desde AVIF — decodifica AV1 una vez y comprime el raster con DEFLATE.",
      fidelityHint:
        "El PNG de salida suele ser mucho mas grande que el AVIF en fotos — expandes AV1 comprimido a raster completo. Fuentes 10/12-bit se normalizan a 8-bit. AVIF animado: elige un fotograma para exportar.",
      options: {
        compression: {
          label: "Compresion PNG",
          hint: "Pixeles siempre sin perdida — mas compresion = archivo mas pequeno + proceso mas lento.",
          lowerLabel: "Mas rapido",
          upperLabel: "Mas pequeno",
          presets: { fast: "Rapido", balanced: "Balanceado", minimal: "Minimo" },
        },
      },
    },
    "svg-to-png": {
      actionTitle: "Rasterizar a PNG",
      description: "SVG vectorial → PNG al tamano de salida que elijas. Los pixeles se renderizan localmente con resvg.",
      fidelityHint:
        "No es un cambio de formato — el SVG se rasteriza a las dimensiones elegidas. Illustrator/Inkscape pueden diferir de resvg. Texto sin fuentes embebidas puede sustituir glifos.",
      options: {
        outputScale: {
          label: "Tamano de salida",
          hint: "Los presets en % escalan el viewBox intrinseco; los presets en px ajustan el lado mas largo. Se mantiene la proporcion.",
          presets: {
            p100: "100%",
            p200: "200%",
            px512: "512 px",
            px1024: "1024 px",
            px2048: "2048 px",
          },
        },
        compression: {
          label: "Compresion PNG",
          hint: "Pixeles raster sin perdida — mas compresion = archivo mas pequeno + proceso mas lento.",
          lowerLabel: "Mas rapido",
          upperLabel: "Mas pequeno",
          presets: { fast: "Rapido", balanced: "Balanceado", minimal: "Minimo" },
        },
      },
    },
    "svg-to-jpg": {
      actionTitle: "Rasterizar para Web",
      description: "SVG vectorial → JPEG al tamano de salida que elijas. Comprimido para web — renderizado localmente con resvg.",
      fidelityHint:
        "Vector → raster → JPEG con perdida — irreversible. La transparencia se aplana al fondo elegido. Texto sin fuentes embebidas puede sustituir glifos.",
      options: {
        outputScale: {
          label: "Tamano de salida",
          hint: "Los presets en % escalan el viewBox intrinseco; los presets en px ajustan el lado mas largo. Se mantiene la proporcion.",
          presets: {
            p100: "100%",
            p200: "200%",
            px512: "512 px",
            px1024: "1024 px",
            px2048: "2048 px",
          },
        },
        quality: {
          label: "Calidad JPEG",
          hint: "Mayor calidad = archivo mas grande. La perdida de calidad siempre es irreversible.",
          lowerLabel: "Mas liviano",
          upperLabel: "Mas fiel",
          presets: { web: "Web", balanced: "Balanceado", high: "Alto" },
        },
        background: {
          label: "Color de fondo",
          hint: "Las areas transparentes se aplana sobre este color antes de codificar JPEG.",
          swatches: { white: "Blanco", black: "Negro", gray: "Gris" },
        },
      },
    },
    "tiff-to-jpg": {
      actionTitle: "Comprimir para Web",
      description: "Convierte TIFF a JPEG — archivos mucho mas pequenos para compartir escaneos y masters en linea.",
      fidelityHint:
        "JPEG tiene perdida — irreversible. Fuentes 16-bit se normalizan a 8-bit. TIFF multipagina: elige una pagina. El alpha se aplana al fondo elegido.",
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
  },

  errors: {
    emptyInput: "El archivo esta vacio. Selecciona una imagen valida.",
    tooLarge: "El archivo es demasiado grande. El tamano maximo es 50 MB.",
    inputTooLarge: "La entrada supera el limite de sesion ({maxMb} MB). Usa un archivo mas pequeno o confirma el aviso de archivo grande.",
    wrongFormat: "Formato no soportado. Usa {formats}.",
    corrupt: "El archivo parece estar danado. Selecciona una imagen valida.",
    dimensionsTooLarge: "{width} × {height} ({megapixels} MP) supera el limite de {maxMp} MP del navegador.",
    dimensionsTooLargeGeneric:
      "Las dimensiones objetivo superan el limite de megapixeles del navegador. Elige un preset de redimension menor.",
    notAvailable: "Esta conversion aun no esta disponible.",
    tiffPalette: "TIFF con paleta (color indexado) no soportado. Reexporta como RGB o escala de grises.",
    tiffCmyk: "TIFF CMYK no soportado. Reexporta como RGB desde tu herramienta de impresion.",
    tiffPageRange: "Esa pagina TIFF no existe. Elige una pagina dentro del archivo.",
    icoEntryRange: "Esa entrada de tamano no existe. Elige un tamano dentro del archivo.",
    icoBmpLegacy:
      "Capa ICO estilo BMP legacy no soportada. Re-guarda el icono con una herramienta moderna (PNG-in-ICO).",
    avifDecodeFailed:
      "No se pudo decodificar este AVIF en el motor del navegador. Puede usar un perfil AV1 o contenedor que Fotos de Windows acepta con su codec del sistema pero zenavif aun no rasteriza.",
    avifDecodeFailedWithHint:
      "No se pudo decodificar este AVIF en el navegador. Fotos de Windows usa otro codec del sistema (WIC + extension AV1); el archivo probablemente es valido pero nuestro decodificador Wasm aun no lo soporta.",
    avifUnsupported:
      "Esta variante AVIF aun no esta soportada en el motor del navegador. Prueba reexportar desde tu editor.",
    avifCorrupt: "Contenedor AVIF invalido. El archivo puede estar truncado o no ser una imagen AVIF real.",
    avifMiafBrand:
      "Contenedor MIAF (marca mif1) sin pista AVIF decodificable. Reexporta con marca principal avif si persiste.",
    avifFrameRange: "Ese fotograma no existe. Elige un fotograma dentro del archivo.",
    engineNotReady: "El motor de transmutacion aun esta iniciando. Intentalo de nuevo.",
    generic: "La transmutacion fallo. Intentalo de nuevo.",
  },

  notices: {
    performance: {
      L1: "Esta conversion puede tardar unos segundos segun el tamano y las opciones.",
      L2: "La estimacion y transmutacion pueden tardar mas en este archivo — el proceso corre en tu navegador en un solo nucleo.",
      L2SlowEncode: "Velocidad de encode baja — prioriza compresion sobre tiempo. Actualizar la estimacion o transmutar puede tardar varios minutos en imagenes grandes. Prueba un preset de velocidad mas alto.",
      L3: "Archivo grande o ajustes exigentes — la conversion puede tardar varios minutos. Evita mover sliders mientras corre una estimacion.",
      L3SlowEncode: "Velocidad de encode baja en un archivo grande o elevado — puede tardar varios minutos. Sube la velocidad de encode o reduce dimensiones antes de transmutar.",
    },
    limit: {
      outputSize:
        "La salida estimada es {size} — por encima del umbral habitual de {limit}. La conversion puede continuar; el proceso puede tardar mas y usar mas memoria.",
      nearPixelLimit:
        "Esta imagen esta cerca del limite de {megapixels} MP del navegador — la conversion usa mucha memoria.",
      highRamPeak:
        "Modo archivo grande — el pico de memoria sera mayor de lo habitual. Cierra otras pestanas pesadas si el navegador va lento.",
      astroTier:
        "Dimensiones muy grandes — usa los presets de redimension arriba antes de convertir.",
      riskModeActive:
        "Modo Risk activo — limites de pixeles y tamano desactivados. Vigila la memoria y mantén esta pestaña abierta.",
    },
    fidelity: {
      bmpPngGrowth:
        "BMP a PNG suele aumentar el tamano — PNG almacena el raster sin comprimir.",
      svgVectorToRaster:
        "El SVG se rasteriza al tamano de salida elegido — no es una exportacion vectorial reversible.",
      svgFontSubstitution:
        "Este SVG contiene texto — los glifos pueden diferir de tu app de diseno si no hay fuentes embebidas.",
      svgRendererSubset:
        "Filtros y funciones SVG avanzadas pueden renderizarse distinto que en Illustrator o Inkscape.",
      svgJpegLossy:
        "JPEG tiene perdida — el detalle vectorial y la transparencia se pierden permanentemente tras la rasterizacion.",
      jpegResizeGenerational:
        "Re-codificar un JPEG despues de redimensionar agrega otra generacion con perdida — el detalle se degrada acumulativamente.",
      resizeExtremeDownscale:
        "La reduccion extrema descarta permanentemente el detalle fino. La salida puede verse suave o sin textura.",
      resizeUpscale:
        "Escalado — no se crea nuevo detalle. Los pixeles se interpolan de los vecinos. El tamano del archivo aumentara significativamente.",
      resizeAdvancedScale: {
        general: "Escalado superior al 200% — los pixeles estan fuertemente interpolados. El resultado se vera suave independientemente del filtro.",
        lanczos: "⚠ Lanczos3 por encima del 200% produce fuertes artefactos de anillos (halos en bordes). Considera cambiar a CatmullRom o Triangle.",
        blur: "Por encima del 200%, este filtro producira un resultado visiblemente borroso. No se crea nuevo detalle.",
      },
      jpegGenerational:
        "Re-codificar un JPEG agrega otra generacion con perdida — los artefactos se acumulan con cada re-codificacion. Usalo solo para reduccion de tamano puntual.",
      pngCompressFast:
        "La codificacion rapida sacrifica compresion por velocidad. El archivo puede ser mas grande que en niveles superiores.",
      pngCompressSlow:
        "La maxima compresion produce el archivo mas pequeno pero es mas lenta. Los pixeles permanecen identicos — calidad sin perdida.",
      compressLarger:
        "Con estos ajustes, la salida puede ser mas grande que la entrada. Prueba un nivel de compresion mas alto o una calidad mas baja para reducir el tamano.",
      jpegSubsampling444:
        "El submuestreo de croma 4:4:4 conserva todo el detalle de color por pixel — ideal para texto, capturas de pantalla y graficos con bordes nitidos. Produce archivos mas grandes que 4:2:0.",
      pngOptimized:
        "La optimizacion completa prueba multiples estrategias de filtro y reduce el tipo de color para la mejor compresion. La codificacion puede ser 3-6× mas lenta pero la salida puede ser 10-30% mas pequena. Pixeles identicos — sin perdida.",
      pngLossy:
        "La compresion con perdida reduce la profundidad de color mediante cuantizacion de paleta. La calidad visual cambia permanentemente — esto es irreversible. Ideal para fotos donde una reduccion del 60-80% justifica la perdida de calidad.",
      pngZopfli:
        "El modo Archival usa compresion Zopfli — 3-8% mas pequeno que el estandar pero extremadamente lento (minutos para imagenes grandes). Recomendado solo para almacenamiento a largo plazo, no para uso diario.",
      webpLossySource:
        "WebP lossy detectado. Re-codificar como VP8L lossless aumentara el tamano del archivo (expansion de entropia — igual que JPEG→PNG). Considera WebP → JPG para reduccion genuina de tamano.",
      webpLosslessSource:
        "WebP lossless re-codificado con optimizacion VP8L. Si el archivo ya fue codificado por Camaleon u otro encoder VP8L, puede que no se reduzca mas — la compresion lossless tiene un limite.",
      webpMetadataStripped:
        "Metadatos (EXIF, XMP, ICC) eliminados por politica de privacidad. Ningun metadato de origen se transfiere al output.",
      webpCompressLosslessLimit:
        "WebP lossless ya en su limite de compresion. VP8L no puede reducir la entropia mas — los pixeles se almacenan exactamente. Para archivos mas pequenos en fotos, usa WebP → JPG (lossy).",
    },
    recommendations: {
      lossyToLossless:
        "Fuente lossy detectada. Convertir a lossless aumentara el tamano del archivo (expansion de entropia — igual que JPEG→PNG). Para reduccion de tamano, prueba {action:0}.",
      losslessCeiling:
        "Este archivo ya esta comprimido cerca de su limite lossless. No es posible una reduccion significativa a este nivel de calidad — prueba la optimizacion Full o considera otro formato para archivos mas pequenos.",
      jpegGenerational:
        "Re-codificar un JPEG agrega otra generacion de perdida. Para edicion o archivado, usa {action:0} una vez como maestro intermedio para prevenir la perdida acumulativa de calidad.",
      alphaFlatten:
        "Esta imagen tiene transparencia. JPEG no puede almacenar alpha — las areas transparentes se aplanaran al color de fondo seleccionado. Para preservar el canal alpha, prueba {action:0} o elige una salida lossless.",
      compressLarger:
        "El output es mas grande que el source con estas opciones. {action:0}",
    },
    estimate: {
      cheapSlow: "Calculando…",
      moderateSlow: "Calculando — este formato puede tardar un momento para un tamano preciso.",
      expensiveSlow:
        "Calculando — esta herramienta ejecuta un encode de vista previa completo para estimar el tamano.",
      errorRaw: "{message}",
    },
    transmute: {
      slowL2: "Transmutando — puede tardar con los ajustes actuales.",
      slowL3: "Transmutando — archivo grande o ajustes exigentes; mantén esta pestaña abierta.",
    },
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
    searchLabel: "Buscar herramientas",
    searchPlaceholder: "Buscar por nombre o formato…",
    noResults: "Ninguna herramienta coincide con tu busqueda",
    close: "Cerrar",
    categoryImage: "Imagen",
    categoryOptimize: "Optimizar",
    categorySoon: "Proximamente",
    lanesAria: "Categoría de herramientas",
    lanes: {
      convert: "Transmutar",
      optimize: "Optimizar",
    },
    closeHint: "Esc para cerrar",
    groups: {
      avif: "AVIF",
      svg: "SVG",
      "jpeg-png": "JPEG y PNG",
      webp: "WebP",
      "gif-bmp": "GIF y BMP",
      archival: "Archivo y texturas",
      icons: "Iconos y favicons",
    },
  },
  noticeActions: {
    tryWebpToJpg: "WebP → JPG",
    tryJpgCompress: "Comprimir JPEG",
    tryPngAsMaster: "Usar PNG como maestro",
    tryPngCompress: "Comprimir PNG",
    tryHigherCompression: "Subir compresion",
    tryLowerQuality: "Bajar calidad",
  },
};

export default es;
