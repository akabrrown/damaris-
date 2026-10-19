**DESIGN BRIEF**  
Writer’s Personal Website  
_A quiet place to read: visual language, components and page layouts_

<table><tbody><tr><td><strong>Project</strong></td><td>Writer’s Personal Website</td></tr><tr><td><strong>Client</strong></td><td>[Author Name] (author)</td></tr><tr><td><strong>Prepared by</strong></td><td>Codey Dev</td></tr><tr><td><strong>Version</strong></td><td>1.0 (draft for client review)</td></tr><tr><td><strong>Date</strong></td><td>13 October 2026</td></tr><tr><td><strong>Status</strong></td><td>Draft — assumptions flagged for confirmation</td></tr></tbody></table>

1\. Design intent
=================

The site should feel like a small printed book of someone’s writing: calm, close, unhurried. Words are the interface. Nothing on the page competes with the text, and nothing about it looks like a template.

1.1 Principles
--------------

1.  **Text first.** Typography and white space do the work that illustrations and effects do on other sites.
2.  **Each kind of writing is shown the way it wants to be read.** A poem keeps its breaks and breathing room; a story gets a long, steady column; a quote stands alone.
3.  **Sage is a surface, not a text colour.** #BEC5A4 is too light to read on off-white (about 1.69:1), so it appears as flat panels, rules and markers, with deep ink or moss for anything that must be read.
4.  **One quiet call to action.** Following by email is always one field away, and never a pop-up.
5.  **Built for a mid-range phone.** Light pages, no heavy effects, large tap targets, readable in sunlight.

1.2 What the design must not feel like
--------------------------------------

Not a startup landing page, not a blog theme, not a stock “writer” aesthetic (no quills, typewriters, coffee cups or handwriting fonts). Real photography of the author and her own book covers are the only imagery.

2\. Colour
==========

2.1 Tokens
----------

| **Token** | **Value** | **Use** | **Status** |
| --- | --- | --- | --- |
| Paper | #FAF8F2 | Page background (the off-white) | Proposal. Client said “off-white”; confirm this exact value. |
| Paper deep | #F1EEE4 | Alternate bands, code and quote backing, hover wash | Derived from Paper. |
| Sage | #BEC5A4 | Brand colour: flat panels, rules, markers, button fill | Supplied by client. |
| Sage soft | #E6E9D7 | Light tint for selected rows, tags, admin highlights | Derived from Sage. |
| Ink | #232720 | Primary text and primary borders | Proposal: near-black with a green undertone to sit with the sage. |
| Muted | #5B6154 | Secondary text: dates, labels, captions | Proposal. |
| Moss | #4F5A33 | Links, focus ring, small accents on Paper | Proposal: a deepened sage so accents meet contrast. |
| Line | #D3D7C0 | Hairline dividers and table rules | Derived from Sage. |
| Alert | #9B3B2E | Errors only | Proposal. |

2.2 Contrast check (computed, WCAG)
-----------------------------------

Ratios below were calculated from the hex values above. Text needs 4.5:1 (3:1 for large text and for control boundaries).

| **Pair** | **Ratio** | **Needed** | **Result** | **Allowed use** |
| --- | --- | --- | --- | --- |
| Ink on Paper | 14.30:1 | 4.5:1 | Pass | Body text |
| Muted on Paper | 6.02:1 | 4.5:1 | Pass | Dates, labels, captions |
| Moss on Paper | 6.96:1 | 4.5:1 | Pass | Links, small accents |
| Alert on Paper | 6.46:1 | 4.5:1 | Pass | Error messages |
| Ink on Sage | 8.47:1 | 4.5:1 | Pass | Text on sage panels and buttons |
| Ink on Sage soft | 12.30:1 | 4.5:1 | Pass | Text on tints |
| Moss on Paper deep | 6.36:1 | 4.5:1 | Pass | Links on banded sections |
| Muted on Paper deep | 5.51:1 | 4.5:1 | Pass | Captions on banded sections |
| Moss on Sage | 4.12:1 | 4.5:1 | Fail | Must NOT be used for text |
| Sage on Paper | 1.69:1 | 3:1 | Fail | Decorative only; never text, never a lone control boundary |

_Moss on Sage fails for small text, so text on sage panels is always Ink. Sage alone does not meet 3:1 against Paper, so buttons and inputs carry an Ink or Muted border; the sage fill is decoration, not the boundary._

2.3 Colour rules
----------------

*   Page background is Paper. Use Paper deep for at most one banded section per page.
*   Sage panels are flat colour only: no gradient, no overlay, no texture.
*   Links are Moss with an underline (underline offset grows slightly on hover). Colour is never the only link signal.
*   Dark theme is out of scope for the first release; all colours are CSS variables so a second set can be added later.

3\. Typography
==============

| **Role** | **Proposed typeface** | **Why** | **Fallback** |
| --- | --- | --- | --- |
| Reading text, titles, quotes | Newsreader (variable, roman and italic) | Designed for on-screen reading; italic is needed for poems and book titles; optical size axis keeps titles refined. | Georgia, serif |
| Interface: navigation, labels, buttons, form hints | Hanken Grotesk (variable) | A neutral, quiet sans that stays out of the way of the serif. | system-ui, sans-serif |

_Both are free (open font licence) and loaded self-hosted. Subset to Latin, WOFF2, and check the combined size stays under the 300 KB budget. The pairing deliberately avoids the common Space Grotesk plus Instrument Serif combination. Typefaces are proposals for author sign-off._

3.1 Scale (mobile / desktop)
----------------------------

| **Style** | **Size** | **Line height** | **Notes** |
| --- | --- | --- | --- |
| Piece title | 32 / 44 px | 1.15 | Newsreader, regular, optical size large |
| Section heading | 24 / 30 px | 1.2 | Newsreader |
| Body prose | 18 / 20 px | 1.7 | Measure 62 characters |
| Poem text | 19 / 21 px | 1.6 | Block about 36 characters wide, left-aligned inside a centered block |
| Quote (index) | 22 / 26 px | 1.4 | Newsreader italic |
| UI text, buttons | 16 px | 1.4 | Hanken Grotesk, medium |
| Label (type, date) | 13 px | 1.3 | Hanken Grotesk, uppercase, letter-spacing 0.08em, Muted |

Text never goes below 13 px; body never below 18 px. Users’ browser font-size settings are respected (sizes in rem).

4\. Layout and spacing
======================

*   **Spacing scale (4 px base):** 4, 8, 12, 16, 24, 32, 48, 72, 112. Section gaps use 72 and 112 px so the page breathes.
*   **Containers:** page 1040 px max; reading column 62 characters; poem block about 36 characters; quote column about 52 characters.
*   **Breakpoints:** 640 px and 1024 px. Mobile first. A single column is the default; two columns appear only on the Home page and Books grid.
*   **Shape:** corners 2 px or square. No pill shapes. No shadows except a 1 px Line border where separation is needed.
*   **Signature detail:** a short sage bar (48 × 4 px) above section labels, and a Moss hairline under the header. Used consistently, nowhere else.

5\. Components and states
=========================

Public components are custom-built on tokens. Every interactive component must define all states below; a component is not done until each exists.

| **Component** | **Description** | **States to design** |
| --- | --- | --- |
| Header and navigation | Wordmark (author name in Newsreader) at left; text links: Poetry, Stories, Reflections, Quotes, Books, About. On mobile, links wrap into a simple expandable list, not an off-canvas drawer. | Default, hover, focus, current page (underline), menu open, menu closed. |
| Subscribe form | Single email field and one button. Three placements: Home (large, on a sage panel), end of every piece (compact), footer (compact). Privacy notice link beneath. | Idle, focus, filled, invalid, submitting (button disabled with label “Sending…”), pending-confirmation, rate-limited, server error. |
| Entry row (poem) | Title in Newsreader, first line in italic, date label. | Default, hover (underline on title), focus, visited (Moss darker). |
| Entry row (story / reflection) | Type label, title, two-line summary, reading time and date. | Same. |
| Entry row (quote) | The quote itself in italic as the link, attribution in label style if any. | Same. |
| Book card | Cover (with 1 px Line border), title, status label, one-line synopsis. | Default, hover, focus, no-cover placeholder (sage panel with title in Ink). |
| Pager | “Older” and “Newer” text links with counts. | Default, focus, disabled (hidden when not applicable). |
| Previous / next | Two links at the end of a piece, within the same section. | Default, focus, only-one-available, none. |
| Share button | Text button: “Share” or “Copy link”. | Default, focus, copied confirmation (announced to screen readers). |
| Primary button | Sage fill, Ink text, 1 px Ink border, 48 px high, square corners. | Default, hover (Ink border thickens to 2 px), focus (2 px Moss ring, 2 px offset), pressed, disabled, loading. |
| Empty state | One sentence in Newsreader italic and the subscribe form. | For each section when nothing is published. |
| Error pages | 404 and 500: one human sentence, link home, link to sections. | Static; no illustration. |
| Confirm / unsubscribe pages | Centered short text and one button. | Ready, working, success, expired link (offers new link), invalid link, already done. |
| Draft preview banner (admin only) | Thin Sage soft bar: “Draft preview — only you can see this”. | Visible in preview only. |
| Footer | Sage panel with Ink text: subscribe form, copyright line, Privacy link, RSS link. | Default, focus. |

5.1 Microcopy (proposed; the author should adjust to her voice)
---------------------------------------------------------------

| **Moment** | **Text** |
| --- | --- |
| Subscribe heading | New writing, by email. |
| Subscribe helper | Just your email address. One message when something new is published. Unsubscribe any time. |
| Pending confirmation | Almost there. Check your inbox and press the confirmation link. If it is not there in a few minutes, look in spam. |
| Invalid email | That does not look like an email address. |
| Rate limited | Too many tries. Please wait a few minutes and try again. |
| Server error | Something went wrong on our side and your address was not saved. Please try again. |
| Confirmed | You are subscribed. Thank you for reading. |
| Link expired | This confirmation link has expired. Enter your email again and we will send a new one. |
| Unsubscribed | You have been unsubscribed and will not receive further emails. Changed your mind? Subscribe again. |
| Empty section | Nothing here yet. The first piece is on its way. |

6\. Page layouts
================

| **Page** | **Mobile layout (default)** | **Desktop changes** |
| --- | --- | --- |
| Home | 1\. Header. 2. Author name and one-line introduction in Newsreader, large. 3. Sage panel with subscribe form. 4. “Recent writing”: six rows, newest first, each with type label. 5. Section links as a plain list. 6. Footer. | Introduction left and portrait of the author (if supplied) right; recent writing in a single column beside a quiet section list. |
| About | Photo with alt text, bio in reading column, contact and social links as text links, subscribe prompt. | Photo and bio side by side, reading column preserved. |
| Section index | Section title and one-sentence description, then rows, then Older link. | Same single column, centered in the page container. |
| Poem | Title, date label, poem block centered in the viewport, subscribe prompt, share, previous/next. | Block stays about 36 characters wide with generous side margins. |
| Story / Reflection | Title, date, reading time, 62-character column, subscribe prompt, share, previous/next. | Same, larger type. |
| Quote | The quote very large in italic with attribution, share, previous/next. | Same, centered column. |
| Books index | Two-column grid of covers with title and status. | Three columns. |
| Book | Cover, title, status, synopsis, excerpt (collapsible), external button. | Cover left, text right. |
| Confirm / unsubscribe | Short centered text and one button. | Same. |

_Mechanic borrowed from printed poetry pamphlets: the title is small and the margins are large; white space is the punctuation. This is a principle to apply, not a layout to copy from any site._

7\. Motion
==========

*   Motion is minimal: link underline offset on hover and a 150 ms colour change on buttons.
*   No scroll-triggered fade-ins, parallax, cursor effects, animated backgrounds or page transitions.
*   Everything animated respects prefers-reduced-motion (animations removed, not shortened).

8\. Imagery
===========

*   **Author photo:** one natural photograph for About (and optionally Home). Alt text required. Supplied by the author.
*   **Book covers:** the author’s real covers with a 1 px Line border. If none exists, the sage placeholder panel with the title.
*   **Social preview images:** generated per piece: Sage background, title in Newsreader in Ink, author name in small label style, nothing else. Title length is capped so text never overflows.
*   **No stock imagery, icons-as-decoration or illustrations.** Functional icons (menu, external link) are simple outlined glyphs in Ink with text labels.

9\. Accessibility requirements (WCAG 2.1 AA)
============================================

| **Area** | **Requirement** |
| --- | --- |
| Contrast | All text pairs from section 2.2 marked Pass. Muted may be used for secondary text only on Paper and Paper deep. |
| Focus | Visible 2 px Moss ring with 2 px offset on every interactive element; never removed. Skip-to-content link is the first focusable item. |
| Targets | Minimum 44 × 44 px for buttons and navigation links on touch screens. |
| Structure | One h1 per page; headings in order; landmarks (header, nav, main, footer). Poems use one paragraph per stanza with line breaks inside, so screen readers read them naturally. |
| Forms | Visible label (not placeholder only), error text linked with aria-describedby, errors announced in a live region, autocomplete email, correct input type. |
| Images | Meaningful alt text required in admin; decorative elements have empty alt or are CSS. |
| Language and zoom | lang="en" on the page; layout works at 200% zoom and 320 px width without horizontal scroll. |
| Motion | Reduced-motion respected (section 7). |

10\. Email design
=================

*   Single column, 560 px max, Paper background, Ink text, Georgia (email clients do not reliably load web fonts) with system fallbacks.
*   A Sage rule on top, the author’s name as a text wordmark, then: type label, title, preview or full text (poems and quotes in full; stories, reflections and books as a preview), a clear “Read it on the site” link, and a footer with who sent it, why they received it and an unsubscribe link.
*   Mostly text, no tracking pixels, a plain-text version always included. Links are underlined and meet 4.5:1.

11\. Admin design
=================

The admin is for one person and is functional rather than expressive: shadcn/ui components with the colour tokens above mapped onto them.

*   Usable on a phone: large single-column editor, sticky bar with Save draft, Preview and Publish.
*   Publish opens a confirmation showing the type, the title, the number of confirmed subscribers, and an “Email subscribers” switch (on by default, off for quotes).
*   Autosave to draft while typing, with a visible “Saved” indicator; unsaved-change warning when leaving.
*   Clear labels, plain language, no developer terms. Destructive actions (delete, remove subscriber) ask for confirmation by name.

12\. Anti-generic checklist
===========================

Review every screen against this list before sign-off. Any “yes” is a defect.

| **Does the design contain…** | **Answer must be** |
| --- | --- |
| Gradient blobs or gradients of any kind in the brand colour | No |
| Glassmorphism or frosted cards as the default card treatment | No |
| Uniform pill-shaped buttons and tags | No |
| Scroll-triggered fade-in on every section | No |
| Cursor-following effects or gradient beams | No |
| Grain laid over a gradient to disguise it | No |
| Hover states that only fade opacity | No (use underline or border change) |
| Decorative italic serif accents dropped into a sans-serif interface | No (italics here are semantic: poems, quotes, book titles) |
| The Space Grotesk + Instrument Serif pairing | No |
| Stock photos, quill or typewriter clip art, handwriting fonts | No |
| Sage used as a text colour on Paper | No |
| Anything the author did not choose or that does not serve reading | No |

13\. Open design decisions
==========================

1.  Confirm the exact off-white (proposed #FAF8F2) and the supporting colours.
2.  Approve the Newsreader and Hanken Grotesk pairing, or pick alternatives that pass the same checks.
3.  Author photo and cover images: who supplies them and when.
4.  Wordmark: author’s name set in Newsreader (proposed) or a custom logo.
5.  Final microcopy in the author’s own voice.