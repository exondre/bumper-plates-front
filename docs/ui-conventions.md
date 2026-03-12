# UI Conventions — Bumper Plates

Archivo de referencia para convenciones UI/UX que costaron iterar.
**Leer antes de tocar layout, nav, header o safe areas.**

---

## 1. Shell de la app (app.component)

### Template (`app.component.html`)
```html
@if (!hideHeader) {
  <header class="navbar custom-header navbar-light bg-body border-bottom justify-content-center">
    <a class="navbar-brand d-flex align-items-center" routerLink="/home">
      <img src="assets/icons/icon.svg" width="30" height="30" class="me-2" alt="logo">
      <span>Bumper Plates</span>
    </a>
  </header>
}
<main class="app-content" [ngClass]="{ 'has-header': !hideHeader, 'no-header': hideHeader }">
  <router-outlet></router-outlet>
</main>
<nav class="nav custom-nav nav-pills nav-fill flex-nowrap">
  <!-- tabs -->
</nav>
```

### Lógica de `hideHeader`
- El header **solo se oculta en `/home`**.
- Se calcula en el constructor y en cada `NavigationEnd`.
- `/home` tiene su propio hero, no necesita header global.

---

## 2. Estilos del shell (`app.component.scss`)

### Layout raíz
```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100dvh;              // dvh para browsers modernos
  @media (display-mode: standalone) {
    height: 100vh;             // PWA standalone usa vh clásico
  }
  overflow: hidden;            // el scroll ocurre dentro de .app-content
  position: relative;
}
```

**Por qué `overflow: hidden` en :host:**
En PWA modo standalone, sin esto el viewport se extiende debajo del home indicator de iOS y aparece scroll fantasma en el shell.

### Área de contenido scrollable
```scss
.app-content {
  flex: 1;
  min-height: 0;                // imprescindible para que flex child scrollee
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(4.5rem + max(env(safe-area-inset-bottom), 8px));
}

.has-header {
  padding-top: calc(4rem + env(safe-area-inset-top));
}

.no-header {
  padding-top: 0;
}
```

**Por qué `min-height: 0`:** un flex child no puede ser más pequeño que su contenido sin esto. Sin él, el child crece y el scroll nunca activa.

**Por qué `4rem` en has-header:** el header mide ~56px (navbar estándar Bootstrap) + safe-area-inset-top. `4rem = 64px` da un pequeño colchón para que el contenido no quede tapado.

**Por qué `4.5rem` en padding-bottom:** el nav tiene `height: 4rem`. El 0.5rem extra es colchón para que el último elemento de la lista no quede justo bajo el borde del nav.

### Header
```scss
header {
  &.navbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--bs-body-bg);
    padding-top: env(safe-area-inset-top);   // respeta notch/dynamic island
  }

  &.custom-header {
    background-color: rgba(var(--bs-body-bg-rgb), 0.2) !important;
    -webkit-backdrop-filter: blur(5px) saturate(180%);
    backdrop-filter: blur(5px) saturate(180%);
    font-weight: 500;
  }
}
```

**Por qué `position: absolute` en header:** para que el glassmorphism funcione (el contenido se ve a través). Si fuera `position: sticky` o static, bloquearía el scroll.

### Tab bar (nav flotante)
```scss
nav.custom-nav {
  position: absolute !important;
  bottom: max(env(safe-area-inset-bottom), 8px);   // nunca toca el borde en iPhone X+
  left: .85rem;
  right: .85rem;

  // Liquid Glass
  border-radius: 50px;
  padding: .25rem .25rem;
  height: 4rem;
  border: 0.5px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.12),
    0 1px 0 rgba(255, 255, 255, 0.9) inset;
  background-color: rgba(var(--bs-body-bg-rgb), 0.2) !important;
  -webkit-backdrop-filter: blur(5px) saturate(180%);
  backdrop-filter: blur(5px) saturate(180%);
  font-weight: 700;

  .nav-link {
    border-radius: 50px !important;
    transition: background-color 0.15s ease;

    &.active {
      background-color: rgba(13, 110, 253, 0.85);   // azul Bootstrap semitransparente
      box-shadow: 0 1px 4px rgba(13, 110, 253, 0.3);
    }
  }
}
```

**Por qué `position: absolute` y no `fixed`:** en PWA standalone iOS, `position: fixed` puede tener comportamiento errático con el teclado virtual. `absolute` en un :host con `height: 100dvh; overflow: hidden` es equivalente y más predecible.

**Por qué `max(env(safe-area-inset-bottom), 8px)`:** en iPhones sin notch `safe-area-inset-bottom = 0`, quedaría pegado al borde. El mínimo de `8px` da margen visual.

**Por qué `!important` en background-color del nav:** Bootstrap agrega estilos inline de fondo al `.nav`. Sin `!important` el glassmorphism no funciona.

---

## 3. Safe areas — regla general

| Elemento | Propiedad | Valor |
|---|---|---|
| Header | padding-top | `env(safe-area-inset-top)` |
| .has-header | padding-top | `calc(4rem + env(safe-area-inset-top))` |
| .app-content | padding-bottom | `calc(4.5rem + max(env(safe-area-inset-bottom), 8px))` |
| Nav | bottom | `max(env(safe-area-inset-bottom), 8px)` |
| Páginas con scroll propio (home, etc.) | padding-bottom | `calc(env(safe-area-inset-bottom))` — no sumar el nav porque .app-content ya lo hace |

**Regla clave:** el padding-bottom del nav ya está absorbido por `.app-content`. Los componentes **no deben agregar** padding-bottom adicional para el nav — solo para su propio safe-area si tienen scroll interno.

---

## 4. Dark mode

- Controlado por `data-bs-theme` en `<html>` (`light` | `dark`).
- Bootstrap 5 cambia todas sus variables CSS automáticamente.
- Preferencia en `SharedService` → `Preferences.colorScheme` → `LocalStorage`.
- Los componentes usan variables Bootstrap (`var(--bs-body-bg)`, `var(--bs-border-color)`, etc.) y heredan dark mode sin esfuerzo.
- **Nunca usar colores hardcodeados** en componentes; usar siempre variables Bootstrap o `var(--bs-*)`.

---

## 5. Convenciones de componentes

### Páginas (routes)
- Usan `.container` de Bootstrap para max-width y padding horizontal.
- **No** agregan padding-top propio (ya lo maneja `.has-header`).
- **No** agregan padding-bottom propio para el nav (ya lo maneja `.app-content`).

### Home (excepción)
- No usa `.container` — layout propio con flexbox.
- Agrega `padding-top: calc(1rem + env(safe-area-inset-top))` porque no tiene header global.
- `padding-bottom: calc(env(safe-area-inset-bottom))` — el `.app-content` ya maneja el espacio del nav.

### Tabs del nav
- Estructura: `<a class="nav-link d-flex flex-column align-items-center justify-content-center">`
- Icono Bootstrap Icons arriba, `<span>` con label abajo.
- `min-height: 44px` en `.nav-link` para cumplir tamaño mínimo táctil de Apple.
- Tab de Entrenamientos tiene `d-none` (oculto por ahora, no eliminar).

---

## 6. Qué NO hacer

- **No usar `position: fixed`** en la nav — usar `absolute` dentro del :host overflow:hidden.
- **No agregar scroll** al `:host` de los componentes hoja — el scroll es responsabilidad de `.app-content`.
- **No hardcodear colores** — usar variables CSS de Bootstrap.
- **No mover Export/Import de vuelta a Marcas** — pertenecen a Ajustes.
- **No remover `!important`** del background del nav sin probar en Safari/PWA.
- **No cambiar `height: 100dvh`** sin probar en iOS Safari y en modo standalone.
