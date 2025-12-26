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
