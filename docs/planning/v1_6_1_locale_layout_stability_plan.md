# v1.6.1 — Estabilidad de layout + Scrollbar Camaleón (UI-10)

> **Author:** Chief Architect (Cursor)  
> **Date:** 2026-06-07 (rev. 2)  
> **Status:** Planned — solo fase de diseño (sin implementación aún)  
> **Target release:** Frontend **v1.6.1** (o parche dentro de v1.6.x)  
> **Trigger:** Cambio EN ↔ ES en landing provoca salto horizontal del `main`; scrollbar nativo de Windows roba ancho al viewport

---

## 1. Diagnóstico

### 1.1 Entorno confirmado

| Parámetro | Valor |
|-----------|--------|
| Monitor principal | **1920 × 1080** |
| Navegador | **Google Chrome** (scrollbar clásico de Windows — ocupa layout) |
| SO | Windows con **barra de tareas inferior activa** → reduce altura útil del viewport |
| Monitor secundario | Sin barra de tareas → más altura útil |

### 1.2 Síntoma reportado

Sección afectada: `ToolGrid` (`<section class="mx-auto max-w-4xl px-6 pb-20">`).

| Medida | EN | ES | Δ |
|--------|----|----|---|
| Ancho interno del contenido | 848 px | 848 px | **0** |
| Alto interno del contenido | 412 px | 452 px | **+40 px** |
| Margen lateral (`mx-auto`) | ~512 px | ~504.5 px | **−7.5 px** por lado |

### 1.3 Validación A/B (usuario)

| Escenario | Scrollbar en ES | ¿Se mueve el `main`? |
|-----------|-----------------|----------------------|
| Monitor 1080p + barra Windows | **Sí aparece** | **Sí** — salto lateral |
| Monitor sin barra Windows | **No aparece** | **No** — estable |

**Conclusión confirmada:** el desplazamiento horizontal **no** es por ancho de texto ni por `max-w-4xl`. Es el **scrollbar nativo de Chrome en Windows**, que al aparecer resta ~15 px al ancho del viewport y desplaza todo lo centrado con `mx-auto` (~7.5 px por lado).

En 1920×1080 con taskbar, la altura útil (~~1000–1040 px según escala) queda justo en el umbral: EN cabe sin scroll; ES (+40 px) activa overflow → scrollbar → layout shift.

### 1.4 Segunda causa — reflow vertical (menor)

Texto ES más alto en `ToolCard` (descripciones + `fidelityHint`) estira el grid +40 px. Esto **dispara** el scrollbar en el escenario límite; también mueve el footer hacia abajo. Se aborda en Fase C con `min-height` reservado — independiente del scrollbar.

### 1.5 Alcance del landing

```
page.tsx
├── Hero          → max-w-3xl  (768 px)
├── PrivacyBanner → max-w-3xl  (768 px)
└── ToolGrid      → max-w-4xl  (896 px)   ← sección medida
```

Header/Footer: `max-w-6xl`. Unificación en Fase D (consistencia, no urgencia).

---

## 2. Objetivos

| ID | Objetivo | Métrica de éxito |
|----|----------|------------------|
| O1 | Cero salto horizontal al togglear EN/ES | Márgenes del `ToolGrid` ±0 px en 1920×1080 + taskbar |
| O2 | Scrollbar funcional sin robar ancho al layout | `clientWidth` constante con/sin overflow |
| O3 | Scrollbar premium acorde a Verde Camaleón | Overlay fino, auto-hide, dark/light |
| O4 | Solo en entorno PC/desktop | Móvil/tablet táctil sin overlay custom |
| O5 | Sin acortar textos i18n | Copy ES/EN intacto |
| O6 | Accesibilidad preservada | Rueda, teclado, touch; respeta `prefers-reduced-motion` |

---

## 3. Propuesta central — Scrollbar Camaleón (overlay)

### 3.1 Qué pide el usuario (traducido a requisitos técnicos)

> Un scrollbar con la **misma funcionalidad** que el nativo, que **aparezca cuando haga falta**, pero que **no empuje ni desplace** el contenido de la página — además, más moderno y agradable.

Eso es un **scrollbar overlay** (como macOS/iOS), no un scrollbar nativo estilizado. En Windows, `::-webkit-scrollbar { width: 8px }` **sigue ocupando gutter** en el layout; solo cambia el aspecto, no el comportamiento de shift.

### 3.2 Enfoques evaluados

| Enfoque | ¿Evita layout shift? | ¿Custom visual? | Complejidad | Veredicto |
|---------|----------------------|-----------------|-------------|-----------|
| **A — Overlay custom (recomendado)** | ✅ Sí — flota sobre el contenido | ✅ Total | Media | **✅ Elegido** |
| B — `scrollbar-gutter: stable` + CSS nativo | ⚠️ No shift, pero **siempre** reserva ~15 px | ⚠️ Limitado (`scrollbar-color`) | Baja | Fallback / `prefers-reduced-motion` |
| C — Librería (`overlayscrollbars`, etc.) | ✅ | ✅ | Media + dep | ❌ Evitar nueva dep npm por ahora |
| D — `overflow: overlay` | ✅ En teoría | — | — | ❌ Deprecado / inconsistente |

### 3.3 Arquitectura — Scrollbar Camaleón

```
┌──────────────────────────────────────────────────────────────┐
│  Header                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Main (ancho estable — sin gutter de scrollbar)        │█ │ ← thumb overlay
│  │  Hero · Banner · ToolGrid                              │█ │   position: fixed
│  │                                                         │░ │   pointer-events: auto
│  └────────────────────────────────────────────────────────┘  │
│  Footer                                                       │
└──────────────────────────────────────────────────────────────┘
     ▲ scroll real en document/html (nativo, oculto visualmente)
     ▲ thumb sincronizado con scrollTop / scrollHeight
```

**Componentes nuevos (propuesta):**

| Archivo | Rol |
|---------|-----|
| `components/layout/OverlayScrollbar.tsx` | UI del track + thumb; montado en `layout.tsx` |
| `hooks/useOverlayScrollbar.ts` | Sincroniza scroll, resize, visibilidad, drag |
| `globals.css` | Tokens `.camaleon-scrollbar-*`, ocultar nativo en desktop |

**Activación por media query (solo PC):**

```css
/* Puntero fino + hover = ratón/trackpad de escritorio */
@media (hover: hover) and (pointer: fine) {
  html.camaleon-overlay-scroll {
    scrollbar-width: none;           /* Firefox */
  }
  html.camaleon-overlay-scroll::-webkit-scrollbar {
    display: none;                   /* Chrome / Edge / Safari */
  }
}
```

En **móvil/tablet táctil** (`pointer: coarse` o sin hover): **scrollbar nativo del SO** (overlay en iOS, oculto hasta scroll en Android). Sin componente custom — cero riesgo en touch.

### 3.4 Diseño visual (Verde Camaleón)

| Token | Dark | Light |
|-------|------|-------|
| Track | `transparent` o `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)` |
| Thumb reposo | `rgba(155,161,168,0.45)` (`text-secondary` @ 45%) | `rgba(107,107,107,0.4)` |
| Thumb hover / drag | `rgba(34,197,94,0.55)` (accent) | `rgba(22,163,74,0.5)` |
| Ancho thumb | **6 px** reposo → **8 px** hover | — |
| Radio | `9999px` (pill) | — |
| Offset derecho | **4 px** del borde del viewport | — |
| Z-index | `z-50` (por encima del contenido, bajo modales `z-[100]`) | — |

**Comportamiento UX:**

| Estado | Comportamiento |
|--------|----------------|
| Sin overflow | Componente no renderiza track/thumb |
| Scroll activo | Thumb visible, sigue posición |
| Idle ~1.2 s | Fade out thumb (opacity 0) — estilo macOS |
| Hover en track | Thumb visible + ensancha |
| Drag thumb | Scroll document; thumb accent sólido |
| Click en track | Page up/down hacia el punto clicado |
| `prefers-reduced-motion` | Sin fade; thumb siempre visible cuando hay overflow; **o** fallback a `scrollbar-gutter: stable` + scrollbar nativo estilizado |

**Clase en `<html>`:** añadir `camaleon-overlay-scroll` desde `layout.tsx` (server) para evitar FOUC del scrollbar nativo antes de hidratar.

### 3.5 Funcionalidad paritaria con nativo

| Acción | Soporte |
|--------|---------|
| Rueda del ratón | ✅ Nativa (document scroll) |
| Trackpad two-finger | ✅ Nativa |
| Teclado (↑↓ PgUp/PgDn Home/End Espacio) | ✅ Nativa |
| Arrastrar thumb | ✅ Hook custom |
| Click en track | ✅ Hook custom |
| Touch en móvil | ✅ Scroll nativo (sin overlay custom) |
| Shift + rueda horizontal | N/A (solo scroll vertical del doc) |

### 3.6 Fallbacks

| Condición | Comportamiento |
|-----------|----------------|
| `prefers-reduced-motion: reduce` | No overlay; `scrollbar-gutter: stable` + `scrollbar-color` nativo estilizado |
| JS deshabilitado | Scroll nativo visible (sin clase que oculte) — progressive enhancement |
| `ResizeObserver` no disponible | Polling en `resize` event |

---

## 4. Estrategia por fases (revisada)

### Fase A — Scrollbar Camaleón overlay (P0)

**Qué:** Implementar overlay scrollbar en desktop; ocultar nativo; cero layout shift.

**Entregables:**
1. `OverlayScrollbar` + hook de sincronización
2. Estilos en `globals.css`
3. Integración en `layout.tsx` (`<html className="camaleon-overlay-scroll">`)
4. QA en **1920×1080 + barra Windows + Chrome**

**Esfuerzo:** ~4–6 h · **Riesgo:** medio (drag/resize edge cases).

**No hace falta** librería externa; el scope es scroll del `document` únicamente (no scroll interno en paneles — eso queda para v1.7 si hace falta).

---

### Fase B — Altura reservada ToolCard / ToolGrid (P1)

**Qué:** `min-height` en descripciones, hints y cards para el idioma más alto (ES), sin truncar copy.

| Táctica | Detalle |
|---------|---------|
| C1 | `min-h` en `<p>` descripción (~3 líneas `text-sm`) |
| C2 | `min-h` en `fidelityHint` (solo JPG/PNG activos) |
| C3 | `min-h` uniforme en `<Card>` del grid |
| C4 | Opcional: `min-h` en `<section>` de `ToolGrid` |

**Beneficio:** reduce probabilidad de que ES active scroll en viewports límite; menos “empujón” vertical del footer.

**Esfuerzo:** ~2 h · **Rieszo:** bajo.

---

### Fase C — Shell de contenido unificado (P2)

Un solo `max-w-4xl px-6` en `page.tsx` para Hero + PrivacyBanner + ToolGrid.

**Esfuerzo:** ~1 h · **Riesgo:** bajo.

---

### Fase D — Pulido y regresión (P3, opcional)

| ID | Idea |
|----|------|
| D1 | Screenshot Playwright EN/ES @ 1920×1080 con taskbar simulada (`viewport` height ~1000) |
| D2 | Extender overlay a `dialog` con scroll interno si crece en v1.7 |
| D3 | Métrica CLS en Lighthouse tras Fase A |

---

## 5. Orden de ejecución

```
Fase A (Scrollbar Camaleón)  →  QA 1920×1080+taskbar  →  Fase B  →  Fase C  →  D
```

**Racional:** Fase A resuelve la causa raíz confirmada (layout shift horizontal). Fase B reduce cuándo aparece scroll. Fase C es deuda visual.

---

## 6. Criterios de aceptación (QA)

### Entorno obligatorio
- **1920 × 1080**, Chrome, **barra de tareas Windows visible**, escala 100%

### Checklist
- [ ] Toggle EN → ES → EN: márgenes laterales del `ToolGrid` **idénticos** (±0 px)
- [ ] `document.documentElement.clientWidth` **no cambia** al togglear idioma
- [ ] Con overflow: scrollbar Camaleón visible al scroll; auto-hide tras idle
- [ ] Sin overflow: ningún thumb/track visible; sin gutter vacío
- [ ] Drag thumb y click track funcionan
- [ ] Teclado y rueda sin regresión
- [ ] Dark / Light: thumb y track legibles
- [ ] iPhone / Android emulator: scroll táctil nativo; sin overlay custom
- [ ] `prefers-reduced-motion`: fallback usable
- [ ] F5 + cookie locale: sin regresión FOUC (v1.6.1 prefs)
- [ ] Footer: salto vertical mínimo tras Fase B

### Monitor secundario (control)
- [ ] Sin taskbar, ES sin scroll: sigue estable (regresión cero)

---

## 7. Fuera de alcance

- Acortar strings i18n
- Librerías npm de scrollbar de terceros (salvo reconsideración explícita)
- Scroll horizontal custom
- Cambiar `max-w-*` para “evitar” scroll (no ataca la causa)

---

## 8. Resumen ejecutivo

| Problema | Causa confirmada | Solución |
|----------|------------------|----------|
| Márgenes 512 → 504.5 px | Scrollbar nativo Windows roba ~15 px al aparecer | **Scrollbar Camaleón overlay** (Fase A) |
| Solo pasa con taskbar / menos altura | Umbral 1080p — ES +40 px activa overflow | Fase A + Fase B (`min-h`) |
| Scrollbar feo / genérico | Chrome Windows clásico | Diseño accent, auto-hide, pill |
| Móvil | Scroll nativo táctil distinto | Sin overlay custom — media query |

**Decisión de producto:** en lugar de reservar hueco con `scrollbar-gutter: stable` (contenido siempre más estrecho), preferimos **overlay flotante** — ancho de página idéntico con o sin scroll, alineado con la expectativa del usuario y la estética premium del proyecto.

**Siguiente paso:** implementar Fase A (`OverlayScrollbar` + hook + CSS), validar en tu monitor 1080p con barra Windows; luego Fase B y commit v1.6.1.

---

## 9. Referencias en código

| Archivo | Rol actual / futuro |
|---------|---------------------|
| `frontend/src/app/globals.css` | Tokens scrollbar + ocultar nativo desktop |
| `frontend/src/app/layout.tsx` | Clase `camaleon-overlay-scroll` + montar overlay |
| `frontend/src/components/layout/OverlayScrollbar.tsx` | **Nuevo** — UI overlay |
| `frontend/src/hooks/useOverlayScrollbar.ts` | **Nuevo** — lógica scroll |
| `frontend/src/components/transmute/ToolGrid.tsx` | Sección medida |
| `frontend/src/components/transmute/ToolCard.tsx` | Fase B — min-heights |
| `frontend/src/app/page.tsx` | Fase C — shell unificado |
