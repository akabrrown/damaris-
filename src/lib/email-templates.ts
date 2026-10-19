export interface ConfirmationEmailOptions {
  confirmUrl: string;
  authorName: string;
  siteTitle: string;
}

export interface NotificationEmailOptions {
  pieceTitle: string;
  kind: 'poem' | 'story' | 'reflection' | 'quote' | 'book';
  previewText?: string;
  fullText?: string;
  pieceUrl: string;
  unsubscribeUrl: string;
  authorName: string;
  siteTitle: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Builds double opt-in confirmation email matching Design Brief Section 10.
 */
export function buildConfirmationEmail(options: ConfirmationEmailOptions): RenderedEmail {
  const { confirmUrl, authorName, siteTitle } = options;
  const displayName = authorName && authorName !== '[Author Name]' ? authorName : 'Caroline Damaris Donkor';
  const subject = `Confirm your subscription to ${displayName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F2; color: #232720; font-family: Georgia, serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; text-align: left;">
          <!-- Top Sage Accent Rule -->
          <tr>
            <td style="height: 4px; background-color: #BEC5A4;"></td>
          </tr>
          <!-- Header Wordmark -->
          <tr>
            <td style="padding: 24px 0 28px 0;">
              <span style="font-size: 20px; font-weight: normal; color: #232720; font-family: Georgia, serif;">${displayName}</span>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="font-size: 18px; line-height: 1.6; color: #232720;">
              <p style="margin: 0 0 16px 0;">Dear reader,</p>
              <p style="margin: 0 0 24px 0;">Thank you for wanting to read my work. Please confirm that you would like to receive an email whenever something new is published:</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0 32px 0;">
                <tr>
                  <td align="center" style="background-color: #BEC5A4; border: 1px solid #232720;">
                    <a href="${confirmUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 500; color: #232720; text-decoration: none;">Confirm Subscription</a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 15px; color: #5B6154; line-height: 1.5; margin: 0 0 24px 0;">
                If you did not request this, you can safely ignore this email.
              </p>
              <p style="font-size: 16px; color: #232720; font-style: italic; line-height: 1.5; margin: 0;">
                Until words find us again,<br />
                Caroline D.D
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 0 0 0; border-top: 1px solid #D3D7C0; font-size: 13px; color: #5B6154; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <p style="margin: 0;">${siteTitle} &middot; Sent to this address on request.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${displayName}

Dear reader,

Thank you for wanting to read my work. Please confirm that you would like to receive an email whenever something new is published:

${confirmUrl}

If you did not request this, you can safely ignore this email.

Until words find us again,
Caroline D.D

---
${siteTitle}
  `.trim();

  return { subject, html, text };
}

/**
 * Builds new piece publish notification email matching Caroline's custom voice and Design Brief Section 10.
 */
export function buildNotificationEmail(options: NotificationEmailOptions): RenderedEmail {
  const {
    pieceTitle,
    kind,
    previewText,
    fullText,
    pieceUrl,
    unsubscribeUrl,
    authorName,
    siteTitle,
  } = options;

  const displayName = authorName && authorName !== '[Author Name]' ? authorName : 'Caroline Damaris Donkor';
  const subject = `${pieceTitle} — ${displayName}`;

  // Content body rendering (Client 7.1: preview for all except quotes which show full text with link)
  let contentHtml = '';
  let contentText = '';

  if (kind === 'quote') {
    const quoteBody = fullText || previewText || '';
    contentHtml = `
      <blockquote style="margin: 20px 0; padding: 0 0 0 16px; border-left: 3px solid #BEC5A4; font-style: italic; font-size: 20px; line-height: 1.6; color: #232720;">
        &ldquo;${quoteBody}&rdquo;
      </blockquote>
    `;
    contentText = `"${quoteBody}"`;
  } else if (kind === 'poem') {
    // Show preview / opening lines as requested in Question 7.1
    let poemPreview = previewText;
    if (!poemPreview && fullText) {
      const stanzas = fullText.trim().replace(/\r\n/g, '\n').split('\n\n');
      poemPreview = stanzas[0] || '';
    }
    const formattedPoemPreview = (poemPreview || '')
      .split('\n')
      .map((line) => line || '&nbsp;')
      .join('<br />');

    contentHtml = `
      <div style="font-size: 18px; line-height: 1.6; color: #232720; margin: 20px 0; font-family: Georgia, serif; font-style: italic;">
        ${formattedPoemPreview}
      </div>
    `;
    contentText = poemPreview || '';
  } else {
    // story, reflection, book (preview-based)
    contentHtml = `
      <p style="font-size: 18px; line-height: 1.7; color: #232720; margin: 20px 0;">
        ${previewText || ''}
      </p>
    `;
    contentText = previewText || '';
  }

  const kindLabel = kind.toUpperCase();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F2; color: #232720; font-family: Georgia, serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; text-align: left;">
          <!-- Top Sage Accent Rule -->
          <tr>
            <td style="height: 4px; background-color: #BEC5A4;"></td>
          </tr>
          <!-- Header Wordmark -->
          <tr>
            <td style="padding: 24px 0 12px 0;">
              <span style="font-size: 16px; color: #5B6154; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.08em;">${displayName}</span>
            </td>
          </tr>
          <!-- Piece Title & Kind Label -->
          <tr>
            <td style="padding: 12px 0 0 0;">
              <span style="display: inline-block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #5B6154; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin-bottom: 8px;">${kindLabel}</span>
              <h1 style="margin: 0; font-size: 28px; line-height: 1.25; font-weight: normal; color: #232720; font-family: Georgia, serif;">${pieceTitle}</h1>
            </td>
          </tr>
          <!-- Greeting & Body Content -->
          <tr>
            <td style="padding-top: 24px;">
              <p style="font-size: 16px; color: #5B6154; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Dear reader,</p>
              <p style="font-size: 18px; color: #232720; margin: 0 0 20px 0;">There are new words waiting for you.</p>
              ${contentHtml}
            </td>
          </tr>
          <!-- Outbound Button -->
          <tr>
            <td style="padding: 12px 0 28px 0;">
              <a href="${pieceUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; color: #4F5A33; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 500; text-decoration: underline;">Continue reading &rarr;</a>
            </td>
          </tr>
          <!-- Author Signoff -->
          <tr>
            <td style="padding-bottom: 24px;">
              <p style="margin: 0; font-size: 16px; color: #232720; font-style: italic; line-height: 1.5;">
                Until words find us again,<br />
                Caroline D.D
              </p>
            </td>
          </tr>
          <!-- Footer with Unsubscribe -->
          <tr>
            <td style="padding: 24px 0 0 0; border-top: 1px solid #D3D7C0; font-size: 13px; color: #5B6154; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">You received this from ${siteTitle} because you subscribed to updates from ${displayName}.</p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" target="_blank" rel="noopener noreferrer" style="color: #4F5A33; text-decoration: underline;">Unsubscribe</a> anytime.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${displayName}
${kindLabel}: ${pieceTitle}

Dear reader,
There are new words waiting for you.

${contentText}

Continue reading: ${pieceUrl}

Until words find us again,
Caroline D.D

---
You received this because you subscribed to updates from ${displayName}.
Unsubscribe anytime: ${unsubscribeUrl}
  `.trim();

  return { subject, html, text };
}
