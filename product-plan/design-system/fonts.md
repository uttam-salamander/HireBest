# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or in your CSS:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Quicksand:wght@400;500;600;700&display=swap');
```

## Font Usage

| Purpose | Font | Weights |
|---------|------|---------|
| Headings | Quicksand | 600, 700 |
| Body text | Quicksand | 400, 500 |
| Code/technical | IBM Plex Mono | 400, 500 |

## Tailwind Configuration

Add to your Tailwind config (if using custom fonts):

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        heading: ['Quicksand', 'sans-serif'],
        body: ['Quicksand', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
}
```

## CSS Custom Properties

```css
:root {
  --font-heading: 'Quicksand', sans-serif;
  --font-body: 'Quicksand', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

body {
  font-family: var(--font-body);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}

code, pre {
  font-family: var(--font-mono);
}
```

## Usage in Components

The components use Tailwind's `font-heading` class for headings:

```html
<h1 class="font-heading text-2xl font-bold">Page Title</h1>
<p class="text-sm">Body text uses default font</p>
```

## Font Characteristics

**Quicksand** — A rounded geometric sans-serif with a friendly, modern feel. Works well for both headings and body text. The rounded terminals give it a softer, more approachable personality.

**IBM Plex Mono** — A clean, highly legible monospace font. Good for code snippets, technical data, and any content that benefits from fixed-width characters.
