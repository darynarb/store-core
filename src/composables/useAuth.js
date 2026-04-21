import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

// Module-level singleton — shared across all useAuth() calls
const currentUser = ref(null) // { id, name, email, role }

async function sha256 (str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function useAuth () {
  const isAuthenticated = computed(() => !!currentUser.value)
  const role = computed(() => currentUser.value?.role ?? null)
  const isRoot = computed(() => role.value === 'root')
  const canAccessStock = computed(() => ['root', 'owner'].includes(role.value))

  function restoreSession () {
    try {
      const saved = localStorage.getItem('app_session')
      if (saved) currentUser.value = JSON.parse(saved)
    } catch {
      localStorage.removeItem('app_session')
    }
  }

  async function login (email, password) {
    const hash = await sha256(password)
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, role, active')
      .eq('email', email.toLowerCase().trim())
      .eq('password_hash', hash)
      .single()

    if (error || !data) throw new Error('E-mail ou senha incorretos.')
    if (!data.active) throw new Error('Usuário inativo. Contate o administrador.')

    currentUser.value = { id: data.id, name: data.name, email: data.email, role: data.role }
    localStorage.setItem('app_session', JSON.stringify(currentUser.value))
  }

  function logout () {
    currentUser.value = null
    localStorage.removeItem('app_session')
  }

  async function createUser ({ name, email, password, role: userRole }) {
    const hash = await sha256(password)
    const { error } = await supabase.from('app_users').insert([{
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hash,
      role: userRole
    }])
    if (error) {
      if (error.code === '23505') throw new Error('E-mail já cadastrado.')
      throw error
    }
  }

  async function updateUser (id, fields) {
    const payload = { ...fields }
    if (payload.password) {
      payload.password_hash = await sha256(payload.password)
      delete payload.password
    }
    const { error } = await supabase.from('app_users').update(payload).eq('id', id)
    if (error) throw error
  }

  async function getUsers () {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, name, email, role, active, created_at')
      .order('created_at')
    if (error) throw error
    return data
  }

  return {
    currentUser,
    isAuthenticated,
    role,
    isRoot,
    canAccessStock,
    restoreSession,
    login,
    logout,
    createUser,
    updateUser,
    getUsers
  }
}
