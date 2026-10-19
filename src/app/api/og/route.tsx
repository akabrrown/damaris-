import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title') || 'Carolinedamaris';
  const author = searchParams.get('author') || 'Caroline Damaris Donkor';
  const kind = searchParams.get('kind') || '';

  // Clean and cap title
  const displayTitle = title.length > 80 ? `${title.slice(0, 80)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#BEC5A4', // Sage background
          padding: '64px 72px',
          fontFamily: 'serif',
        }}
      >
        {/* Top Header Label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '22px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#232720', // Ink
            fontWeight: 500,
          }}
        >
          {kind ? `${kind} · ${author}` : author}
        </div>

        {/* Piece Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '56px',
            lineHeight: 1.2,
            color: '#232720',
            fontWeight: 400,
            maxWidth: '920px',
          }}
        >
          {displayTitle}
        </div>

        {/* Bottom Wordmark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '20px',
            color: '#232720',
            opacity: 0.8,
          }}
        >
          I give the unsaid a language of its own.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
