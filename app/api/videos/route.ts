import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const hl = searchParams.get('hl') || 'en'
  const gl = searchParams.get('gl') || 'US'

  if (!process.env.YT_API_KEY || !q) {
    return NextResponse.json({ tags: [] }, { status: 200 })
  }

  try {
    const publishedAfter = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', q)
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('order', 'relevance')
    searchUrl.searchParams.set('maxResults', '25')
    searchUrl.searchParams.set('relevanceLanguage', hl)
    searchUrl.searchParams.set('publishedAfter', publishedAfter)
    searchUrl.searchParams.set('key', process.env.YT_API_KEY!)
    if (gl) searchUrl.searchParams.set('regionCode', gl)

    const sres = await fetch(searchUrl)
    const sjson = await sres.json() as any
    const ids: string[] = (sjson.items || []).map((it: any) => it.id?.videoId).filter(Boolean)

    if (!ids.length) return NextResponse.json({ tags: [] })

    const vidsUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    vidsUrl.searchParams.set('part', 'snippet')
    vidsUrl.searchParams.set('id', ids.slice(0, 25).join(','))
    vidsUrl.searchParams.set('key', process.env.YT_API_KEY!)

    const vres = await fetch(vidsUrl)
    const vjson = await vres.json() as any

    const tags = new Set<string>()
    for (const it of vjson.items || []) {
      const sn = it.snippet
      const raw: string[] = [
        ...(sn?.tags ?? []),
        ...(sn?.title ? (sn.title as string).split(/[#|,\-–—]|\s+/) : [])
      ]
      raw.forEach(x => {
        const t = x.toLowerCase().trim()
        if (t && !/^(official|video|new|202[0-9]|\d{4})$/.test(t)) tags.add(t)
      })
    }

    return NextResponse.json({ tags: Array.from(tags) })
  } catch (e) {
    return NextResponse.json({ tags: [] }, { status: 200 })
  }
}
