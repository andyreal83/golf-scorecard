/**
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS, or the
 * literal "localhost"). Previewing the dev server from a phone over the
 * LAN IP (http://192.168.x.x) is not a secure context, so that call throws
 * and crashes the render — this falls back to a non-cryptographic v4-style
 * id in that case instead.
 */
export function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
