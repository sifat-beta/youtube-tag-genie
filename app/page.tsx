'use client'

import { useMemo, useState } from 'react'
import { generateTags } from '@/lib/generateTags'

export default function Page() {
  const [title, setTitle] = useState('')
  const [count, setCount] = useState(15)
  const [hl, setHl] = useState('en')
  const [gl, setGl] = useState('US')
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const csv = useMemo(() => tags.join(', '), [tags])

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    setTags([])
    try {
      const result = await generateTags({ title, count, hl, gl })
      setTags(result)
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(csv)
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">YouTube Tag Genie</h1>
        <p className="text-sm text-slate-500 mt-1">Enter a video title. Get high-demand, relatable tags — comma-separated.</p>
      </header>

      <section className="space-y-4">
        <label className="block">
          <span className="block text-sm font-medium">Video Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. iPhone 16 Pro Max vs Galaxy S25 Ultra camera test"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-3 shadow-sm focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="block text-sm font-medium">How many tags?</span>
            <input type="number" min={5} max={40} value={count}
              onChange={(e) => setCount(Math.max(5, Math.min(40, Number(e.target.value) || 15)))}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium">Language (hl)</span>
            <input value={hl} onChange={e=>setHl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium">Region (gl)</span>
            <input value={gl} onChange={e=>setGl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-2 dark:border-slate-700 dark:bg-slate-900" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleGenerate} disabled={!title || loading}
            className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-white shadow hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Generating…' : 'Generate tags'}
          </button>
          <button onClick={copy} disabled={!tags.length}
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 disabled:opacity-50">
            Copy comma-separated
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {tags.length > 0 && (
          <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">{t}</span>
              ))}
            </div>
            <textarea readOnly value={csv}
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              rows={3}
            />
          </div>
        )}

        <footer className="pt-6 text-xs text-slate-500">
          <p>Pro tip: set <code>YT_API_KEY</code> to mine recent video tags in your region for extra relevance.</p>
          <p className="mt-2 font-semibold text-brand-600">Powered by <span className="tracking-wide">Foxside</span></p>
        </footer>
      </section>
    </main>
  )
}
