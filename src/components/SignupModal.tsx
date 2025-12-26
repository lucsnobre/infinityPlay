import { useEffect, useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/SignupModal.module.css'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
}

type SignupFormData = {
  username: string
  email: string
  password: string
  nickname: string
}

const SignupModal: FC<SignupModalProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    nickname: '',
  })

  const [error, setError] = useState<string | null>(null)

  const isSubmitDisabled = useMemo(() => {
    return (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.nickname.trim()
    )
  }, [form.email, form.nickname, form.password, form.username])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = form.username.trim()
    const email = form.email.trim()
    const password = form.password
    const nickname = form.nickname.trim()

    if (!username || !email || !password || !nickname) {
      setError('Preencha todos os campos.')
      return
    }

    if (!email.includes('@')) {
      setError('Digite um e-mail válido.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    console.log('signup_submit', { username, email, nickname })
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Cadastro"
      onMouseDown={onClose}
    >
      <div className={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>Criar conta</h2>
          <p className={styles.subtitle}>
            Entre no InfinityPlay e comece a montar seu perfil musical.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span className={styles.label}>Nome de usuário</span>
            <input
              autoFocus
              type="text"
              className={styles.input}
              value={form.username}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  username: event.target.value,
                }))
              }
              placeholder="ex: lucsnobre"
              autoComplete="username"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Nickname</span>
            <input
              type="text"
              className={styles.input}
              value={form.nickname}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  nickname: event.target.value,
                }))
              }
              placeholder="Como você quer ser chamado"
              autoComplete="nickname"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>E-mail</span>
            <input
              type="email"
              className={styles.input}
              value={form.email}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Senha</span>
            <input
              type="password"
              className={styles.input}
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
              placeholder="********"
              autoComplete="new-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitDisabled}
          >
            Criar conta
          </button>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default SignupModal
