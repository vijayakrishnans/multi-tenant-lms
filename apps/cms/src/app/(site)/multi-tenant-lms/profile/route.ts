import { formDeps } from '@/lib/multi-tenant-lms/form-deps'
import { profileForm } from '@/lib/multi-tenant-lms/forms'

export const dynamic = 'force-dynamic'

// The Profile page's form (multi-tenant-lms-payload-console design §4).
export function POST(request: Request): Promise<Response> {
  return profileForm(request, formDeps)
}
