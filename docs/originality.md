# Originality and prior-tool review

Review date: 18 September 2026. Maintainer research statement, not an independently certified priority finding.

## Scoped claim

To our knowledge, PPP Rescue is the first open-source, browser-based tool specifically built to recover story text and supported embedded images from Serif PagePlus ZIP/XML publications without installing PagePlus or uploading the document.

This claim concerns the combination of an open-source implementation, browser-local processing, PagePlus ZIP/XML story-text and supported embedded-image recovery, and no dependency on an installed PagePlus application. It does not claim the first document recovery software, first PPP reader of any kind, or first way to export a PagePlus publication.

## Evidence reviewed

- [Document Liberation Project](https://www.documentliberation.org/projects/) lists Serif PagePlus under import ideas for future development at the review date. That is evidence of an identified import gap, not an endorsement of PPP Rescue.
- [dexvert’s PagePlus handler](https://github.com/Sembiance/dexvert/blob/master/src/format/document/pagePlus.js) explicitly sets `unsupported = true`. Its comments suggest using an installed older PagePlus application for export. The handler does not implement independent content recovery.
- [Serif staff response](https://forum.affinity.serif.com/index.php?/topic/199372-opening-ppp-file/) advises exporting a PDF from PagePlus to import into Affinity Publisher. This route requires access to PagePlus.
- The local development record reports LibreOffice failing to load the selected X9 publication. Convert.Guru exposed ZIP members but did not produce a recovered publication in that test. This is one recorded sample, not a comprehensive assessment of those products. These historical experiments were not repeated during the wording review.
- Convert.Guru advertises PPP conversion, including [PPP to TXT](https://convert.guru/ppp-to-txt). Its claims must not be represented as nonexistent; no public open-source implementation matching the scope above was identified in the reviewed material.
- Public searches for PagePlus open-source recovery/conversion did not identify an earlier matching tool. The similarly named [UB Mannheim PagePlus](https://github.com/UB-Mannheim/PagePlus) processes OCR PAGE XML and is unrelated to Serif publications. Search coverage is not exhaustive and cannot establish universal absence.

## What the contribution enables

PPP Rescue provides an inspectable, reusable implementation for extracting content from supported legacy publications directly in a modern browser. Its practical contribution is reducing dependence on the discontinued application for content access. It is a content-recovery route, not a faithful page-layout converter.

Current validation is limited to a synthetic demonstration and two real X8/X9 publications documented in the repository. Independent user outcomes, community adoption and comparative benchmarks remain to be established.

If an earlier equivalent implementation is identified, update the priority wording and credit that work. The practical contribution remains assessable independently of a first-to-market claim.
