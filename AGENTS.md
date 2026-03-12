# Project info
See README.md

## Tech Stack

- **Framework**: Angular 21 (standalone components, no NgModules)
- **Language**: TypeScript 5.9+
- **CSS Framework**: Bootstrap 5.3+ with Bootstrap Icons 1.13+
- **CSS Preprocessor**: Sass with SCSS (per-component files)
- **Reactivity**: RxJS 7.8 (BehaviorSubject/Subject pattern in services)
- **Data parsing**: PapaParse 5.5 (CSV training data import)
- **IDs**: uuid 11 (unique record identifiers)
- **PWA**: @angular/service-worker with ngsw-config.json
- **Hosting**: Firebase Hosting
- **Testing**: Jasmine + Karma (smoke tests only; do NOT rely on tests passing)

## Architecture

- **No NgModules** — all components are standalone with `imports` array in `@Component`
- **Lazy-loaded routes** via `loadComponent` in `app.routes.ts`
- **Data layer**: all state lives in `localStorage` via `LocalStorageService` (wrapper) with keys in `LSKeysEnum`
- **Event bus**: `SharedService` uses `BehaviorSubject`/`Subject` with `.asObservable()` for cross-component communication
- **App shell** managed by `app.component` (header + router-outlet + floating nav). See `docs/ui-conventions.md` for layout rules
- **Dark mode**: `data-bs-theme` attribute on `<html>`, driven by `Preferences.colorScheme`. Always use Bootstrap CSS variables (`var(--bs-*)`) for colors, never hardcoded values

## Component Patterns

The codebase is transitioning from decorator-based to signal-based APIs. Follow these rules:

- **New components**: use signal-based `input()`, `output()`, and `inject()` (from `@angular/core`)
- **Existing components**: many still use `@Input()`, `@Output()`, and constructor DI — do not refactor unless explicitly asked
- **Lifecycle**: prefer `OnInit`/`OnDestroy` with manual `Subscription` management
- **Templates**: use built-in control flow (`@if`, `@for`, `@switch`) — never `*ngIf` or `*ngFor`
- **Forms**: use `FormsModule` (template-driven) — the project does not use reactive forms

## Naming Conventions

- **Files**: kebab-case (e.g., `bumper-plates-calculator.component.ts`)
- **Classes**: PascalCase (e.g., `BumperPlatesCalculatorComponent`)
- **Methods/properties**: camelCase
- **Enums**: PascalCase name, SCREAMING_SNAKE_CASE members (e.g., `ExerciseEnum.CLEAN_AND_JERK`)
- **Enum files**: PascalCase filename (e.g., `ExerciseEnum.ts`, `LSKeysEnum.ts`) — exception to kebab-case
- **Interfaces**: PascalCase, no `I` prefix (e.g., `PersonalRecord`, `Preferences`)
- **Feature folders**: each feature gets a directory under `src/app/features/`
- **Shared code**: enums in `src/app/shared/enums/`, interfaces in `src/app/shared/interfaces/`, pipes in `src/app/shared/pipes/`
- **Services**: global services in `src/app/service/`, feature-specific services in their feature folder

## Guidelines

- Prefer single quotes
- Use trailing commas
- Don't forget to add documentation for all new functions in components and use JSDoc docstrings for documenting TypeScript definitions, not `//` comments
- Use descriptive variable/function names
- Prefer functional programming patterns
- Prefer use of Angular 21 features over older alternatives.
- Use Angular's built-in control flow syntax (`@if`, `@for`, etc.) instead of deprecated structural directives such as `*ngIf` or `*ngFor` when writing new templates.
- After modifying or adding code, run `npm run build` to verify compilation. Do NOT run `npm test` — tests are smoke-level only and will fail.
- Project uses semantic versioning, e.g. MAJOR.MINOR.PATCH. Always upgrade project version number in `package.json`, but only MINOR version number and only ONCE per PR. If PATCH version number is greater than 0, you are allowed and you must reset to 0.
- Use descriptive commit messages and include gitmojis accordingly
- Commit messages must be written exclusively in english

## UI Language

- All user-facing strings are in **Spanish**. Do not introduce English strings in the UI.
- Code comments: prefer English for new comments.
- Commit messages and documentation must be in English.
