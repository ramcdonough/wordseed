'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Volume2, BookOpen, Archive, RotateCcw, Trash2,
  Edit3, Check, X, Plus, ChevronRight,
} from 'lucide-react'
import { useWord } from '@/hooks/useWords'
import { useCollections } from '@/hooks/useCollections'
import { updateWord, archiveWord, restoreWord, deleteWord } from '@/lib/db/words'
import { createCollection, addWordToCollection, removeWordFromCollection } from '@/lib/db/collections'
import { getMasteryLabel, getMasteryColor, isDue } from '@/lib/srs/sm2'
import { formatDate, formatRelative } from '@/lib/utils/date'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/ui'
import type { Collection } from '@/types'

const MASTERY_VARIANT: Record<string, 'new' | 'familiar' | 'learning' | 'strong' | 'mastered'> = {
  New: 'new', Familiar: 'familiar', Learning: 'learning', Strong: 'strong', Mastered: 'mastered',
}

export default function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const word = useWord(id)
  const router = useRouter()
  const { addToast } = useUIStore()

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[var(--color-text-muted)]">Word not found</p>
        <Link href="/words" className="text-[var(--color-primary)] text-sm">← Back to Words</Link>
      </div>
    )
  }

  return <WordDetail wordId={id} />
}

function WordDetail({ wordId }: { wordId: string }) {
  const word = useWord(wordId)
  const collections = useCollections() ?? []
  const router = useRouter()
  const { addToast } = useUIStore()
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const audioRef = useState<HTMLAudioElement | null>(null)

  if (!word) return null

  const label = getMasteryLabel(word.masteryScore)
  const colorClass = getMasteryColor(word.masteryScore)
  const due = isDue(word)

  const wordCollections = collections.filter((c) => word.collections.includes(c.id))

  const handlePlayAudio = () => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl)
      audio.play()
    }
  }

  const handleStartNoteEdit = () => {
    setNotesValue(word.notes)
    setEditingNotes(true)
  }

  const handleSaveNotes = async () => {
    await updateWord(word.id, { notes: notesValue })
    setEditingNotes(false)
    addToast('Notes saved', 'success')
  }

  const handleToggleCollection = async (collection: Collection) => {
    if (word.collections.includes(collection.id)) {
      await removeWordFromCollection(word.id, collection.id)
    } else {
      await addWordToCollection(word.id, collection.id)
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return
    const col = await createCollection(newCollectionName.trim())
    await addWordToCollection(word.id, col.id)
    setNewCollectionName('')
    addToast(`Collection "${col.name}" created`, 'success')
  }

  const handleArchive = async () => {
    await archiveWord(word.id)
    addToast(`"${word.word}" archived`, 'info')
    router.push('/words')
  }

  const handleRestore = async () => {
    await restoreWord(word.id)
    addToast(`"${word.word}" restored`, 'success')
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteWord(word.id)
    addToast(`"${word.word}" deleted`, 'error')
    router.push('/words')
  }

  const accuracy = word.timesSeen > 0 ? Math.round((word.timesCorrect / word.timesSeen) * 100) : null

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        {due && (
          <Link href={`/quiz?wordId=${word.id}`}>
            <Badge variant="warning" size="md">Due for review</Badge>
          </Link>
        )}
      </div>

      <div className="px-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Word hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col gap-1 pt-2 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-start gap-2 justify-between">
              <h1 className="text-4xl font-black text-[var(--color-text)] capitalize leading-tight">{word.word}</h1>
              <Badge variant={MASTERY_VARIANT[label] ?? 'new'} size="md">{label}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {word.pronunciation && (
                <span className="font-mono text-sm text-[var(--color-text-muted)]">{word.pronunciation}</span>
              )}
              {word.audioUrl && (
                <button
                  onClick={handlePlayAudio}
                  className="p-1.5 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-3)] text-[var(--color-text-muted)] capitalize">
                {word.partOfSpeech}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Definition */}
        <Section label="Definition">
          <p className="text-[var(--color-text)] leading-relaxed text-lg">{word.definition}</p>
        </Section>

        {/* Example */}
        {word.exampleSentence && (
          <Section label="Example">
            <p className="text-[var(--color-text-muted)] italic leading-relaxed">&ldquo;{word.exampleSentence}&rdquo;</p>
          </Section>
        )}

        {/* Synonyms & Antonyms */}
        {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {word.synonyms.length > 0 && (
              <Section label="Synonyms">
                <div className="flex flex-wrap gap-1.5">
                  {word.synonyms.slice(0, 6).map((s) => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)]">{s}</span>
                  ))}
                </div>
              </Section>
            )}
            {word.antonyms.length > 0 && (
              <Section label="Antonyms">
                <div className="flex flex-wrap gap-1.5">
                  {word.antonyms.slice(0, 4).map((a) => (
                    <span key={a} className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)]">{a}</span>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Collections */}
        <Section
          label="Collections"
          action={
            <button
              onClick={() => setShowCollectionPicker(!showCollectionPicker)}
              className="text-xs text-[var(--color-primary)]"
            >
              {showCollectionPicker ? 'Done' : 'Edit'}
            </button>
          }
        >
          {wordCollections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {wordCollections.map((c) => (
                <span key={c.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {c.icon} {c.name}
                </span>
              ))}
            </div>
          )}
          {showCollectionPicker && (
            <div className="flex flex-col gap-2 mt-2 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)]">
              {collections.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => handleToggleCollection(c)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      word.collections.includes(c.id)
                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    {word.collections.includes(c.id) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-[var(--color-text)]">{c.icon} {c.name}</span>
                </label>
              ))}
              <div className="flex gap-2 mt-1">
                <input
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                  placeholder="New collection…"
                  className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)]"
                />
                <button
                  onClick={handleCreateCollection}
                  className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-[#0f0f14]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {wordCollections.length === 0 && !showCollectionPicker && (
            <p className="text-sm text-[var(--color-text-faint)]">Not in any collection</p>
          )}
        </Section>

        {/* Notes */}
        <Section
          label="Notes"
          action={
            !editingNotes ? (
              <button onClick={handleStartNoteEdit} className="text-xs text-[var(--color-primary)]">
                <Edit3 className="w-3.5 h-3.5 inline mr-0.5" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditingNotes(false)} className="text-xs text-[var(--color-text-faint)]"><X className="w-3.5 h-3.5" /></button>
                <button onClick={handleSaveNotes} className="text-xs text-[var(--color-success)]"><Check className="w-3.5 h-3.5" /></button>
              </div>
            )
          }
        >
          {editingNotes ? (
            <textarea
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              autoFocus
              placeholder="Add personal notes…"
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] focus:outline-none focus:border-[var(--color-primary)] resize-none min-h-[80px]"
            />
          ) : (
            <p className={`text-sm ${word.notes ? 'text-[var(--color-text)]' : 'text-[var(--color-text-faint)]'}`}>
              {word.notes || 'Tap Edit to add notes'}
            </p>
          )}
        </Section>

        {/* Stats */}
        <Section label="Progress">
          <div className="grid grid-cols-3 gap-2">
            <StatCell label="Mastery" value={`${word.masteryScore}%`} />
            <StatCell label="Accuracy" value={accuracy !== null ? `${accuracy}%` : '—'} />
            <StatCell label="Reviews" value={`${word.timesSeen}`} />
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {word.dateAdded && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-faint)]">Added</span>
                <span className="text-[var(--color-text-muted)]">{formatDate(word.dateAdded)}</span>
              </div>
            )}
            {word.lastReviewed && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-faint)]">Last reviewed</span>
                <span className="text-[var(--color-text-muted)]">{formatRelative(word.lastReviewed)}</span>
              </div>
            )}
            {word.nextReviewDate && (
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-text-faint)]">Next review</span>
                <span className={`${due ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-muted)]'}`}>
                  {due ? 'Due now' : formatDate(word.nextReviewDate)}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {word.isArchived ? (
            <Button onClick={handleRestore} variant="secondary" size="lg" fullWidth>
              <RotateCcw className="w-4 h-4" />
              Restore Word
            </Button>
          ) : (
            <Button onClick={handleArchive} variant="secondary" size="lg" fullWidth>
              <Archive className="w-4 h-4" />
              Archive Word
            </Button>
          )}
          <Button
            onClick={handleDelete}
            variant="danger"
            size="md"
            fullWidth
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete ? 'Tap again to confirm delete' : 'Delete Word'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-faint)]">{label}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-[var(--color-surface-2)] rounded-xl py-3 border border-[var(--color-border)]">
      <span className="text-xl font-black text-[var(--color-text)]">{value}</span>
      <span className="text-[10px] text-[var(--color-text-faint)]">{label}</span>
    </div>
  )
}
