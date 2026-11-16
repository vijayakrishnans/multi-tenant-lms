import { formDeps } from '@/lib/multi-tenant-lms/form-deps'
import { billingForm } from '@/lib/multi-tenant-lms/forms'

export const dynamic = 'force-dynamic'

// The Billing & plan page's forms (multi-tenant-lms-payload-console design §4).
export function POST(request: Request): Promise<Response> {
  return billingForm(request, formDeps)
}
