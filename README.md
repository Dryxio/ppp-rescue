<div align="center">

# PPP Rescue
### Your PagePlus files. A fresh start.

Recover text and embedded images from supported `.ppp` documents — without installing PagePlus.

**[Open the free tool →](https://ppp-rescue.vercel.app/)** · [Try the demo](https://ppp-rescue.vercel.app/) · [Share feedback](https://github.com/Dryxio/ppp-rescue/issues/new?template=feedback.yml)

No uploads. No account. No subscription.

</div>

![PPP Rescue: a simple, private way to open a PagePlus document](docs/before.png)

## Bring your old work back

An old newsletter. A family history. A brochure you thought was stuck forever.

PPP Rescue opens supported Serif PagePlus files in your browser and gives you a reading copy of their text and embedded images. Save the content, copy it into your favourite editor, and give it a new life.

1. **Choose your `.ppp` file**, or try the built-in demo.
2. **Review the recovered content.** Check for missing text, images or formatting.
3. **Download HTML, plain text, or a ZIP** containing text and supported images.

### After opening a document

![Recovered document preview with HTML, text and ZIP downloads](docs/after.png)

*These are actual screenshots of the app before and after opening our original, synthetic demo fixture. They are not a before/after comparison with native PagePlus rendering. The demo is not evidence of compatibility with additional PagePlus versions.*

## What works today?

This is an early **content-recovery beta**, not a replacement for PagePlus.

| Capability | Current support |
| --- | --- |
| ZIP/XML `.ppp` files | Tested on two real X8/X9 publications |
| Story text | 104 and 38 paragraphs recovered exactly in those tests |
| Embedded PNG, JPEG, GIF | Extracted; inline image references displayed when resolved |
| HTML, TXT, ZIP downloads | Available |
| Privacy | File processing stays in your browser |
| Original page layout, fonts and pagination | Not preserved |
| Older binary `.ppp` files | Not supported |
| Vector artwork, WDP images, linked external images | Not recovered |
| Numbering, special glyphs and advanced formatting | Incomplete |

No universal compatibility or complete-document recovery claim is made. Text frames can contain content outside the story structures we currently read. Story order may differ from visual page order. A file opening successfully does not prove that everything has been recovered.

**Need a PDF?** Open the downloaded HTML and use **Print → Save as PDF**. This produces a reflowed reading copy. For original page design, use PagePlus to export a PDF if available.

## Private by design

Your document is read locally using browser APIs. There is no document upload endpoint, analytics script, AI service, or external font request. The hosting provider still receives ordinary website request information.

The beta limits input to 30 MB, archive expansion to 100 MB, and entry count to 5,000. It rejects XML entities, escapes recovered text and sandboxes the preview. Processing is synchronous; complex documents may briefly freeze the tab. Keep your original files and inspect output before relying on it.

## Help recover more documents

[Share what worked or report a problem](https://github.com/Dryxio/ppp-rescue/issues/new?template=feedback.yml). Your PagePlus version, browser, file size and a description of missing content are useful.

**GitHub issues are public.** Never post a private document or someone else’s work without permission. Minimal examples you create yourself are best. We especially welcome independently authored test files from different PagePlus versions.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev
```

For a production build:

```sh
npm run build
npm run preview
```

### Tests

```sh
npm ci
npx playwright install chromium
PW_CHANNEL=chromium npm test
```

With installed Google Chrome, `npm test` works directly. Tests cover demo recovery, download contents, invalid formats, XML entity rejection, archive limits, HTML injection, and responsive layouts. Optional `PPP_SAMPLE_DIR` and `PPP_EXPECTED_DIR` enable local real-file regression tests; those files are not distributed here.

The two real publications used for local validation are *Customising PagePlus* (X9) and *Creating Graph Paper* (X8), linked by their author at [Softer Views](https://www.softerviews.org/PagePlus.html). Their documents, fonts and tutorial content are not included in this repository. Public availability is not a redistribution license.

### Project map

- `src/parser.js` — ZIP/XML extraction, safe HTML export
- `src/main.js` — local file handling, preview and downloads
- `index.html` — crawlable landing page and FAQ
- `scripts/make-demo.mjs` — reproducible synthetic test fixture
- `tests/` — browser regression tests

## Deployment & custom domain

The static site deploys to Vercel with `npm run build`, output `dist`. After adding a custom domain, update the canonical URL, Open Graph URLs, structured data, `public/robots.txt`, `public/sitemap.xml`, and this README. Redirect the previous hostname to the canonical domain and submit the sitemap through Google Search Console.

## License

Original code and demonstration artwork: [MIT](LICENSE). Dependencies retain their respective licenses. Independent community project, not affiliated with Serif or Affinity.
