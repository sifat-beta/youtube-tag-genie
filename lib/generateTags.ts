import { keywordize, normalizeTag } from './text'

export type SuggestPayload = {
  suggestions: string[]
}

export type VideoInsights = {
  // mined from top recent videos: snippet.tags + titles as fallbacks
  tags: string[]
}

export type GenerateInput = {
  title: string
  count?: number
  hl?: string // language, e.g. en
  gl?: string // region, e.g. US
}

export async function fetchSuggest(q: string, hl = 'en', gl = 'US'): Promise<SuggestPayload> {
  const url = new URL('https://suggestqueries.google.com/complete/search')
  url.searchParams.set('client', 'firefox') // JSON response
  url.searchParams.set('ds', 'yt') // scope to YouTube
  url.searchParams.set('q', q)
  if (hl) url.searchParams.set('hl', hl)
  if (gl) url.searchParams.set('gl', gl)

  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`Suggest failed: ${res.status}`)
  const data = await res.json() as [string, string[]]
  return { suggestions: Array.isArray(data?.[1]) ? data[1] : [] }
}

export async function fetchVideoInsights(q: string, hl = 'en', gl = 'US'): Promise<VideoInsights> {
  const key = process.env.YT_API_KEY
  if (!key) return { tags: [] }

  // Step 1: search most relevant *recent* videos
  const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
  searchUrl.searchParams.set('part', 'snippet')
  searchUrl.searchParams.set('q', q)
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('order', 'relevance')
  searchUrl.searchParams.set('maxResults', '25')
  searchUrl.searchParams.set('relevanceLanguage', hl || 'en')
  searchUrl.searchParams.set('publishedAfter', publishedAfter)
  searchUrl.searchParams.set('key', key)
  if (gl) searchUrl.searchParams.set('regionCode', gl)

  const sres = await fetch(searchUrl)
  if (!sres.ok) return { tags: [] }
  const sjson = await sres.json() as any
  const ids: string[] = (sjson.items || []).map((it: any) => it.id?.videoId).filter(Boolean)
  if (!ids.length) return { tags: [] }

  // Step 2: get tags from those videos
  const vidsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
  vidsUrl.searchParams.set('part', 'snippet')
  vidsUrl.searchParams.set('id', ids.slice(0, 25).join(','))
  vidsUrl.searchParams.set('key', key)

  const vres = await fetch(vidsUrl)
  if (!vres.ok) return { tags: [] }
  const vjson = await vres.json() as any

  const mined = new Set<string>()
  for (const it of vjson.items || []) {
    const sn = it.snippet
    const raw: string[] = [
      ...(sn?.tags ?? []),
      ...(sn?.title ? sn.title.split(/[#|,\-–—]|\s+/) : [])
    ]
    for (const r of raw) {
      const clean = normalizeTag(r)
      if (clean && !/^(official|video|new|202[0-9]|\d{4})$/.test(clean)) {
        mined.add(clean)
      }
    }
  }
  return { tags: Array.from(mined) }
}

export async function generateTags({ title, count = 15, hl = 'en', gl = 'US' }: GenerateInput) {
  const base = keywordize(title)
  const [sugg, vids] = await Promise.all([
    fetchSuggest(title, hl, gl).catch(() => ({ suggestions: [] })),
    fetchVideoInsights(title, hl, gl).catch(() => ({ tags: [] }))
  ])

  // Score candidates
  const scores = new Map<string, number>()
  const bump = (tag: string, score: number) => {
    const t = normalizeTag(tag)
    if (!t || t.length < 2) return
    scores.set(t, (scores.get(t) || 0) + score)
  }

  base.forEach(t => bump(t, 1.2))
  sugg.suggestions.forEach(s => bump(s, 2.5))
  vids.tags.forEach(t => bump(t, 1.8))

  // Prefer short phrases (<=3 words) and de-prioritize stop words only
  const ranked = Array.from(scores.entries())
    .filter(([t]) => t.split(' ').length <= 3)
    .sort((a,b) => b[1] - a[1])
    .map(([t]) => t)

  const unique = new Set<string>()
  const result: string[] = []
  for (const t of ranked) {
    if (unique.size >= count) break
    if (!unique.has(t)) { unique.add(t); result.push(t) }
  }

  for (const t of base) {
    if (result.length >= count) break
    if (!unique.has(t)) { unique.add(t); result.push(t) }
  }

  return result
}
