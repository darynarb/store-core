<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <div class="text-h5 text-weight-bold">
        <q-icon name="history" class="q-mr-sm" />Histórico de Ações
      </div>
      <q-space />
      <q-btn outline color="teal" icon="download" label="Exportar CSV" @click="exportCSV" :disable="filteredRows.length === 0" />
    </div>

    <!-- Filtros -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-4 col-md-3">
        <q-select
          v-model="filterUser"
          :options="userOptions"
          option-value="value" option-label="label"
          label="Usuário"
          outlined dense clearable emit-value map-options
        />
      </div>
      <div class="col-12 col-sm-4 col-md-2">
        <q-select
          v-model="filterType"
          :options="typeOptions"
          option-value="value" option-label="label"
          label="Tipo"
          outlined dense emit-value map-options
        />
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-input v-model="filterDateFrom" label="De" type="date" outlined dense />
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <q-input v-model="filterDateTo" label="Até" type="date" outlined dense />
      </div>
      <div class="col-12 col-sm-4 col-md-2">
        <q-btn color="primary" icon="search" label="Buscar" class="full-width full-height" @click="load" :loading="loading" />
      </div>
      <div class="col-12 col-sm-2 col-md-1">
        <q-btn outline color="grey-7" icon="clear" class="full-width full-height" @click="clearFilters" />
      </div>
    </div>

    <!-- Totais rápidos -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div v-for="s in summary" :key="s.label" class="col-6 col-sm-3">
        <q-card flat bordered>
          <q-card-section class="q-py-sm text-center">
            <div class="text-caption text-grey-6">{{ s.label }}</div>
            <div class="text-h6 text-weight-bold" :class="`text-${s.color}`">{{ s.value }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Tabela -->
    <q-card flat bordered>
      <q-table
        :rows="filteredRows"
        :columns="columns"
        row-key="id"
        flat
        :loading="loading"
        :pagination="{ rowsPerPage: 20 }"
        no-data-label="Nenhum registro encontrado"
      >
        <template #body-cell-type="props">
          <q-td :props="props">
            <q-badge :color="typeColor(props.value)" :label="typeLabel(props.value)" />
          </q-td>
        </template>
        <template #body-cell-total="props">
          <q-td :props="props" class="text-right">
            <span class="text-weight-medium">{{ formatPrice(props.value) }}</span>
          </q-td>
        </template>
        <template #body-cell-created_at="props">
          <q-td :props="props">{{ formatDate(props.value) }}</q-td>
        </template>
        <template #body-cell-user_name="props">
          <q-td :props="props">
            <span v-if="props.value" class="text-weight-medium">{{ props.value }}</span>
            <span v-else class="text-grey-5">—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'

const loading = ref(false)
const rows = ref([])
const allUsers = ref([])

const filterUser = ref(null)
const filterType = ref(null)
const filterDateFrom = ref('')
const filterDateTo = ref('')

const typeOptions = [
  { value: null,      label: 'Todas' },
  { value: 'venda',   label: 'Venda' },
  { value: 'troca',   label: 'Troca' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida',   label: 'Saída' }
]

const userOptions = computed(() =>
  allUsers.value.map(u => ({ value: u.id, label: `${u.name} (${roleLabel(u.role)})` }))
)

const columns = [
  { name: 'created_at',   label: 'Data/Hora',   field: 'created_at',   align: 'left',   sortable: true },
  { name: 'user_name',    label: 'Usuário',      field: 'user_name',    align: 'left',   sortable: true },
  { name: 'type',         label: 'Tipo',         field: 'type',         align: 'center', sortable: true },
  { name: 'product_name', label: 'Produto',      field: 'product_name', align: 'left' },
  { name: 'category',     label: 'Categoria',    field: 'category',     align: 'left',   sortable: true },
  { name: 'quantity',     label: 'Qtd',          field: 'quantity',     align: 'center' },
  { name: 'total',        label: 'Total',        field: 'total',        align: 'right',  sortable: true },
  { name: 'notes',        label: 'Obs.',         field: 'notes',        align: 'left' }
]

const filteredRows = computed(() =>
  rows.value.filter(r => {
    if (filterUser.value && r.user_id !== filterUser.value) return false
    if (filterType.value && r.type !== filterType.value) return false
    return true
  })
)

const summary = computed(() => {
  const vendas = filteredRows.value.filter(r => r.type === 'venda')
  const trocas = filteredRows.value.filter(r => r.type === 'troca')
  const totalVendas = vendas.reduce((s, r) => s + (r.total ?? 0), 0)
  return [
    { label: 'Vendas',       value: vendas.length,            color: 'positive' },
    { label: 'Total Vendas', value: formatPrice(totalVendas), color: 'positive' },
    { label: 'Trocas',       value: trocas.length,            color: 'primary' },
    { label: 'Registros',    value: filteredRows.value.length, color: 'grey-7' }
  ]
})

async function load () {
  loading.value = true
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (filterDateFrom.value) query = query.gte('created_at', filterDateFrom.value)
    if (filterDateTo.value)   query = query.lte('created_at', filterDateTo.value + 'T23:59:59')
    const { data, error } = await query
    if (error) throw error
    rows.value = data ?? []
  } finally {
    loading.value = false
  }
}

async function loadUsers () {
  const { data } = await supabase
    .from('app_users')
    .select('id, name, role')
    .eq('active', true)
    .order('name')
  allUsers.value = data ?? []
}

function clearFilters () {
  filterUser.value = null
  filterType.value = null
  filterDateFrom.value = ''
  filterDateTo.value = ''
  load()
}

function typeLabel (t)  { return { venda: 'Venda', troca: 'Troca', entrada: 'Entrada', saida: 'Saída' }[t] ?? t }
function typeColor (t)  { return { venda: 'positive', troca: 'primary', entrada: 'teal', saida: 'warning' }[t] ?? 'grey' }
function roleLabel (r)  { return { root: 'Root', owner: 'Proprietário', workforce: 'Funcionário' }[r] ?? r }

function formatPrice (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}
function formatDate (v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v))
}

function exportCSV () {
  const headers = ['Data/Hora', 'Usuário', 'Tipo', 'Produto', 'Categoria', 'Qtd', 'Total', 'Obs']
  const rows = filteredRows.value.map(r => [
    formatDate(r.created_at),
    r.user_name ?? '',
    typeLabel(r.type),
    r.product_name ?? '',
    r.category ?? '',
    r.quantity,
    String(r.total ?? 0).replace('.', ','),
    (r.notes ?? '').replace(/"/g, '""')
  ].map(v => `"${v}"`).join(';'))

  const csv = [headers.join(';'), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `historico_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => Promise.all([load(), loadUsers()]))
</script>
