import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Fetch all subscribers
  const { data: subscribers, error } = await supabase
    .from('subscribers')
    .select('email, status, consented_at, confirmed_at, unsubscribed_at, source')
    .order('created_at', { ascending: false });

  if (error || !subscribers) {
    return new NextResponse('Failed to export subscribers', { status: 500 });
  }

  await recordAuditLog({
    action: 'subscribers.exported',
    resource_type: 'subscriber',
    description: `Exported ${subscribers.length} subscribers to CSV`,
    metadata: { count: subscribers.length },
    actor_email: user.email || 'admin',
    actor_id: user.id,
  });

  const headers = ['Email', 'Status', 'Consented At', 'Confirmed At', 'Unsubscribed At', 'Source'];
  const rows = subscribers.map((s) => [
    `"${s.email.replace(/"/g, '""')}"`,
    s.status,
    s.consented_at || '',
    s.confirmed_at || '',
    s.unsubscribed_at || '',
    s.source,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="subscribers-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
