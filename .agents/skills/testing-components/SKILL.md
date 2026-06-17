---
name: testing-components
description: How to test React/Next.js components locally in this repo. Use when verifying UI component changes.
---

# Testing Components Locally

This repo contains standalone React/TSX component files without a full framework setup. To test components locally:

## Setup

1. Scaffold a temporary Next.js app:
   ```bash
   npx create-next-app@latest /tmp/test-app --typescript --no-eslint --no-tailwind --no-src-dir --app --no-import-alias --use-npm
   ```

2. Copy the component into the test app:
   ```bash
   cp components/PlatformBanner.tsx /tmp/test-app/app/PlatformBanner.tsx
   ```

3. Copy any required assets (images, etc.) into `/tmp/test-app/public/`

4. Create a minimal `page.tsx` that imports and renders the component:
   ```tsx
   import PlatformBanner from "./PlatformBanner";
   export default function Home() {
     return <PlatformBanner />;
   }
   ```

5. Start the dev server:
   ```bash
   cd /tmp/test-app && npx next dev -p 3000
   ```

## Testing Patterns

- **Measuring element dimensions:** Use `getBoundingClientRect()` via browser console to verify computed sizes
- **localStorage persistence:** Check `localStorage.getItem(key)` via console, refresh, and verify state persists
- **Placeholder images:** If logo/image assets are missing, generate placeholders with Python Pillow:
  ```python
  from PIL import Image, ImageDraw
  img = Image.new('RGBA', (200, 80), color=(0, 150, 80, 255))
  d = ImageDraw.Draw(img)
  d.text((60, 28), 'Label', fill='white')
  img.save('public/logo.png')
  ```

## Notes

- The repo has no CI configured — no checks to wait for
- No pre-commit hooks or linting setup
- Components use `"use client"` directive for Next.js client-side rendering
- Port 3000 may already be in use; kill existing processes with `fuser -k 3000/tcp` before starting dev server
