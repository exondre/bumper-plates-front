# Project info
See README.md

## Tech Stack

- **Framework**: Angular 19
- **Language**: TypeScript 5.5+
- **CSS Framework**: Bootstrap 5.3+
- **CSS Preprocessor**: Sass with SCSS

## Guidelines

- Use single quotes, no semicolons, trailing commas
- Don't forget to add documentation for all new functions in components and use JSDoc docstrings for documenting TypeScript definitions, not `//` comments
- Use descriptive variable/function names
- Prefer functional programming patterns
- Prefer use of Angular 19 features over older alternatives.
- Use Angular's built-in control flow syntax (`@if`, `@for`, etc.) instead of deprecated structural directives such as `*ngIf` or `*ngFor` when writing new templates.
- After modifying or adding code, run `npm run build`. For now, avoid running commands like `npm test -- --watch=false` because tests will fail
- Project uses semantic versioning, e.g. MAJOR.MINOR.PATCH. Always upgrade project version number in `package.json`, but only MINOR version number and only ONCE per PR. If PATCH version number is greater than 0, you are allowed and you must reset to 0.
- Use descriptive commit messages and include gitmojis accordingly
- Commit messages must be written exclusively in english
