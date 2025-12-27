const API_BASE = '/api'

interface RegisterInput {
  username: string
  email: string
  password: string
  nickname: string
}

interface RegisterResponse {
  token: string
}

export async function registerUser(input: RegisterInput): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      username: input.username,
      password: input.password,
      displayName: input.nickname,
    }),
  })

  const contentType = response.headers.get('Content-Type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await response.json() : null

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('Preencha todos os campos obrigatórios.')
    }
    if (response.status === 409) {
      throw new Error('Este e-mail ou nome de usuário já está em uso.')
    }

    if (body && typeof body.error === 'string') {
      throw new Error(`Erro ao cadastrar: ${body.error}`)
    }

    throw new Error('Não foi possível criar sua conta agora. Tente novamente mais tarde.')
  }

  const token = body?.token
  if (typeof token !== 'string' || !token) {
    throw new Error('Resposta inesperada do servidor ao criar conta.')
  }

  try {
    window.localStorage.setItem('authToken', token)
  } catch {
    // ignore storage errors
  }

  return { token }
}
