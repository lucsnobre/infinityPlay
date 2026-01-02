import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, FC } from 'react'
import styles from '../styles/ProfilePage.module.css'
import type { DeezerArtist } from '../services/deezerApi'

interface ProfilePageProps {
  artists: DeezerArtist[]
  onNavigateHome: () => void
}

type ProfileData = {
  displayName: string
  username: string
  playlistsPublic: number
  followers: number
  following: number
  avatarDataUrl: string | null
}

const STORAGE_KEY = 'infinityPlay.profile'

function loadProfile(): ProfileData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        displayName: 'Usuário',
        username: 'usuario',
        playlistsPublic: 2,
        followers: 3,
        following: 184,
        avatarDataUrl: null,
      }
    }

    const parsed = JSON.parse(raw) as Partial<ProfileData>
    return {
      displayName: parsed.displayName ?? 'Usuário',
      username: parsed.username ?? 'usuario',
      playlistsPublic: parsed.playlistsPublic ?? 2,
      followers: parsed.followers ?? 3,
      following: parsed.following ?? 184,
      avatarDataUrl: parsed.avatarDataUrl ?? null,
    }
  } catch {
    return {
      displayName: 'Usuário',
      username: 'usuario',
      playlistsPublic: 2,
      followers: 3,
      following: 184,
      avatarDataUrl: null,
    }
  }
}

function saveProfile(profile: ProfileData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // ignore storage errors
  }
}

const ProfilePage: FC<ProfilePageProps> = ({ artists, onNavigateHome }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [profile, setProfile] = useState<ProfileData>(() => loadProfile())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsLoaded(true), 0)
    return () => window.clearTimeout(timeoutId)
  }, [])

  const topArtists = useMemo(() => artists.slice(0, 4), [artists])

  function handleChoosePhotoClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return

      setProfile((prev) => {
        const next = { ...prev, avatarDataUrl: result }
        saveProfile(next)
        return next
      })
    }

    reader.readAsDataURL(file)
  }

  const coverStyle = profile.avatarDataUrl
    ? ({ ['--hero-image' as any]: `url(${profile.avatarDataUrl})` } as CSSProperties)
    : undefined

  const stats = `${profile.playlistsPublic} playlists públicas • ${profile.followers} seguidores • ${profile.following} seguindo`

  return (
    <div className={`${styles.page} ${isLoaded ? styles.pageReady : ''}`}>
      <section className={styles.hero} style={coverStyle}>
        <div className={styles.heroInner}>
          <div className={styles.topRow}>
            <button type="button" className={styles.backButton} onClick={onNavigateHome}>
              Voltar
            </button>
          </div>

          <div className={styles.identityRow}>
            <div className={styles.avatarBlock}>
              <div className={styles.avatarWrapper}>
                {profile.avatarDataUrl ? (
                  <img
                    src={profile.avatarDataUrl}
                    alt={profile.displayName}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder} />
                )}

                <button
                  type="button"
                  className={styles.avatarAction}
                  onClick={handleChoosePhotoClick}
                >
                  <span className={styles.avatarActionIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="28" height="28">
                      <path
                        d="M12 20h9"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className={styles.avatarActionText}>Escolher foto</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className={styles.hiddenFile}
                />
              </div>
            </div>

            <div className={styles.nameBlock}>
              <p className={styles.kicker}>Perfil</p>
              <h1 className={styles.displayName}>{profile.displayName}</h1>
              <p className={styles.handle}>@{profile.username}</p>
              <p className={styles.stats}>{stats}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Artistas mais tocados este mês</h2>
            <p className={styles.sectionSubtitle}>Visíveis apenas para você</p>
          </div>

          <button type="button" className={styles.sectionAction}>
            Mostrar tudo
          </button>
        </div>

        <div className={styles.artistsRow}>
          {topArtists.map((artist) => (
            <button key={artist.id} type="button" className={styles.artistBubble}>
              {artist.picture_xl || artist.picture_medium ? (
                <img
                  src={artist.picture_xl ?? artist.picture_medium}
                  alt={artist.name}
                  className={styles.artistImage}
                />
              ) : (
                <div className={styles.artistFallback} />
              )}
              <span className={styles.artistName}>{artist.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
