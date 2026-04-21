<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">
          <q-icon name="manage_accounts" class="q-mr-sm" />Usuários
        </div>
        <div class="text-caption text-grey-6">Gerenciamento de acesso ao sistema</div>
      </div>
      <q-space />
      <q-btn color="primary" icon="person_add" label="Novo Usuário" @click="openDialog()" />
    </div>

    <q-card flat bordered>
      <q-table
        :rows="users"
        :columns="columns"
        row-key="id"
        flat
        :loading="loadingList"
        no-data-label="Nenhum usuário cadastrado"
      >
        <template #body-cell-role="props">
          <q-td :props="props">
            <q-badge :color="roleColor(props.value)" :label="roleLabel(props.value)" />
          </q-td>
        </template>
        <template #body-cell-active="props">
          <q-td :props="props">
            <q-badge :color="props.value ? 'positive' : 'grey-5'" :label="props.value ? 'Ativo' : 'Inativo'" />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="q-gutter-xs">
            <q-btn flat round icon="edit" size="sm" color="primary" @click="openDialog(props.row)" />
            <q-btn
              flat round size="sm"
              :icon="props.row.active ? 'block' : 'check_circle'"
              :color="props.row.active ? 'negative' : 'positive'"
              :disable="props.row.id === currentUser.id"
              @click="toggleActive(props.row)"
            />
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- Dialog -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingId ? 'Editar Usuário' : 'Novo Usuário' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md q-gutter-sm">
          <q-input v-model="form.name" label="Nome *" outlined dense :rules="[v => !!v || 'Obrigatório']" />
          <q-input v-model="form.email" label="E-mail *" type="email" outlined dense :rules="[v => !!v || 'Obrigatório']" :disable="!!editingId" />
          <q-input
            v-model="form.password"
            :label="editingId ? 'Nova senha (deixe em branco para não alterar)' : 'Senha *'"
            type="password" outlined dense
            :rules="editingId ? [] : [v => !!v || 'Obrigatório']"
          />
          <q-select
            v-model="form.role"
            :options="roleOptions"
            option-value="value" option-label="label"
            label="Permissão *"
            outlined dense emit-value map-options
            :disable="editingId === currentUser.id"
            :rules="[v => !!v || 'Obrigatório']"
          />
        </q-card-section>

        <div v-if="dialogError" class="text-negative text-caption q-px-md">{{ dialogError }}</div>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn
            color="primary" :label="editingId ? 'Salvar' : 'Criar'"
            :loading="dialogSaving"
            :disable="!form.name || !form.email || !form.role || (!editingId && !form.password)"
            @click="saveUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuth } from 'src/composables/useAuth'

const $q = useQuasar()
const { currentUser, getUsers, createUser, updateUser } = useAuth()

const users = ref([])
const loadingList = ref(false)
const dialogOpen = ref(false)
const dialogSaving = ref(false)
const dialogError = ref('')
const editingId = ref(null)

const form = ref({ name: '', email: '', password: '', role: '' })

const roleOptions = [
  { value: 'root',      label: 'Root' },
  { value: 'owner',     label: 'Proprietário' },
  { value: 'workforce', label: 'Funcionário' }
]

const columns = [
  { name: 'name',    label: 'Nome',      field: 'name',    align: 'left',  sortable: true },
  { name: 'email',   label: 'E-mail',    field: 'email',   align: 'left',  sortable: true },
  { name: 'role',    label: 'Permissão', field: 'role',    align: 'center' },
  { name: 'active',  label: 'Status',    field: 'active',  align: 'center' },
  { name: 'actions', label: 'Ações',     field: 'actions', align: 'center' }
]

function roleLabel (r) {
  return { root: 'Root', owner: 'Proprietário', workforce: 'Funcionário' }[r] ?? r
}
function roleColor (r) {
  return { root: 'deep-purple', owner: 'primary', workforce: 'teal' }[r] ?? 'grey'
}

async function loadUsers () {
  loadingList.value = true
  try { users.value = await getUsers() } catch { /* silent */ } finally { loadingList.value = false }
}

function openDialog (user = null) {
  editingId.value = user?.id ?? null
  dialogError.value = ''
  form.value = {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? ''
  }
  dialogOpen.value = true
}

async function saveUser () {
  dialogSaving.value = true
  dialogError.value = ''
  try {
    if (editingId.value) {
      const fields = { name: form.value.name, role: form.value.role }
      if (form.value.password) fields.password = form.value.password
      await updateUser(editingId.value, fields)
      $q.notify({ type: 'positive', message: 'Usuário atualizado!' })
    } else {
      await createUser(form.value)
      $q.notify({ type: 'positive', message: 'Usuário criado!' })
    }
    dialogOpen.value = false
    await loadUsers()
  } catch (e) {
    dialogError.value = e.message
  } finally {
    dialogSaving.value = false
  }
}

async function toggleActive (user) {
  try {
    await updateUser(user.id, { active: !user.active })
    await loadUsers()
  } catch {
    $q.notify({ type: 'negative', message: 'Erro ao alterar status.' })
  }
}

onMounted(loadUsers)
</script>
