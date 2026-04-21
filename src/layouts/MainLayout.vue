<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round dense icon="menu" aria-label="Menu" @click="toggleDrawer" />
        <q-toolbar-title class="text-weight-bold">
          <q-icon name="store" size="sm" class="q-mr-xs" />
          Stilo Top
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" :breakpoint="600" bordered class="bg-grey-1">
      <q-scroll-area class="fit">
        <div class="q-pa-md q-pb-sm">
          <div class="text-h6 text-primary text-weight-bold">
            <q-icon name="store" class="q-mr-xs" />Stilo Top
          </div>
          <div class="text-caption text-grey-6">Sistema interno</div>
        </div>

        <q-separator />

        <q-list padding class="q-mt-xs">
          <q-item
            v-for="link in visibleLinks" :key="link.to"
            :to="link.to" exact clickable v-ripple
            active-class="text-primary bg-blue-1"
            class="rounded-borders q-mx-sm q-mb-xs"
          >
            <q-item-section avatar><q-icon :name="link.icon" /></q-item-section>
            <q-item-section><q-item-label>{{ link.label }}</q-item-label></q-item-section>
          </q-item>
        </q-list>

        <q-separator />

        <div class="q-pa-md">
          <div class="text-caption text-grey-6 q-mb-xs">{{ currentUser?.name }}</div>
          <q-badge :color="roleColor" :label="roleLabel" class="q-mb-sm" />
          <q-btn flat dense icon="lock" label="Alterar senha"
            color="grey-7" class="full-width" align="left"
            @click="pwdDialog = true"
          />
          <q-btn flat dense icon="logout" label="Sair"
            color="grey-7" class="full-width q-mt-xs" align="left"
            @click="handleLogout"
          />
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Dialog: alterar senha -->
    <q-dialog v-model="pwdDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Alterar Senha</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="resetPwd" />
        </q-card-section>
        <q-card-section class="q-gutter-sm q-pt-md">
          <q-input
            v-model="pwdForm.current" label="Senha atual"
            type="password" outlined dense
          />
          <q-input
            v-model="pwdForm.newPwd" label="Nova senha"
            type="password" outlined dense
          />
          <q-input
            v-model="pwdForm.confirm" label="Confirmar nova senha"
            type="password" outlined dense
          />
          <div v-if="pwdError" class="text-negative text-caption">{{ pwdError }}</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup @click="resetPwd" />
          <q-btn
            color="primary" label="Salvar"
            :loading="pwdSaving"
            :disable="!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm"
            @click="salvarSenha"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuth } from 'src/composables/useAuth'
import { supabase } from 'src/boot/supabase'

const $q = useQuasar()
const router = useRouter()
const { currentUser, role, logout, updateUser } = useAuth()

const drawerOpen = ref(!$q.platform.is.mobile)
function toggleDrawer () { drawerOpen.value = !drawerOpen.value }

const allLinks = [
  { label: 'Caixa',      icon: 'point_of_sale',   to: '/',          roles: ['root', 'owner', 'workforce'] },
  { label: 'Estoque',    icon: 'inventory_2',      to: '/estoque',   roles: ['root', 'owner'] },
  { label: 'Dashboard',  icon: 'dashboard',        to: '/dashboard', roles: ['root', 'owner'] },
  { label: 'Histórico',  icon: 'history',          to: '/historico', roles: ['root', 'owner'] },
  { label: 'Usuários',   icon: 'manage_accounts',  to: '/usuarios',  roles: ['root'] }
]

const visibleLinks = computed(() => allLinks.filter(l => l.roles.includes(role.value)))

const roleLabel = computed(() => ({ root: 'Root', owner: 'Proprietário', workforce: 'Funcionário' }[role.value] ?? ''))
const roleColor = computed(() => ({ root: 'deep-purple', owner: 'primary', workforce: 'teal' }[role.value] ?? 'grey'))

function handleLogout () { logout(); router.push('/login') }

// ── Alterar senha ──
const pwdDialog = ref(false)
const pwdSaving = ref(false)
const pwdError  = ref('')
const pwdForm   = ref({ current: '', newPwd: '', confirm: '' })

function resetPwd () {
  pwdForm.value = { current: '', newPwd: '', confirm: '' }
  pwdError.value = ''
}

async function sha256 (str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function salvarSenha () {
  pwdError.value = ''
  if (pwdForm.value.newPwd !== pwdForm.value.confirm) {
    pwdError.value = 'As senhas não coincidem.'
    return
  }
  if (pwdForm.value.newPwd.length < 4) {
    pwdError.value = 'A senha deve ter pelo menos 4 caracteres.'
    return
  }
  pwdSaving.value = true
  try {
    const currentHash = await sha256(pwdForm.value.current)
    const { data } = await supabase
      .from('app_users').select('id')
      .eq('id', currentUser.value.id)
      .eq('password_hash', currentHash)
      .single()
    if (!data) { pwdError.value = 'Senha atual incorreta.'; return }
    await updateUser(currentUser.value.id, { password: pwdForm.value.newPwd })
    $q.notify({ type: 'positive', message: 'Senha alterada com sucesso!' })
    pwdDialog.value = false
    resetPwd()
  } catch {
    pwdError.value = 'Erro ao alterar senha.'
  } finally {
    pwdSaving.value = false
  }
}
</script>
