import type { CSSProperties, FC } from 'react'
import type { DeezerTrack } from '../services/deezerApi'
import styles from '../styles/TrackList.module.css'

interface TrackListProps {
  title: string
  tracks: DeezerTrack[]
  onSelect: (id: number) => void
}

const TrackList: FC<TrackListProps> = ({ title, tracks, onSelect }) => {
  if (!tracks.length) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.empty}>Nenhuma música encontrada.</p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.grid}>
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect(track.id)}
            style={{ ['--stagger' as any]: Math.min(index, 12) } as CSSProperties}
          >
            <div className={styles.coverWrapper}>
              <img
                src={track.album.cover_medium}
                alt={track.title}
                className={styles.cover}
              />
            </div>
            <div className={styles.info}>
              <h3 className={styles.trackTitle}>{track.title}</h3>
              <p className={styles.artistName}>{track.artist.name}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default TrackList
