# Tailwind Color Configuration

## Color Choices

- **Primary:** `orange` — Used for buttons, links, key accents, active states
- **Secondary:** `teal` — Used for tags, highlights, secondary elements, AI indicators
- **Neutral:** `stone` — Used for backgrounds, text, borders (warm gray)

## Usage Examples

### Primary (Orange)
```html
<!-- Buttons -->
<button class="bg-orange-500 hover:bg-orange-600 text-white">Primary Button</button>

<!-- Active navigation -->
<a class="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Active</a>

<!-- Accents -->
<div class="border-orange-300 focus:ring-orange-500/20">Input focus</div>

<!-- Shadows -->
<div class="shadow-lg shadow-orange-500/30">Elevated element</div>
```

### Secondary (Teal)
```html
<!-- Tags/Badges -->
<span class="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Badge</span>

<!-- AI/Bot indicators -->
<div class="bg-gradient-to-br from-teal-400 to-teal-600 text-white">AI</div>

<!-- Success states -->
<div class="text-teal-500">Completed</div>
```

### Neutral (Stone)
```html
<!-- Backgrounds -->
<div class="bg-stone-50 dark:bg-stone-950">Page background</div>
<div class="bg-white dark:bg-stone-900">Card background</div>

<!-- Text -->
<p class="text-stone-900 dark:text-stone-100">Heading</p>
<p class="text-stone-600 dark:text-stone-400">Body text</p>
<p class="text-stone-500 dark:text-stone-400">Muted text</p>

<!-- Borders -->
<div class="border border-stone-200 dark:border-stone-800">Card</div>
```

## Score Color Coding

The app uses a consistent color scheme for scoring:
- **High (85+):** `teal-500`, `teal-600` — Excellent performance
- **Medium (70-84):** `orange-500`, `orange-600` — Good performance
- **Low (<70):** `stone-400`, `stone-500` — Needs improvement

```typescript
const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-teal-600 dark:text-teal-400'
  if (score >= 70) return 'text-orange-600 dark:text-orange-400'
  return 'text-stone-500 dark:text-stone-400'
}
```
