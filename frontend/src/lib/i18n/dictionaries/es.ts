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
          title: "19 herramientas de conversión",
          body: "PNG, JPEG, WebP, GIF, BMP, TIFF, ICO, TGA y AVIF (codificar + decodificar) — rutas con y sin pérdida donde importa.",
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
    cancel: "Cancelar",
    transmuteButton: "Transmutar",
    transmuteSyncing: "Actualizando estimación…",
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
    },
    fidelity: {
      bmpPngGrowth:
        "BMP a PNG suele aumentar el tamano — PNG almacena el raster sin comprimir.",
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
