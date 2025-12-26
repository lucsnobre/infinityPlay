import type { CSSProperties, FC } from 'react'
import type { DeezerAlbum, DeezerTrack } from '../services/deezerApi'
import styles from '../styles/AlbumDetailPage.module.css'

interface AlbumDetailPageProps {
  album: DeezerAlbum
  tracks: DeezerTrack[]
  onPlayTrack: (trackId: number) => void
}

const AlbumDetailPage: FC<AlbumDetailPageProps> = ({ album, tracks, onPlayTrack }) => {
  const background = album.cover_xl ?? album.cover_medium

  return (
    <section
      className={styles.page}
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className={styles.overlay} />

      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.label}>Álbum</p>
          <h1 className={styles.title}>{album.title}</h1>
          {album.artist?.name && <p className={styles.artist}>{album.artist.name}</p>}
        </header>

        <div className={styles.tracks}>
          {tracks.map((track, index) => (
            <button
              key={track.id}
              type="button"
              className={styles.trackCard}
              onClick={() => onPlayTrack(track.id)}
              style={{ ['--stagger' as any]: Math.min(index, 12) } as CSSProperties}
            >
              <div className={styles.trackInfo}>
                <img
                  src={track.album.cover_medium}
                  alt={track.title}
                  className={styles.trackCover}
                />
                <div className={styles.trackText}>
                  <span className={styles.trackTitle}>{track.title}</span>
                  <span className={styles.trackMeta}>{track.artist.name}</span>
                </div>
              </div>

              <div className={styles.playCircle}>
                <span className={styles.playIcon} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AlbumDetailPage
