export const STOPWORDS = new Set([
  'the','a','an','and','or','but','with','without','of','for','to','in','on','at','by','from','as','is','are','be','how','what','why','when','where','your','my','our','you','we','i','it','this','that','these','those','vs','&','-','—','–'
])

export function tokenizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export function keywordize(title: string) {
  const tokens = tokenizeTitle(title)
  const keywords = tokens.filter(t => !STOPWORDS.has(t))
  // keep single words + top bigrams
  const bigrams: string[] = []
  for (let i = 0; i < keywords.length - 1; i++) {
    const bi = `${keywords[i]} ${keywords[i+1]}`
    if (!bi.match(/^\d+ \d+$/)) bigrams.push(bi)
  }
  return Array.from(new Set([...keywords, ...bigrams]))
}

export function normalizeTag(tag: string) {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}
