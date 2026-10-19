import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'TOKEN_INVALID'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: ErrorCode;
  requestId?: string;
  errors?: Record<string, string[]>;
}

export function problemResponse(
  status: number,
  code: ErrorCode,
  title: string,
  detail: string,
  errors?: Record<string, string[]>,
  requestId?: string
) {
  const problem: ProblemDetails = {
    type: `https://example.com/probs/${code.toLowerCase().replace(/_/g, '-')}`,
    title,
    status,
    detail,
    code,
    ...(requestId ? { requestId } : {}),
    ...(errors ? { errors } : {}),
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/problem+json',
  };
  if (requestId) {
    headers['x-request-id'] = requestId;
  }

  return NextResponse.json(problem, { status, headers });
}
