/** Generate IDs without assuming `crypto.randomUUID` exists (for HTTP and older Webviews). */
export function createId(): string {
  const cryptoApi = globalThis.crypto
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID()

  const bytes = new Uint8Array(16)
  if (typeof cryptoApi?.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes)
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }

  // IDs only need to be unique in local browser storage; this is a last-resort Webview fallback.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
