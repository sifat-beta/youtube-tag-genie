import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const hl = searchParams.get('hl') || 'en'
  const gl = searchParams.get('gl') || 'US'
  if (!q) return NextResponse.json({ suggestions: [] }, { status: 200 })

  try {
    const upstream = new URL('https://suggestqueries.google.com/complete/search')
    upstream.searchParams.set('client', 'firefox')
    upstream.searchParams.set('ds', 'yt')
    upstream.searchParams.set('q', q)
    upstream.searchParams.set('hl', hl)
    upstream.searchParams.set('gl', gl)

    const res = await fetch(upstream.toString(), { headers: { 'User-Agent': 'TagGenie/1.0' } })
    const data = await res.json() as [string, string[]]
    const suggestions = Array.isArray(data?.[1]) ? data[1] : []
    return NextResponse.json({ suggestions })
  } catch (e) {
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
