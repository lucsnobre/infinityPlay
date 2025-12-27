import { useEffect, useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/SignupModal.module.css'
import logo from '../assets/logo.png'
import { registerUser } from '../services/backendApi'

interface SignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSignupSuccess?: () => void
}

type SignupFormData = {
  username: string
  email: string
  password: string
  nickname: string
}

const SignupModal: FC<SignupModalProps> = ({ isOpen, onClose, onSignupSuccess }) => {
  const [form, setForm] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    nickname: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

    setIsSubmitting(true)
    setError(null)

    void (async () => {
      try {
        await registerUser({
          username,
          email,
          password,
          nickname,
        })
        onSignupSuccess?.()
        onClose()
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Não foi possível criar sua conta agora.'
        setError(message)
        setIsSubmitting(false)
      }
    })()
  }

  function handleLoginClick() {
    onClose()
    window.location.href = '/login'
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
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div className={styles.headerTop}>
              <img src={logo} alt="InfinityPlay" className={styles.logo} />
              <h2 className={styles.title}>Criar conta</h2>
            </div>

            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
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
              placeholder="Insira seu nome de usuário"
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
              placeholder="Insira seu e-mail"
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Senha</span>
            <div className={styles.passwordRow}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.passwordInput}`}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
                placeholder="Insira sua senha"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M10.7 5.1c.43-.07.86-.1 1.3-.1 7 0 10 7 10 7a19.7 19.7 0 0 1-3.3 4.7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.6 6.6A19.7 19.7 0 0 0 2 12s3 7 10 7c1.65 0 3.1-.4 4.3-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.1 9.9a3 3 0 0 1 .82 2.1 3 3 0 0 1-3 3 3 3 0 0 1-2.1-.82"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 2l20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? 'Criando conta...' : 'Criar conta'}
          </button>

          <p className={styles.loginPrompt}>
            Já tem uma conta?{' '}
            <button
              type="button"
              className={styles.loginLink}
              onClick={handleLoginClick}
            >
              Fazer login
            </button>
          </p>
        </form>
      </div>
    </div>,
    document.body,
  )
}

export default SignupModal
