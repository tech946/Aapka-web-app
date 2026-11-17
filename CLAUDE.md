# Aapka Tourism web app

## Design system

- For any UI work, follow [design-system/README.md](design-system/README.md) (Desert Ember).
- Use only the tokens from [design-system/tokens.css](design-system/tokens.css), via `var(--token)` in CSS or the
  mapped Tailwind classes (`bg-brand`, `text-muted`, `rounded-lg`, `text-h1`, …).
- Never hardcode colors, fonts or radii.
- The tokens are scoped to the `.desert-ember` class. Put it on the root element of anything built with the system.
  Never move the tokens to `:root`, because `--card`, `--border`, `--muted` and `--font-sans` already have other
  meanings globally.
