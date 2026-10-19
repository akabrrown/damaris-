**PRODUCT REQUIREMENTS DOCUMENT**  
Writer’s Personal Website  
_A quiet, text-first home for poetry, short stories, reflections, quotes and books_

<table><tbody><tr><td><strong>Project</strong></td><td>Writer’s Personal Website</td></tr><tr><td><strong>Client</strong></td><td>[Author Name] (author)</td></tr><tr><td><strong>Prepared by</strong></td><td>Codey Dev</td></tr><tr><td><strong>Version</strong></td><td>1.0 (draft for client review)</td></tr><tr><td><strong>Date</strong></td><td>13 October 2026</td></tr><tr><td><strong>Status</strong></td><td>Draft — assumptions flagged for confirmation</td></tr></tbody></table>

1\. Overview
============

This document defines what the website must do and for whom. It is the first of five documents (PRD, TDD, Design Brief, App Flow, Backend Schema). Requirement IDs used here (FR-, NFR-) are referenced by the other four documents.

1.1 Problem and evidence
------------------------

The author writes poetry, short stories, reflections, quotes and books, and has no single place of her own where readers can find, read and follow that work. Social platforms fragment it, bury older pieces, and give her no direct line to readers.  
_Evidence status: this is based on the author’s own brief. There is no existing site, analytics, or reader research to cite, so no usage statistics are claimed. Metrics in section 8 start from a baseline of zero and their targets are proposals to agree with the author._

1.2 Product summary
-------------------

A public, read-only website with seven areas: Home, About, Poetry, Short Stories, Reflections, Quotes and Books. Visitors can subscribe by email, with no account, and receive a message whenever something new is published. One private admin area lets the author write, publish and manage everything herself.

1.3 Assumptions (state-and-build)
---------------------------------

*   **Books** means books the author is writing or has published (cover, synopsis, excerpt, status, external link to buy or read). It does not mean a reading list. Confirm with the author.
*   **Quotes** are short lines of her own writing, with optional attribution if she ever shares someone else’s. Each quote has its own shareable page.
*   The author is the only person who publishes. There is one admin account; no editors, no guest authors.
*   No payments, comments, likes or reader accounts in the first release.
*   Brand colours: off-white and #BEC5A4 (sage), as supplied. The exact off-white and supporting colours are proposals (see the Design Brief).
*   English-language site, audience mostly in Ghana and wider Africa, many on mid-range Android phones and variable networks.

2\. Goals and non-goals
=======================

2.1 Goals
---------

1.  Give the author a calm, beautiful place to publish five kinds of writing, each displayed the way that kind of writing deserves to be read.
2.  Let any visitor follow her work by email in under 30 seconds, without creating an account.
3.  Notify subscribers automatically and reliably when new work is published, exactly once per piece.
4.  Let the author publish from her phone or laptop without a developer.
5.  Stay fast and light on weak devices and slow connections, and cost almost nothing to run on free tiers.

2.2 Non-goals (first release)
-----------------------------

*   Reader accounts, comments, likes, bookmarks or any user-generated content.
*   Selling books or taking payments on the site (books link out).
*   Multi-author publishing, editorial workflow or roles beyond one admin.
*   Full-text search, tags and collections (Phase 2 candidates).
*   Scheduled publishing, weekly digest emails and per-section subscription choices (Phase 2).
*   A dark theme (Phase 2; design tokens are built so it is cheap to add).
*   Native mobile apps. The website must work well in a phone browser instead.

3\. Users
=========

| **Persona** | **Who and why they come** | **Key needs** |
| --- | --- | --- |
| **Curious reader** | Lands from a shared link or social post. Might read one poem and leave. | Page loads fast on a phone. Text is easy to read. Clear next step: read more or follow. |
| **Follower** | Likes her work and wants to know when something new appears. | One-field email signup. Honest, infrequent emails. Easy unsubscribe. |
| **Returning reader** | Comes back to browse older pieces or re-read favourites. | Sections with newest first, next/previous, stable links that never break. |
| **The author (admin)** | Writes in short bursts, often on her phone. Not technical. | Simple editor, draft before publish, control over when subscribers are emailed, nothing that can break the public site. |

4\. Scope
=========

| **Priority** | **Items** |
| --- | --- |
| **Must (MVP)** | Home, About, five content sections with index and detail pages, email subscribe with double opt-in and one-click unsubscribe, publish notification emails, admin (login, write, draft, preview, publish, books, About, images, subscriber list), SEO basics, accessibility baseline. |
| **Should (MVP if time allows)** | RSS feed, share button (Web Share API with copy-link fallback), generated social preview images, CSV export of subscribers. |
| **Could (Phase 2)** | Scheduled publishing, tags and collections, search, dark theme, weekly digest option, per-section subscription preferences, reading-progress indicator. |
| **Won’t (for now)** | Accounts, comments, payments, multi-author, native apps. |

5\. Functional requirements
===========================

Each requirement has an ID and acceptance criteria in Given/When/Then form. Priority is Must unless stated.

5.1 Reading experience
----------------------

| **ID** | **Requirement** | **Acceptance criteria** |
| --- | --- | --- |
| FR-HOME-01 | Home page introduces the author, shows the six most recent published items across all types, links to every section and carries a subscribe form. | **Given** at least 6 items are published, **when** a visitor opens /, **then** the six newest appear newest-first, each labelled with its type.  
**Given** nothing is published yet, **then** a friendly empty state shows and the subscribe form still works. |
| FR-ABOUT-01 | About page shows the author’s photo, bio and ways to reach or follow her. | **Given** the author has saved About content, **when** a visitor opens /about, **then** photo (with alt text), bio and links render. |
| FR-LIST-01 | Each section (Poetry, Short Stories, Reflections, Quotes, Books) has an index page listing published items newest-first with pagination. | **Given** more than 12 items (20 for quotes), **when** the visitor selects “Older”, **then** the next page loads with no duplicates or gaps.  
**Given** a draft exists, **then** it never appears on any public page, feed or sitemap. |
| FR-READ-01 | Each piece has its own page with title, date, body, reading time (stories and reflections), previous/next within the same section, and a subscribe prompt at the end. | **Given** a published piece, **when** opened, **then** it renders with correct formatting and a stable URL (/poetry/:slug, etc.).  
**Given** a slug that does not exist or is a draft, **then** the visitor sees the 404 page. |
| FR-READ-02 | Poems preserve the author’s line breaks, stanza spacing and indentation. | **Given** a poem with single line breaks, blank-line stanzas and leading spaces, **when** rendered at 360 px wide, **then** every line break is kept and no line is re-flowed except by natural wrapping with a hanging indent. |
| FR-QUOTE-01 | A quote is a short text (max 600 characters) with optional attribution and its own page. | **Given** a quote with no title, **when** listed, **then** the quote text is the list item. **Given** attribution is empty, **then** it is shown as the author’s own. |
| FR-BOOK-01 | A book page shows cover, title, status (upcoming, in progress, available), synopsis, optional excerpt and an external link. | **Given** status “available” and a link, **then** a clear outbound button appears. **Given** status “upcoming”, **then** no buy button and a release note shows if a date is set. |
| FR-SHARE-01 (Should) | Visitors can share or copy the link to a piece. | **Given** a browser with Web Share, **when** pressed, **then** the native share sheet opens; otherwise the link is copied with visible confirmation. |
| FR-FEED-01 (Should) | An RSS feed of the latest 30 published items. | **Given** a new item is published, **then** it appears in /feed.xml within 5 minutes and validates against a standard feed validator. |
| FR-SEO-01 | Every public page has a unique title, description, canonical URL and social preview; sitemap and robots are served. | **Given** any public URL, **then** metadata is present in the server-rendered HTML. Drafts and admin pages are excluded and noindex. |

5.2 Subscription and notification
---------------------------------

| **ID** | **Requirement** | **Acceptance criteria** |
| --- | --- | --- |
| FR-SUB-01 | A visitor subscribes with an email address only. No account, password or name. | **Given** a valid email, **when** submitted, **then** the visitor sees “Check your inbox to confirm” and a confirmation email is sent.  
**Given** an invalid email, **then** an inline error appears and nothing is sent.  
**Given** an email that is already subscribed or pending, **then** the visible response is identical (no way to learn who is subscribed). |
| FR-SUB-02 | Subscriptions use double opt-in: nobody receives updates until they click a confirmation link. | **Given** a confirmation link, **when** opened, **then** a page asks the visitor to press Confirm; pressing it marks them confirmed. Links expire after 48 hours and show a way to request a new one.  
**Given** a mail scanner opens the link, **then** the subscription is not confirmed (needs the button press). |
| FR-SUB-03 | Every email carries a working one-click unsubscribe link and the standard List-Unsubscribe headers. | **Given** the unsubscribe link, **when** pressed and confirmed, **then** the person receives no further emails and sees a confirmation with a resubscribe option. Repeating the action is harmless. |
| FR-NTF-01 | When the author publishes a poem, story, reflection, quote or book, all confirmed subscribers are emailed once. The author controls an “Email subscribers” switch on each publish (default on; default off for quotes). | **Given** 10 confirmed subscribers, **when** the author publishes with the switch on, **then** each receives exactly one email within 15 minutes with the title, a preview and a link.  
**Given** the switch is off, **then** no email is queued. |
| FR-NTF-02 | Editing, unpublishing or republishing a piece never re-sends its email. | **Given** a piece already notified, **when** edited or republished, **then** zero new emails are queued. |
| FR-NTF-03 | The author can see whether the emails for each piece were delivered. | **Given** a notification, **when** the author opens the Notifications screen, **then** sent, failed and pending counts show, with a Retry failed action. |

5.3 Author admin
----------------

| **ID** | **Requirement** | **Acceptance criteria** |
| --- | --- | --- |
| FR-ADM-01 | The author signs in to a private admin area. Nobody else can. | **Given** an unauthenticated request to any /admin page or admin action, **then** it is rejected or redirected to login. **Given** a signed-in non-admin user, **then** access is denied. |
| FR-ADM-02 | Create, edit, save as draft, publish, unpublish and delete pieces of every type. | **Given** a draft, **when** published, **then** it appears publicly within 60 seconds. **Given** unpublish, **then** it disappears from lists, feed and sitemap and its URL returns 404. |
| FR-ADM-03 | Preview a draft exactly as readers would see it, privately. | **Given** a draft, **when** Preview is opened by the signed-in author, **then** it renders with the public layout and a visible “Draft preview” banner. The URL does not work for anyone else. |
| FR-ADM-04 | Manage books (cover upload, status, synopsis, excerpt, link, order). | **Given** a book is saved and published, **then** it appears on /books in the chosen order. |
| FR-ADM-05 | Edit the About page and site settings (site title, tagline, author name, photo, contact email, social links). | **Given** changes are saved, **then** the public site reflects them within 60 seconds. |
| FR-ADM-06 | Upload images (cover, About photo) with required alt text. | **Given** a file over 2 MB or not JPEG, PNG or WebP, **then** it is rejected with a clear message. **Given** no alt text, **then** saving is blocked. |
| FR-ADM-07 | View subscribers (counts by status, searchable list), remove a subscriber, export CSV. | **Given** a removal request, **when** the author deletes a subscriber, **then** the record is permanently erased. |

6\. Non-functional requirements
===============================

| **ID** | **Requirement** | **Target / how verified** |
| --- | --- | --- |
| NFR-PERF-01 | Fast on mid-range Android over slow networks. | Mobile p75: LCP < 2.5 s, INP < 200 ms, CLS < 0.1. JavaScript per public route under about 170 KB gzipped. Fonts under 300 KB total. Verified with Lighthouse mobile before launch and Vercel real-user data after. |
| NFR-A11Y-01 | Accessible to WCAG 2.1 AA. | Body text contrast at least 4.5:1, visible focus, keyboard-only use of every control, semantic headings, alt text, reduced-motion respected. Verified with axe in CI plus a manual screen-reader pass on one poem, one story and the subscribe flow. |
| NFR-SEC-01 | Protect the admin and the subscriber list. | Subscriber data readable only by the admin and server code. Rate limits on subscribe. All inputs validated. Threat model in the TDD is addressed. |
| NFR-PRIV-01 | Collect the minimum personal data and honour consent. | Only email and consent timestamps are stored. Double opt-in. Privacy notice linked beside every subscribe form. Erasure on request. See section 9 for legal items to verify. |
| NFR-REL-01 | Emails are idempotent. | A piece never produces more than one email per subscriber, even if jobs retry or the author double-clicks Publish. Verified by an integration test. |
| NFR-OPS-01 | The author’s work is never lost. | Daily database backup available to restore; content export (Markdown) from admin; draft autosave while typing. |
| NFR-COST-01 | Run on free tiers at launch. | Documented upgrade trigger for each service (see TDD). Expected cost at launch: domain name only. |
| NFR-BROWSER-01 | Works on current evergreen browsers and Android 9+ Chrome. | No client-side JavaScript required to read, subscribe, confirm or unsubscribe (forms work as plain HTML posts, enhanced when JavaScript is available). |

7\. Content model
=================

| **Type** | **Fields the author fills in** | **How it is displayed** |
| --- | --- | --- |
| Poem | Title, text, optional short note | Centered column about 36 characters wide, line breaks and stanzas preserved, generous space around the title. Index shows title and first line. |
| Short story | Title, text (Markdown), optional summary | Single reading column about 62 characters wide, reading time, comfortable line height. Index shows title, summary and reading time. |
| Reflection | Title, text (Markdown), optional summary | Same reading layout as stories with a lighter label. Index shows title and opening lines. |
| Quote | Text (max 600 characters), optional attribution | Quote text is the heading of the item. Index is a quiet single column; each quote has a permalink and preview image. |
| Book | Title, subtitle, cover and alt text, synopsis, excerpt, status, link, release date, order | Cover-led page; index is a simple grid of covers with status. |

8\. Success metrics
===================

The site is new, so every baseline is zero. Targets are proposals for the first 90 days after public launch and should be agreed with the author; they are not forecasts.

| **Metric** | **Baseline** | **Proposed target (90 days)** | **Source** |
| --- | --- | --- | --- |
| Confirmed subscribers | 0 | Author to set a goal; track growth weekly | Admin subscriber counts |
| Confirmation rate (confirmed ÷ pending created) | n/a | ≥ 60% | Database |
| Subscribe conversion (new confirmed ÷ unique visitors) | n/a | ≥ 2% | Database + web analytics |
| Notification delivery success | n/a | ≥ 98% of attempts | Deliveries table, Resend |
| Publish-to-inbox time | n/a | p95 under 15 minutes | Deliveries table timestamps |
| Unsubscribe rate per email sent | n/a | Watch only; investigate above 1% | Database |
| Mobile Core Web Vitals pass | n/a | All three at “good” for p75 | Vercel Speed Insights / CrUX |

9\. Risks, legal items and open questions
=========================================

9.1 Risks
---------

| **Risk** | **Impact** | **Mitigation** |
| --- | --- | --- |
| Free email limits are lower than the list size | Updates delayed or dropped | Delivery is queued and batched; Notifications screen shows backlog; upgrade trigger documented. Verify current provider limits when building. |
| Emails land in spam | Followers never see updates | Send from the author’s own domain with SPF, DKIM and DMARC set up before launch; double opt-in; plain, low-image emails. |
| Notification fatigue (many quotes in a row) | Unsubscribes | Per-publish switch, quotes default off; digest option in Phase 2. |
| Spam sign-ups using other people’s emails | Reputation damage, unwanted confirmation emails | Rate limits, honeypot field, double opt-in, no public list. |
| Author locked out of admin | Cannot publish | Documented recovery path and a second recovery email held by the developer under agreement. |
| Her original writing is copied elsewhere | Loss of control | Copyright notice in footer; no technical protection can fully prevent copying, which is stated plainly to the author. |

9.2 Legal and compliance items to verify
----------------------------------------

These are flagged for confirmation, not asserted as settled. Qualified legal advice should be sought where the author wants certainty.

*   **Ghana Data Protection Act, 2012 (Act 843):** the site collects personal data (email addresses). Confirm with the Data Protection Commission whether the author must register as a data controller and what privacy notice wording is required.
*   **Public pages needed:** a Privacy Notice (Required: email addresses are collected) and a short Copyright notice (Recommended). Terms of use, cookie policy, refund and shipping policies are **Not applicable** at this scope: there are no accounts, payments or deliveries, and the planned analytics are cookie-free. Re-assess if any of these change.
*   **Visitors from the EU or UK** may subscribe; the double opt-in, unsubscribe and erasure features are designed to be compatible, but applicability should be confirmed.
*   **Email marketing rules** (identification of sender, working unsubscribe) are built in; confirm any extra rules where subscribers live.

9.3 Open questions for the author
---------------------------------

1.  What name and domain will the site use? (Placeholders \[Author Name\] appear throughout.)
2.  Is “books” her own books, or also books she recommends?
3.  Should quotes email subscribers by default, or only on request? (Proposed: off.)
4.  Will she supply a photo, her own wording for About, and a logo or wordmark?
5.  Does she want the full poem inside the email, or only a preview and link? (Proposed: full text for poems and quotes, preview for stories, reflections and books.)
6.  Does she want to import any existing writing at launch, and should it be dated to when it was originally written?

10\. Rollout
============

| **Phase** | **What happens** | **Exit check** |
| --- | --- | --- |
| 0\. Prepare | Confirm open questions, register domain, set up email sending domain, collect photo, bio and 10–15 existing pieces. | Author signs off this PRD and the Design Brief. |
| 1\. Build MVP | Implement Must items following the TDD, Backend Schema and App Flow. Seed content. | All acceptance criteria pass; accessibility and performance checks pass. |
| 2\. Soft launch | Author shares with a small circle of friends; check subscribe, confirm, notification and unsubscribe end to end on real inboxes and phones. | Delivery success ≥ 98%, no spam-folder reports, author comfortable publishing alone. |
| 3\. Public launch | Announce on her social channels with the link. | Metrics in section 8 tracked weekly. |
| 4\. Review | After 90 days, decide Phase 2 items using real behaviour. | Prioritised Phase 2 list agreed. |