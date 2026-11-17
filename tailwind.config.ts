import type { Config } from 'tailwindcss';

// Wraps a var()-based colour so opacity modifiers (bg-muted/30) still work.
const withAlpha = (color: string) => `color-mix(in srgb, ${color} calc(<alpha-value> * 100%), transparent)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // --_font is only set inside .desert-ember (design-system/tokens.css)
        sans: ['var(--_font, var(--font-site))', 'DM Sans', 'system-ui', 'sans-serif'],
        inter: ['var(--font-site)', 'DM Sans', 'system-ui', 'sans-serif'],
        heading: ['var(--font-site)', 'DM Sans', 'system-ui', 'sans-serif'],
        display: ['var(--font-site)', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      // Desert Ember (design-system/tokens.css). The tokens are scoped to
      // .desert-ember; keys that already existed (card, muted, border, black,
      // sans, radii, spacing) fall back to their old value outside it.
      fontSize: {
        display: ['var(--text-display)', { lineHeight: 'var(--leading-display)', fontWeight: 'var(--weight-display)' }],
        h1: ['var(--text-h1)', { lineHeight: 'var(--leading-h1)', fontWeight: 'var(--weight-h1)' }],
        h2: ['var(--text-h2)', { lineHeight: 'var(--leading-h2)', fontWeight: 'var(--weight-h2)' }],
        h3: ['var(--text-h3)', { lineHeight: 'var(--leading-h3)', fontWeight: 'var(--weight-h3)' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: 'var(--leading-body-lg)', fontWeight: 'var(--weight-body-lg)' }],
        body: ['var(--text-body)', { lineHeight: 'var(--leading-body)', fontWeight: 'var(--weight-body)' }],
        label: ['var(--text-label)', { lineHeight: 'var(--leading-label)', fontWeight: 'var(--weight-label)' }],
        caption: ['var(--text-caption)', { lineHeight: 'var(--leading-caption)', fontWeight: 'var(--weight-caption)' }],
      },
      spacing: {
        '1': 'var(--space-1, 0.25rem)',
        '2': 'var(--space-2, 0.5rem)',
        '4': 'var(--space-4, 1rem)',
        '6': 'var(--space-6, 1.5rem)',
        '12': 'var(--space-12, 3rem)',
        '24': 'var(--space-24, 6rem)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
      },
      backgroundImage: {
        'brand-gradient': 'var(--gradient-brand)',
      },
      colors: {
        brand: {
          DEFAULT: withAlpha('var(--brand)'),
          hover: withAlpha('var(--brand-hover)'),
          glow: withAlpha('var(--brand-glow)'),
          tint: withAlpha('var(--brand-tint)'),
          deep: withAlpha('var(--brand-deep)'),
        },
        'on-brand': withAlpha('var(--on-brand)'),
        black: withAlpha('var(--black, #000)'),
        charcoal: withAlpha('var(--charcoal)'),
        graphite: withAlpha('var(--graphite)'),
        ash: withAlpha('var(--ash)'),
        surface: withAlpha('var(--surface)'),
        ink: withAlpha('var(--ink)'),
        deal: withAlpha('var(--deal)'),
        success: withAlpha('var(--success)'),
        whatsapp: withAlpha('var(--whatsapp)'),
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: withAlpha('var(--_card, hsl(var(--card)))'),
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: withAlpha('var(--_muted, hsl(var(--muted)))'),
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: withAlpha('var(--_border, hsl(var(--border)))'),
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius-lg, var(--radius))',
        md: 'calc(var(--radius) - 2px)',
        sm: 'var(--radius-sm, calc(var(--radius) - 4px))',
        full: 'var(--radius-full, 9999px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
