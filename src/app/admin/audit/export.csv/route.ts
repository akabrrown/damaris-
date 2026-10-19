import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuditLogs, recordAuditLog } from '@/lib/audit';

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

  // Fetch up to 1000 recent audit entries
  const logs = await getAuditLogs({ limit: 1000 });

  await recordAuditLog({
    action: 'audit.exported',
    resource_type: 'security',
    description: `Exported ${logs.length} audit log entries to CSV`,
    metadata: { count: logs.length },
    actor_email: user.email || 'admin',
    actor_id: user.id,
  });

  const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'Actor Email', 'Description'];
  const rows = logs.map((log) => [
    `"${log.created_at}"`,
    `"${log.action}"`,
    `"${log.resource_type}"`,
    `"${(log.resource_id || '').replace(/"/g, '""')}"`,
    `"${log.actor_email.replace(/"/g, '""')}"`,
    `"${log.description.replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-log-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
