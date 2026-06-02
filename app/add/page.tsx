export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { AddWordForm } from './AddWordForm'

export default function AddWordPage() {
  return (
    <Suspense>
      <AddWordForm />
    </Suspense>
  )
}
