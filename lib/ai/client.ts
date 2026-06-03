import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')

export function getModel() {
  return genAI.getGenerativeModel({ model: 'gemma-4-31b-it' })
}
