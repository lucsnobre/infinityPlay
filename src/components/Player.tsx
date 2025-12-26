import { useMemo } from 'react'
import type { FC } from 'react'
import styles from '../styles/Player.module.css'

export type PlayerContentType = 'track' | 'album'

interface PlayerProps {
  type: PlayerContentType
  id: number | null
}

const Player: FC<PlayerProps> = ({ type, id }) => {
  const src = useMemo(() => {
    if (!id) return ''

    const contentType = type === 'album' ? 'album' : 'track'
    const params = `autoplay=true&radius=false&tracklist=${contentType === 'album' ? 'true' : 'false'}`

    return `https://widget.deezer.com/widget/dark/${contentType}/${id}?${params}`
  }, [type, id])

  if (!id) {
    return null
  }

  return (
    <div className={styles.player}>
      <iframe
        title="Deezer player"
        src={src}
        width="100%"
        height="100%"
        frameBorder={0}
        allow="encrypted-media; clipboard-write"
      />
    </div>
  )
}

export default Player
