import { useEffect, useState } from 'react'
import type { FC } from 'react'
import styles from '../styles/HeroCarousel.module.css'

export type HeroItemType = 'track' | 'album'

export interface HeroItem {
  id: number
  title: string
  subtitle: string
  meta?: string
  coverImage: string
  type: HeroItemType
}

interface HeroCarouselProps {
  items: HeroItem[]
  onPlay: (type: HeroItemType, id: number) => void
}

const AUTO_SLIDE_INTERVAL_MS = 8000

const HeroCarousel: FC<HeroCarouselProps> = ({ items, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!items.length) return

    const intervalId = window.setInterval(() => {
      setCurrentIndex((previous) => (previous + 1) % items.length)
    }, AUTO_SLIDE_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [items.length])

  if (!items.length) {
    return null
  }

  const current = items[currentIndex]
  const categoryLabel = current.type === 'album' ? 'Álbum' : 'Música'

  return (
    <section
      key={current.id}
      className={styles.hero}
      style={{ backgroundImage: `url(${current.coverImage})` }}
    >
      <div className={styles.overlay} />

      <div className={styles.content}>
        <p className={styles.category}>{categoryLabel}</p>
        <h1 className={styles.title}>{current.title}</h1>
        <p className={styles.subtitle}>{current.subtitle}</p>
        {current.meta && <p className={styles.meta}>{current.meta}</p>}

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onPlay(current.type, current.id)}
        >
          Escute já
        </button>
      </div>

      <div className={styles.dots}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={
              index === currentIndex
                ? `${styles.dot} ${styles.dotActive}`
                : styles.dot
            }
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir para ${item.title}`}
            aria-current={index === currentIndex ? 'true' : undefined}
            title={item.title}
          />
        ))}
      </div>

      <div className={styles.thumbnails}>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={
              index === currentIndex
                ? `${styles.thumbnail} ${styles.thumbnailActive}`
                : styles.thumbnail
            }
            onClick={() => setCurrentIndex(index)}
          >
            <img src={item.coverImage} alt={item.title} />
          </button>
        ))}
      </div>
    </section>
  )
}

export default HeroCarousel
