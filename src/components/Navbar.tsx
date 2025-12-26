import { useEffect, useRef, useState } from 'react'
import type { FC, ChangeEvent, KeyboardEvent } from 'react'
import styles from '../styles/Navbar.module.css'
import logo from '../assets/logo.png'
import searchIcon from '../assets/icons/search.svg'
import SignupModal from './SignupModal'
import type { DeezerTrack } from '../services/deezerApi'
import { searchTracks } from '../services/deezerApi'

export type Tab = 'home' | 'tracks' | 'albums'

interface NavbarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onSearch: (term: string) => void
}

const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange, onSearch }) => {
  const [searchValue, setSearchValue] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<DeezerTrack[]>([])
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const searchAreaRef = useRef<HTMLDivElement | null>(null)

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setSearchValue(event.target.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && searchValue.trim()) {
      onSearch(searchValue.trim())
      setSuggestions([])
    }
    if (event.key === 'Escape') {
      setIsSearchOpen(false)
      setSuggestions([])
    }
  }

  function handleSearchIconClick() {
    if (!isSearchOpen) {
      setIsSearchOpen(true)
      window.setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return
    }

    if (searchValue.trim()) {
      onSearch(searchValue.trim())
      setSuggestions([])
    }
  }

  const searchContainerClassName = isSearchOpen
    ? `${styles.searchContainer} ${styles.searchOpen}`
    : styles.searchContainer

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isSearchOpen) return

      const target = event.target as Node | null
      if (searchAreaRef.current && target && !searchAreaRef.current.contains(target)) {
        setIsSearchOpen(false)
        setSuggestions([])
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) {
      setSuggestions([])
      return
    }

    const term = searchValue.trim()
    if (term.length < 2) {
      setSuggestions([])
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchTracks(term, 5)
          if (!cancelled) {
            setSuggestions(results)
          }
        } catch (error) {
          console.error(error)
        }
      })()
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [isSearchOpen, searchValue])

  function handleSuggestionClick(track: DeezerTrack) {
    onSearch(track.title)
    setSearchValue(track.title)
    setIsSearchOpen(false)
    setSuggestions([])
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <img src={logo} alt="Logo" className={styles.logo} />
      </div>

      <div className={styles.right}>
        <div ref={searchAreaRef} className={styles.searchWrapper}>
          <div className={searchContainerClassName}>
            <button
              type="button"
              className={styles.searchButton}
              onClick={handleSearchIconClick}
            >
              <img
                src={searchIcon}
                alt="Buscar"
                className={styles.searchIcon}
              />
            </button>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Buscar músicas, álbuns, artistas..."
              value={searchValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
            />
          </div>

          {isSearchOpen && suggestions.length > 0 && (
            <div className={styles.searchSuggestions}>
              {suggestions.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className={styles.suggestionItem}
                  onClick={() => handleSuggestionClick(track)}
                >
                  <div className={styles.suggestionContent}>
                    <img
                      src={track.album.cover_medium}
                      alt={track.title}
                      className={styles.suggestionCover}
                    />
                    <div className={styles.suggestionText}>
                      <span className={styles.suggestionTitle}>{track.title}</span>
                      <span className={styles.suggestionMeta}>
                        {track.artist.name} • {track.album.title}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className={styles.tabs}>
          <button
            type="button"
            className={
              activeTab === 'home'
                ? `${styles.tab} ${styles.activeTab}`
                : styles.tab
            }
            onClick={() => onTabChange('home')}
          >
            Início
          </button>
          <button
            type="button"
            className={
              activeTab === 'tracks'
                ? `${styles.tab} ${styles.activeTab}`
                : styles.tab
            }
            onClick={() => onTabChange('tracks')}
          >
            Músicas
          </button>
          <button
            type="button"
            className={
              activeTab === 'albums'
                ? `${styles.tab} ${styles.activeTab}`
                : styles.tab
            }
            onClick={() => onTabChange('albums')}
          >
            Álbuns
          </button>

          <button
            type="button"
            className={styles.ctaButton}
            onClick={() => setIsSignupOpen(true)}
          >
            <span>Inscreva-se já!</span>
          </button>
        </nav>
      </div>

      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </header>
  )
}

export default Navbar
