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
      modeOffline: "Sin conexion",
      modeOfflineActive: "Modo sin conexion",
      modeOnlineDetail: "Red disponible. Las herramientas en cache funcionan; los motores nuevos se descargan bajo demanda.",
      modeOfflineDetail: "Sin red detectada. Solo estan disponibles la app y motores en cache.",
      modeOfflineActiveDetail:
        "Esta pestaña usa solo la app y motores en cache — las peticiones de red estan bloqueadas. Tu Wi‑Fi puede seguir conectado.",
      badgeSwActive: "Service worker",
      badgeSwPending: "SW pendiente",
      badgeNetworkUp: "Red activa",
      badgeNetworkDown: "Sin red",
      statusLabel: "Motores en cache",
      enginesHint: "{pct}% de motores Wasm almacenados en este dispositivo.",
      statusOnline: "En linea — service worker activo.",
      statusOffline: "Sin conexion — usando app y motores en cache.",
      swPending: "Registrando service worker…",
      swUnsupported: "La cache sin conexion no esta disponible en este navegador.",
      storageLabel: "Tamano de cache Wasm",
      storageHint: "Cache Storage aproximada usada por motores de conversion.",
      cacheProgressLabel: "Cobertura de motores en cache",
      fullToolkitLabel: "Descargar todas las herramientas",
      fullToolkitHint:
        "Opta por guardar todos los motores Wasm (~10–17 MB). Las 21 herramientas funcionan sin conexion sin visitarlas antes.",
      precacheProgress: "Descargando motores… {done}/{total}",
      precacheDone: "Todas las herramientas estan en cache para uso sin conexion.",
      precacheFailed: "No se pudieron descargar todos los motores. Intentalo de nuevo en linea.",
      needOnline: "Conectate a internet para descargar los motores sin conexion.",
      clearAction: "Borrar cache sin conexion",
      clearDone: "Cache sin conexion borrada.",
      mobileWarning:
        "Los navegadores moviles pueden eliminar datos en cache por falta de espacio. Se recomienda escritorio para el kit completo.",
      offlineModeTitle: "Modo sin conexion",
      offlineModeHint:
        "Trabaja solo desde cache en esta pestaña. Requiere una visita previa en linea con service worker activo y herramientas en cache (usa “Descargar todas las herramientas” arriba).",
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
  },

  offline: {
    banner: "Estás sin conexión — las herramientas en caché siguen funcionando en este dispositivo.",
    bannerForced: "Modo sin conexion — solo cache en esta pestaña.",
    noticeOffline: "Sin conexión de red. Las herramientas en caché siguen funcionando en este dispositivo.",
    noticeOfflineMode: "Modo sin conexion — solo cache. Desactivalo cuando necesites actualizaciones.",
    noticeServerDown:
      "Servidor de la app inaccesible (localhost detenido u host offline). Wasm en caché sigue si ya estaba cargado.",
    noticeExitOfflineMode: "Desactivar modo sin conexion",
    updateAvailable: "Hay una nueva versión de Camaleon lista.",
    updateReload: "Recargar",
    uncachedTool:
      "Esta herramienta aún no está en caché. Conéctate a internet una vez para descargar su motor, o activa «Descargar todas las herramientas» en Ajustes.",
    fallbackTitle: "Estás sin conexión",
    fallbackBody:
      "Camaleon necesita conexión en la primera visita. Abre la app en línea y luego la conversión sin conexión funcionará para las herramientas en caché.",
    fallbackHome: "Volver al inicio",
  },

  connectivity: {
    online: "En linea",
    offline: "Sin conexion",
    offlineMode: "Modo sin conexion",
    serverDown: "Servidor inaccesible",
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
      jumpNavAria: "Ir a familias de herramientas",
      tabsAria: "Familias de herramientas",
      densityAria: "Densidad de la lista",
      jumpLinks: {
        modern: "AVIF",
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
    dragLabel: "Suelta para transmutar",
    processingLabel: "Transmutando...",
    ariaLabel: "Selecciona un archivo de imagen para transmutar",
    pageOverlayLabel: "Suelta para transmutar este archivo",
  },

  panel: {
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
    categorySoon: "Proximamente",
    closeHint: "Esc para cerrar",
    groups: {
      modern: "Formatos modernos",
      "jpeg-png": "JPEG y PNG",
      webp: "WebP",
      "gif-bmp": "GIF y BMP",
      archival: "Archivo y texturas",
      icons: "Iconos y favicons",
    },
  },
};

export default es;
