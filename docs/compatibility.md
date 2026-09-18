# File compatibility

PPP Rescue recovers text and embedded images from Serif PagePlus ZIP/XML publications. It creates a reading copy you can save as HTML or plain text, with images available individually or in a ZIP.

## Supported content

- Story text and basic bold, italic and underline formatting.
- Embedded PNG, JPEG and GIF images, including images stored as `.bin`.
- Local processing without installing PagePlus or uploading the document.

Validation covers 11 documents from one author spanning PagePlus X7–X9: 2,724 paragraphs and 104 image assets checked against source data. This is a compatibility sample, not a guarantee for every document from these versions.

## What to expect

The reading copy does not reproduce the original layout, fonts, vector artwork or layer visibility. Story order can differ from page order. Automatic fields such as page numbers, special symbols, list numbering and complex formatting may not be recovered.

Older binary PPP files, WDP images and external linked images are unsupported. Other applications also use the `.ppp` extension.

File-specific warnings appear with the result and in HTML/ZIP exports when an issue is detected. Warnings cannot identify every difference from the original. Keep the original file and review recovered content before relying on it.

For a reading-copy PDF, open the HTML export and choose **Print → Save as PDF**. For the original layout, export a PDF from PagePlus if you still have access to it. PPP Rescue does not create editable Affinity documents.

## Processing limits

Files up to 30 MB; expanded archives up to 100 MB and 5,000 entries. XML is limited to 5 MB per section and 20 MB combined, with bounded nesting and node counts. Text is limited to 20,000 paragraphs and 2 million characters. Images are limited to 300 assets, 20 million pixels per image and 80 million pixels in total. The reading-copy export is limited to 60 million characters.

Processing runs in a cancellable worker with a 30-second timeout. If a file cannot be processed, the tool explains the problem and lets you try another. Your original file remains unchanged.

## Privacy and feedback

Documents stay in your browser. No analytics or AI services are used. The host receives ordinary website requests. If you submit feedback, your selected answer, optional message and optional reply email are sent through FormSubmit to mrdryxio@gmail.com. No document, filename, extracted text, images or recovery diagnostics are included automatically. FormSubmit receives connection information and retains submissions for 30 days; email copies remain in our inbox. You can email us to request deletion.

[Send feedback](https://recoverppp.com/#feedback) without an account, or email [mrdryxio@gmail.com](mailto:mrdryxio@gmail.com). Please do not include private document content.
