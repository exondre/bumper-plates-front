# UI Conventions — Bumper Plates

Reference file for UI/UX conventions that took iteration to get right.
**Read this before touching layout, nav, header, or safe areas.**

---

## 1. App shell (app.component)

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

### PWA update sheet
- Rendered at root level in `app.component.html`, after the `<nav>`.
- z-index: 20 (above header at 10, above nav).
- Must handle three visible states: `available`, `activating`, and `error`.
- Positioned absolutely above the tab bar with safe-area-aware bottom offset.
- Styled with the same glassmorphism pattern as header and nav.

### `hideHeader` logic
- The header is **only hidden on `/home`**.
- Computed in the constructor and on each `NavigationEnd` event.
- `/home` has its own hero; it does not need the global header.

---

## 2. Shell styles (`app.component.scss`)

### Root layout
```scss
:host {
  display: flex;
  flex-direction: column;
  height: 100dvh;              // dvh for modern browsers
  @media (display-mode: standalone) {
    height: 100vh;             // PWA standalone uses classic vh
  }
  overflow: hidden;            // scrolling happens inside .app-content
  position: relative;
}
```

**Why `overflow: hidden` on :host:**
In PWA standalone mode, without this the viewport extends below the iOS home indicator and a ghost scroll appears on the shell.

### Scrollable content area
```scss
.app-content {
  flex: 1;
  min-height: 0;                // required for flex child to scroll
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

**Why `min-height: 0`:** a flex child cannot shrink below its content size without this. Without it, the child grows and scroll never activates.

**Why `4rem` in has-header:** the header is ~56px (standard Bootstrap navbar) + safe-area-inset-top. `4rem = 64px` adds a small buffer so content is not hidden behind the header.

**Why `4.5rem` in padding-bottom:** the nav is `height: 4rem`. The extra 0.5rem ensures the last list item is not flush against the nav edge.

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
    padding-top: env(safe-area-inset-top);   // respects notch/dynamic island
  }

  &.custom-header {
    background-color: rgba(var(--bs-body-bg-rgb), 0.2) !important;
    -webkit-backdrop-filter: blur(5px) saturate(180%);
    backdrop-filter: blur(5px) saturate(180%);
    font-weight: 500;
  }
}
```

**Why `position: absolute` on header:** required for glassmorphism (content is visible through it). `position: sticky` or static would block scroll.

### Floating tab bar (nav)
```scss
nav.custom-nav {
  position: absolute !important;
  bottom: max(env(safe-area-inset-bottom), 8px);   // never touches edge on iPhone X+
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
      background-color: rgba(13, 110, 253, 0.85);   // semi-transparent Bootstrap blue
      box-shadow: 0 1px 4px rgba(13, 110, 253, 0.3);
    }
  }
}
```

**Why `position: absolute` and not `fixed`:** in PWA standalone on iOS, `position: fixed` can behave erratically with the virtual keyboard. `absolute` inside a `:host` with `height: 100dvh; overflow: hidden` is equivalent and more predictable.

**Why `max(env(safe-area-inset-bottom), 8px)`:** on iPhones without a notch `safe-area-inset-bottom = 0`, so the nav would sit flush against the edge. The `8px` minimum provides visual breathing room.

**Why `!important` on nav background-color:** Bootstrap injects inline background styles on `.nav`. Without `!important` the glassmorphism effect does not apply.

---

## 3. Safe areas — general rules

| Element | Property | Value |
|---|---|---|
| Header | padding-top | `env(safe-area-inset-top)` |
| .has-header | padding-top | `calc(4rem + env(safe-area-inset-top))` |
| .app-content | padding-bottom | `calc(4.5rem + max(env(safe-area-inset-bottom), 8px))` |
| Nav | bottom | `max(env(safe-area-inset-bottom), 8px)` |
| Pages with own scroll (home, etc.) | padding-bottom | `calc(env(safe-area-inset-bottom))` — do not add nav height; `.app-content` already handles it |

**Key rule:** the nav padding-bottom is already absorbed by `.app-content`. Components **must not add** extra padding-bottom for the nav — only for their own internal safe-area if they have inner scroll.

---

## 4. Dark mode

- Controlled by `data-bs-theme` on `<html>` (`light` | `dark`).
- Bootstrap 5 automatically updates all its CSS variables.
- Preference stored in `SharedService` → `Preferences.colorScheme` → `LocalStorage`.
- Components use Bootstrap variables (`var(--bs-body-bg)`, `var(--bs-border-color)`, etc.) and inherit dark mode automatically.
- **Never hardcode colors** in components; always use Bootstrap variables or `var(--bs-*)`.

---

## 5. Component conventions

### Pages (routes)
- Use Bootstrap's `.container` for max-width and horizontal padding.
- **Do not** add their own padding-top (`.has-header` handles it).
- **Do not** add their own padding-bottom for the nav (`.app-content` handles it).

### Home (exception)
- Does not use `.container` — custom flexbox layout.
- Adds `padding-top: calc(1rem + env(safe-area-inset-top))` because there is no global header.
- `padding-bottom: calc(env(safe-area-inset-bottom))` — `.app-content` already handles nav space.

### Nav tabs
- Structure: `<a class="nav-link d-flex flex-column align-items-center justify-content-center">`
- Bootstrap Icons icon on top, `<span>` with label below.
- `min-height: 44px` on `.nav-link` to meet Apple's minimum touch target size.
- The Entrenamientos tab has `d-none` (hidden for now — do not remove it).

---

## 6. What NOT to do

- **Do not use `position: fixed`** on the nav — use `absolute` inside the `:host` overflow:hidden container.
- **Do not add scroll** to the `:host` of leaf components — scrolling is the responsibility of `.app-content`.
- **Do not hardcode colors** — use Bootstrap CSS variables.
- **Do not move Export/Import back to Marcas** — they belong in Ajustes.
- **Do not remove `!important`** from the nav background without testing on Safari/PWA.
- **Do not change `height: 100dvh`** without testing on iOS Safari and in standalone mode.
