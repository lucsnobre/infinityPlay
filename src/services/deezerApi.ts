const DEEZER_API_BASE = '/deezer-api'

async function fetchFromDeezer<T>(path: string): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  const url = `${DEEZER_API_BASE}/${normalizedPath}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Erro ao buscar dados do Deezer: ${response.status}`)
  }

  return (await response.json()) as T
}

export interface DeezerArtist {
  id: number
  name: string
  picture?: string
  picture_medium?: string
  picture_xl?: string
}

export interface DeezerAlbum {
  id: number
  title: string
  cover?: string
  cover_medium: string
  cover_xl?: string
  nb_tracks?: number
  duration?: number
  artist?: DeezerArtist
  tracks?: {
    data: DeezerTrack[]
  }
}

export interface DeezerTrack {
  id: number
  title: string
  duration: number
  preview: string
  link: string
  artist: DeezerArtist
  album: DeezerAlbum
}

interface DeezerListResponse<T> {
  data: T[]
}

export async function getTopTracks(limit = 20): Promise<DeezerTrack[]> {
  const data = await fetchFromDeezer<DeezerListResponse<DeezerTrack>>(
    `chart/0/tracks?limit=${limit}`,
  )
  return data.data
}

export async function getTopAlbums(limit = 20): Promise<DeezerAlbum[]> {
  const data = await fetchFromDeezer<DeezerListResponse<DeezerAlbum>>(
    `chart/0/albums?limit=${limit}`,
  )
  return data.data
}

export async function getTopArtists(limit = 20): Promise<DeezerArtist[]> {
  const data = await fetchFromDeezer<DeezerListResponse<DeezerArtist>>(
    `chart/0/artists?limit=${limit}`,
  )
  return data.data
}

export async function getAlbumDetails(id: number): Promise<DeezerAlbum> {
  return fetchFromDeezer<DeezerAlbum>(`album/${id}`)
}

export async function searchTracks(
  query: string,
  limit = 20,
): Promise<DeezerTrack[]> {
  const q = encodeURIComponent(query)
  const data = await fetchFromDeezer<DeezerListResponse<DeezerTrack>>(
    `search/track?q=${q}&limit=${limit}`,
  )
  return data.data
}

export async function searchAlbums(
  query: string,
  limit = 20,
): Promise<DeezerAlbum[]> {
  const q = encodeURIComponent(query)
  const data = await fetchFromDeezer<DeezerListResponse<DeezerAlbum>>(
    `search/album?q=${q}&limit=${limit}`,
  )
  return data.data
}

export async function getTrapFunkTracks(limit = 30): Promise<DeezerTrack[]> {
  const artistQueries = [
    'alee',
    'veigh',
    'niink',
    'mc ig',
    'ryu, the runner',
    'kayblack',
    'tz da coronel',
    'lpt zlatan',
    'matue',
    'teto',
    'wiu',
    'bradockdan',
    'emite unico',
  ]

  const perArtistLimit = Math.min(30, limit)

  const resultsArrays = await Promise.all(
    artistQueries.map((name) => searchTracks(name, perArtistLimit)),
  )

  const byId = new Map<number, DeezerTrack>()

  for (const list of resultsArrays) {
    for (const track of list) {
      if (!byId.has(track.id)) {
        byId.set(track.id, track)
      }
    }
  }

  return Array.from(byId.values()).slice(0, limit)
}

export async function getTrapFunkAlbums(limit = 30): Promise<DeezerAlbum[]> {
  const artistQueries = [
    'mc cabelinho',
    'veigh',
    'niink',
    'mc ig',
    'mc ryan sp',
    'kayblack',
    'tz da coronel',
    'borges',
    'matue',
    'teto',
    'wiu',
  ]

  const perArtistLimit = Math.min(30, limit)

  const resultsArrays = await Promise.all(
    artistQueries.map((name) => searchAlbums(name, perArtistLimit)),
  )

  const byId = new Map<number, DeezerAlbum>()

  for (const list of resultsArrays) {
    for (const album of list) {
      if (!byId.has(album.id)) {
        byId.set(album.id, album)
      }
    }
  }

  return Array.from(byId.values()).slice(0, limit)
}

/**
 * Extrai a cor mais chamativa/vibrante de uma imagem usando Canvas API
 */
export async function getDominantColor(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Para imagens externas
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          resolve('linear-gradient(135deg, #6366f1, #8b5cf6)') // Gradiente fallback
          return
        }
        
        // Reduzir tamanho para performance
        const scaleFactor = 50 / Math.max(img.width, img.height)
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // Analisar cores por saturação e brilho
        const vibrantColors: Array<{color: string, score: number}> = []
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          
          // Ignorar pixels muito transparentes ou muito claros/escuros
          if (a < 128) continue
          
          // Calcular HSL para encontrar cores vibrantes
          const [, s, l] = rgbToHsl(r, g, b)
          
          // Priorizar cores com saturação > 30% e luminosidade entre 20-80%
          if (s > 30 && l > 20 && l < 80) {
            // Calcular "score" de vibrância (saturação + distância de cinza)
            const grayDistance = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
            const vibrancyScore = s + grayDistance / 255 * 50
            
            vibrantColors.push({
              color: `rgb(${r}, ${g}, ${b})`,
              score: vibrancyScore
            })
          }
        }
        
        // Se não encontrar cores vibrantes, usar método original
        if (vibrantColors.length === 0) {
          const fallbackColor = getMostCommonColor(data)
          const gradient = createGradientFromColor(fallbackColor)
          resolve(gradient)
          return
        }
        
        // Encontrar a cor mais vibrante
        vibrantColors.sort((a, b) => b.score - a.score)
        const bestVibrantColor = vibrantColors[0].color
        
        // Criar gradiente a partir da cor vibrante
        const gradient = createGradientFromColor(bestVibrantColor)
        resolve(gradient)
      } catch (error) {
        console.error('Canvas error:', error)
        resolve('linear-gradient(135deg, #6366f1, #8b5cf6)')
      }
    }
    
    img.onerror = () => {
      console.error('Image load error for:', imageUrl)
      resolve('linear-gradient(135deg, #6366f1, #8b5cf6)')
    }
    
    img.src = imageUrl
  })
}

/**
 * Cria um gradiente moderno a partir de uma cor base
 */
function createGradientFromColor(baseColor: string): string {
  // Extrair valores RGB da cor base
  const match = baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
  
  const [, r, g, b] = match.map(Number)
  
  // Converter para HSL para manipulação
  const [h, s, l] = rgbToHsl(r, g, b)
  
  // Criar cores complementares para o gradiente
  const color1 = `hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.min(l + 10, 70)}%)`
  const color2 = `hsl(${(h + 30) % 360}, ${Math.min(s + 5, 100)}%, ${Math.max(l - 10, 30)}%)`
  const color3 = `hsl(${(h + 60) % 360}, ${s}%, ${l}%)`
  
  // Criar gradiente complexo e moderno
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`
}

/**
 * Função fallback: encontra a cor mais comum
 */
function getMostCommonColor(data: Uint8ClampedArray): string {
  const colorMap = new Map<string, number>()
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    
    if (a < 128) continue
    
    // Arredondar para agrupar cores similares
    const roundedR = Math.round(r / 32) * 32
    const roundedG = Math.round(g / 32) * 32
    const roundedB = Math.round(b / 32) * 32
    
    const key = `${roundedR},${roundedG},${roundedB}`
    colorMap.set(key, (colorMap.get(key) || 0) + 1)
  }
  
  let maxCount = 0
  let dominantColor = '100,100,100'
  
  colorMap.forEach((count, color) => {
    if (count > maxCount) {
      maxCount = count
      dominantColor = color
    }
  })
  
  const [r, g, b] = dominantColor.split(',').map(Number)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Converte RGB para HSL para verificar luminosidade
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return [h * 360, s * 100, l * 100]
}
