import { multiTenantLmsCall, type MultiTenantLmsTransport } from './client'
import { clearedSessionCookie, MULTI_TENANT_LMS_SESSION_COOKIE, readCookie } from './cookies'
import { forgetSession } from './session'

/**
 * End a Multi Tenant Lms session: revoke it at api-edge (POST /v1/auth/logout), forget it
 * here, and return the Set-Cookie that removes it from the browser. A failed
 * revoke still clears the cookie: the person asked to leave.
 */
export async function endSession(
  transport: MultiTenantLmsTransport,
  headers: Headers,
  secure: boolean,
): Promise<{ revoked: boolean; setCookie: string }> {
  const token = readCookie(headers, MULTI_TENANT_LMS_SESSION_COOKIE)
  let revoked = false
  if (token) {
    const result = await multiTenantLmsCall(transport, '/v1/auth/logout', { token, method: 'POST' })
    revoked = result.ok || result.status === 401
    await forgetSession(token)
  }
  return { revoked, setCookie: clearedSessionCookie(secure) }
}
