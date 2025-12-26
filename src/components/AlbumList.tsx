import type { CSSProperties, FC } from 'react'
import type { DeezerAlbum } from '../services/deezerApi'
import styles from '../styles/AlbumList.module.css'

interface AlbumListProps {
  title: string
  albums: DeezerAlbum[]
  onSelect: (id: number) => void
}

const AlbumList: FC<AlbumListProps> = ({ title, albums, onSelect }) => {
  if (!albums.length) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.empty}>Nenhum álbum encontrado.</p>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.grid}>
        {albums.map((album, index) => (
          <button
            key={album.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect(album.id)}
            style={{ ['--stagger' as any]: Math.min(index, 12) } as CSSProperties}
          >
            <div className={styles.coverWrapper}>
              <img
                src={album.cover_medium}
                alt={album.title}
                className={styles.cover}
              />
            </div>
            <div className={styles.info}>
              <h3 className={styles.albumTitle}>{album.title}</h3>
              {album.artist?.name && (
                <p className={styles.artistName}>{album.artist.name}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

export default AlbumList
