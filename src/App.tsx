import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Navbar, { type Tab } from './components/Navbar'
import HeroCarousel, {
  type HeroItem,
  type HeroItemType,
} from './components/HeroCarousel'
import TrackList from './components/TrackList'
import AlbumList from './components/AlbumList'
import AlbumDetailPage from './components/AlbumDetailPage'
import Player, { type PlayerContentType } from './components/Player'
import {
  type DeezerAlbum,
  type DeezerArtist,
  type DeezerTrack,
  getTopArtists,
  searchAlbums,
  searchTracks,
  getTrapFunkAlbums,
  getTrapFunkTracks,
  getAlbumDetails,
} from './services/deezerApi'

interface PlayerState {
  type: PlayerContentType
  id: number | null
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [topTracks, setTopTracks] = useState<DeezerTrack[]>([])
  const [topAlbums, setTopAlbums] = useState<DeezerAlbum[]>([])
  const [topArtists, setTopArtists] = useState<DeezerArtist[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [tracksResult, setTracksResult] = useState<DeezerTrack[] | null>(null)
  const [albumsResult, setAlbumsResult] = useState<DeezerAlbum[] | null>(null)

  const [player, setPlayer] = useState<PlayerState>({
    type: 'track',
    id: null,
  })

  const [selectedAlbum, setSelectedAlbum] = useState<DeezerAlbum | null>(null)
  const [selectedAlbumTracks, setSelectedAlbumTracks] = useState<DeezerTrack[]>([])
  const [albumLoading, setAlbumLoading] = useState(false)
  const [albumError, setAlbumError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInitial() {
      try {
        setLoading(true)
        setError(null)

        const [tracks, albums, artists] = await Promise.all([
          getTrapFunkTracks(80),
          getTrapFunkAlbums(80),
          getTopArtists(24),
        ])

        setTopTracks(shuffleArray(tracks))
        setTopAlbums(shuffleArray(albums))
        setTopArtists(shuffleArray(artists))
      } catch (err) {
        console.error(err)
        setError('Não foi possível carregar os dados do Deezer agora.')
      } finally {
        setLoading(false)
      }
    }

    void loadInitial()
  }, [])

  const heroItems: HeroItem[] = useMemo(
    () =>
      topTracks.slice(0, 3).map((track) => ({
        id: track.id,
        title: track.title,
        subtitle: track.artist.name,
        meta: track.album.title,
        coverImage: track.album.cover_xl ?? track.album.cover_medium,
        type: 'track' as const,
      })),
    [topTracks],
  )

  const tracksToShow = tracksResult ?? topTracks
  const albumsToShow = albumsResult ?? topAlbums

  async function openAlbum(albumId: number) {
    try {
      setAlbumLoading(true)
      setAlbumError(null)
      setSelectedAlbum(null)
      setSelectedAlbumTracks([])

      const album = await getAlbumDetails(albumId)
      setSelectedAlbum(album)
      setSelectedAlbumTracks(album.tracks?.data ?? [])
      setActiveTab('albums')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setAlbumError('Não foi possível carregar este álbum.')
    } finally {
      setAlbumLoading(false)
    }
  }

  async function handleSearch(term: string) {
    setSearchTerm(term)

    if (!term.trim()) {
      setTracksResult(null)
      setAlbumsResult(null)
      return
    }

    try {
      setError(null)

      if (activeTab === 'albums') {
        const albums = await searchAlbums(term, 24)
        setAlbumsResult(albums)
      } else {
        const tracks = await searchTracks(term, 30)
        setTracksResult(tracks)

        if (!tracks.length) {
          const albums = await searchAlbums(term, 20)
          setAlbumsResult(albums)
        } else {
          setAlbumsResult(null)
        }
      }
    } catch (err) {
      console.error(err)
      setError('Erro ao buscar no Deezer.')
    }
  }

  function handlePlayFromHero(type: HeroItemType, id: number) {
    setPlayer({ type, id })
  }

  function handleSelectTrack(id: number) {
    setPlayer({ type: 'track', id })
  }

  function handleSelectAlbum(id: number) {
    void openAlbum(id)
  }

  const isPlayerVisible = player.id !== null

  return (
    <div className="app">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab)
          setSearchTerm('')
          setTracksResult(null)
          setAlbumsResult(null)
          setSelectedAlbum(null)
          setSelectedAlbumTracks([])
          setAlbumError(null)
          setAlbumLoading(false)
        }}
        onSearch={handleSearch}
      />

      <main
        className={
          isPlayerVisible ? 'app-main app-main-with-player' : 'app-main'
        }
      >
        {selectedAlbum || albumLoading || albumError ? (
          <>
            {albumLoading && (
              <p className="status">Carregando álbum...</p>
            )}
            {albumError && (
              <p className="status status-error">{albumError}</p>
            )}
            {selectedAlbum && !albumLoading && (
              <AlbumDetailPage
                album={selectedAlbum}
                tracks={selectedAlbumTracks}
                onPlayTrack={handleSelectTrack}
              />
            )}
          </>
        ) : (
          <>
            {loading && <p className="status">Carregando catálogo...</p>}
            {error && <p className="status status-error">{error}</p>}

            {!loading && !error && (
              <>
                {activeTab === 'home' && (
                  <>
                    <HeroCarousel
                      items={heroItems}
                      onPlay={handlePlayFromHero}
                    />

                    <div className="main-column">
                      <TrackList
                        title="Músicas em destaque"
                        tracks={tracksToShow.slice(0, 8)}
                        onSelect={handleSelectTrack}
                      />

                      <AlbumList
                        title="Álbuns em destaque"
                        albums={albumsToShow.slice(0, 8)}
                        onSelect={handleSelectAlbum}
                      />

                      {topArtists.length > 0 && (
                        <section className="artists-section">
                          <h2>Artistas em destaque</h2>
                          <div className="artists-grid">
                            {topArtists.slice(0, 8).map((artist) => (
                              <div key={artist.id} className="artist-card">
                                {artist.picture_medium && (
                                  <img
                                    src={artist.picture_medium}
                                    alt={artist.name}
                                  />
                                )}
                                <p>{artist.name}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  </>
                )}

                {activeTab === 'tracks' && (
                  <div className="main-column">
                    <TrackList
                      title={
                        searchTerm
                          ? `Resultados de músicas para "${searchTerm}"`
                          : 'Músicas em destaque'
                      }
                      tracks={tracksToShow}
                      onSelect={handleSelectTrack}
                    />
                  </div>
                )}

                {activeTab === 'albums' && (
                  <div className="main-column">
                    <AlbumList
                      title={
                        searchTerm
                          ? `Resultados de álbuns para "${searchTerm}"`
                          : 'Álbuns em destaque'
                      }
                      albums={albumsToShow}
                      onSelect={handleSelectAlbum}
                    />
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Player type={player.type} id={player.id} />
    </div>
  )
}

export default App
