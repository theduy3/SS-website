# Black Friday gift-card campaign

Release is on hold until the hosted purchase URL works and checkout visibly applies 20% without charging a card. The approved `/order` URL returned 404 during verification. Publishing the campaign is an operator action in the existing popup admin.

Use these values in the admin. Schedule inputs use the browser’s local timezone. The local examples below apply when the browser is set to America/Toronto.

| Field | Value |
| --- | --- |
| ID | `black-friday-gift-cards-2026` |
| Type and presentation | Rich, Black Friday gift card (`gift-card`) |
| Version | `1` |
| Priority | `11`, above the bundled subscribe popup’s `10`. Confirm against the live record before publishing. |
| Frequency | Once per session (`session`) |
| Starts at | Toronto `2026-11-23T00:00:00.000`, UTC `2026-11-23T05:00:00Z` |
| Ends at | Toronto `2026-12-06T23:59:59.999`, UTC `2026-12-07T04:59:59.999Z` |
| FR title | Vendredi fou |
| EN title | Black Friday |
| FR body | Sur les cartes-cadeaux achetées en ligne. |
| EN body | On gift cards purchased online. |
| ES/AR text, button and image fields | Leave empty. The presentation supplies the approved artwork and purchase button. |

The gift-card presentation is eligible only for the exact approved window. Both endpoints are inclusive. [Approved design](./black-friday-gift-cards-mock.html)
