'use server'

import { getModel } from '@/lib/ai/client'
import { extractJson } from '@/lib/ai/parseJson'

export type EvalResult = 'correct' | 'close' | 'incorrect'

export interface DefinitionEval {
  result: EvalResult
  feedback: string
}

export async function evaluateDefinition(
  word: string,
  correctDefinition: string,
  userAnswer: string,
): Promise<DefinitionEval> {
  const model = getModel()

  const result = await model.generateContent(`Word: "${word}"
Correct definition: "${correctDefinition}"
User's definition: "${userAnswer}"

Judge whether the user's definition captures the essential meaning of the word.

Return ONLY valid JSON with no markdown or code fences:
{
  "result": "correct",
  "feedback": "one short sentence of feedback"
}

Where "result" is one of: "correct", "close", or "incorrect"

Criteria:
- "correct": captures the core meaning well, even if worded differently
- "close": gets the general idea but misses something important or is too vague
- "incorrect": wrong meaning, unrelated, or blank
- feedback for "correct": brief positive confirmation
- feedback for "close" or "incorrect": what they missed or got wrong, without giving away the full answer`)

  const raw = result.response.text()
  return extractJson<DefinitionEval>(raw)
}
