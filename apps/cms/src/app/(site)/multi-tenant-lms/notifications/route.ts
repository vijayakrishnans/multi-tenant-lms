import { formDeps } from '@/lib/multi-tenant-lms/form-deps'
import { notificationsForm } from '@/lib/multi-tenant-lms/forms'

export const dynamic = 'force-dynamic'

// The Notifications page's form (multi-tenant-lms-payload-console design §4).
export function POST(request: Request): Promise<Response> {
  return notificationsForm(request, formDeps)
}
