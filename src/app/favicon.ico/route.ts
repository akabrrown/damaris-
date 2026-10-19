import { NextResponse } from 'next/server';

export function GET(req: Request) {
  const iconUrl = new URL('/icon', req.url);
  return NextResponse.rewrite(iconUrl);
}
