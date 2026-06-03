/**
 * Robustly extract a JSON value (object or array) from a Gemma/Gemini
 * response that may contain thinking text, markdown code fences, and
 * broken "example" schema snippets before the real JSON.
 *
 * Strategy:
 *   1. Try content inside a ```json … ``` fence.
 *   2. Scan every { and [ in the string, brace-match each one, and
 *      collect every candidate that parses as valid JSON.
 *      Return the LARGEST valid candidate — the actual response is
 *      always the biggest JSON structure in the output.
 */
export function extractJson<T>(raw: string): T {
  // 1. Code-fenced block
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T
    } catch {
      // fall through
    }
  }

  // 2. Collect every valid JSON structure, pick the largest
  const pairs: Record<string, string> = { '{': '}', '[': ']' }
  const candidates: { value: unknown; length: number }[] = []

  for (let i = 0; i < raw.length; i++) {
    const open = raw[i]
    if (!(open in pairs)) continue
    const close = pairs[open]

    let depth = 0
    let end = -1
    for (let j = i; j < raw.length; j++) {
      if (raw[j] === open) depth++
      else if (raw[j] === close) {
        depth--
        if (depth === 0) { end = j; break }
      }
    }
    if (end === -1) continue

    try {
      const value = JSON.parse(raw.slice(i, end + 1))
      candidates.push({ value, length: end - i + 1 })
    } catch {
      // not valid JSON — skip
    }
  }

  if (candidates.length === 0) {
    throw new Error('No valid JSON found in model response')
  }

  // The real story is always the largest structure
  candidates.sort((a, b) => b.length - a.length)
  return candidates[0].value as T
}
