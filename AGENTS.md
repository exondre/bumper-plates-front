# Guidelines

- Use Angular's built-in control flow syntax (`@if`, `@for`, etc.) instead of deprecated structural directives such as `*ngIf` or `*ngFor` when writing new templates.
- After modifying or adding code, run `npm test -- --watch=false` and `npm run build`.
