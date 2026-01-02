import { useEffect, useMemo, useState } from 'react'
import type { FC, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import styles from '../styles/SignupModal.module.css'
import logo from '../assets/logo.png'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: () => void
}

type LoginFormData = {
  email: string
  password: string
}

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const [form, setForm] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isSubmitDisabled = useMemo(() => {
    return !form.email.trim() || !form.password.trim()
  }, [form.email, form.password])

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setIsClosing(false)
      return
    }

    if (!shouldRender) return

    setIsClosing(true)
    const timeoutId = window.setTimeout(() => {
      setShouldRender(false)
      setIsClosing(false)
    }, 220)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [isOpen, shouldRender])

  useEffect(() => {
    if (!shouldRender) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [shouldRender])

  useEffect(() => {
    if (!shouldRender) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shouldRender, onClose])

  useEffect(() => {
    if (isOpen) {
      setError(null)
    }
  }, [isOpen])

  function handleInputChange(field: keyof LoginFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isSubmitDisabled || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Simular login - em produção, aqui seria a chamada à API de login
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simular token de autenticação
      window.localStorage.setItem('authToken', 'mock-login-token')
      
      onLoginSuccess()
      onClose()
      
      // Reset form
      setForm({
        email: '',
        password: '',
      })
      setShowPassword(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSignupClick() {
    onClose()
    // Aqui você poderia passar uma prop para abrir o signup modal
    // Por enquanto, apenas fecha o login
  }

  if (!shouldRender) return null

  return createPortal(
    <div
      className={`${styles.backdrop} ${isClosing ? styles.backdropClosing : ''}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={`${styles.modal} ${isClosing ? styles.modalClosing : ''}`}>
        <div className={styles.headerRow}>
          <div className={styles.headerTop}>
            <img src={logo} alt="InfinityPlay" className={styles.logo} />
            <h2 className={styles.title}>Entrar</h2>
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

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="login-email" className={styles.label}>
              Email ou usuário
            </label>
            <input
              id="login-email"
              type="text"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={styles.input}
              placeholder="Digite seu email ou usuário"
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="login-password" className={styles.label}>
              Senha
            </label>
            <div className={styles.passwordRow}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`${styles.input} ${styles.passwordInput}`}
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitDisabled || isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className={styles.loginPrompt}>
          <span>Ainda não tem uma conta?</span>
          <button 
            type="button" 
            className={styles.loginLink}
            onClick={handleSignupClick}
          >
            Criar conta
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default LoginModal
