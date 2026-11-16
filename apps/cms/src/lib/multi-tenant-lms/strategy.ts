import type { AuthStrategy, AuthStrategyFunction, Payload } from 'payload'

import { presentedSetupToken, setupIsOpen } from '../setup-gate'
import { accountFor, type AccountStore } from './accounts'
import type { MultiTenantLmsTransport } from './client'
import { isCrossSiteNonNavigation, isForeignOrigin, MULTI_TENANT_LMS_SESSION_COOKIE, readCookie } from './cookies'
import { resolveSession } from './session'

// The only way into the admin (design §2): a live Multi Tenant Lms session in the
// multi_tenant_lms_session cookie, resolved through api-edge, mapped to a `users` row.
// The token itself is never put on the user: Payload hands req.user to the
// browser.

export type StrategyDeps = {
  transport: () => Promise<MultiTenantLmsTransport>
  store: (payload: Payload) => AccountStore
  setupToken: () => string | undefined
}

export function multiTenantLmsAuthenticate(deps: StrategyDeps): AuthStrategyFunction {
  return async ({ headers, payload }) => {
    if (isCrossSiteNonNavigation(headers) || isForeignOrigin(headers)) return { user: null }
    const token = readCookie(headers, MULTI_TENANT_LMS_SESSION_COOKIE)
    if (!token) return { user: null }
    const session = await resolveSession(await deps.transport(), token)
    if (!session) return { user: null }
    const setupOpen = setupIsOpen(deps.setupToken(), presentedSetupToken(headers))
    const account = await accountFor(deps.store(payload), session.user, setupOpen)
    return { user: { ...account, collection: 'users', _strategy: 'multi-tenant-lms' } as never }
  }
}

// The runtime pieces load on first use, so importing the users collection
// (tests do) does not load the Workers adapter.
export const multiTenantLmsStrategy: AuthStrategy = {
  name: 'multi-tenant-lms',
  authenticate: multiTenantLmsAuthenticate({
    transport: async () => (await import('./transport')).multiTenantLmsTransport(),
    store: (payload) => {
      let store: AccountStore | undefined
      const lazy = async () => (store ??= (await import('./payload-store')).payloadAccountStore(payload))
      return {
        findByMultiTenantLmsId: async (id) => (await lazy()).findByMultiTenantLmsId(id),
        findUnlinkedByEmail: async (email) => (await lazy()).findUnlinkedByEmail(email),
        adminExists: async () => (await lazy()).adminExists(),
        create: async (data) => (await lazy()).create(data),
        update: async (id, data) => (await lazy()).update(id, data),
      }
    },
    setupToken: () => process.env.CMS_SETUP_TOKEN,
  }),
}
