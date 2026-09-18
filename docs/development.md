# Development

Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
npm run build
```

Tests cover Chromium, Firefox and WebKit, including an emulated mobile viewport:

```sh
npx playwright install
npm test
```

Optional `PPP_SAMPLE_DIR` / `PPP_EXPECTED_DIR` enable local original-file tests. Validation documents come from [Softer Views](https://www.softerviews.org/PagePlus.html); third-party documents and fonts are not redistributed.

Vercel serves `dist`. Domain metadata lives in `index.html`, `scripts/seo.mjs`, `public/robots.txt` and `public/sitemap.xml`.

See [compatibility](compatibility.md) for supported content and processing limits, and the [roadmap](https://github.com/Dryxio/ppp-rescue/issues/10) for planned work.
