<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg">
      <q-icon name="inventory_2" class="q-mr-sm" />Estoque
    </div>

    <q-tabs v-model="tab" dense align="left" indicator-color="primary" class="q-mb-md">
      <q-tab name="tabela" icon="table_chart" label="Visualizar" />
      <q-tab name="lote"   icon="add_box"    label="Adicionar em Lote" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <!-- ── Tabela por categoria ── -->
      <q-tab-panel name="tabela" class="q-pa-none">
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-12 col-sm-5">
            <q-select
              v-model="filterCategory" :options="['Todas', ...CATEGORIES]"
              label="Filtrar por categoria" outlined dense clearable
            />
          </div>
          <div class="col-12 col-sm-5">
            <q-input v-model="filterSearch" label="Buscar" outlined dense>
              <template #append><q-icon name="search" /></template>
            </q-input>
          </div>
          <div class="col-12 col-sm-2">
            <q-btn color="primary" icon="refresh" label="Atualizar" outline dense class="full-width full-height" @click="reload" />
          </div>
        </div>

        <div v-if="loading" class="text-center q-py-xl">
          <q-spinner size="3rem" color="primary" />
        </div>

        <template v-else>
          <div v-for="cat in visibleCategories" :key="cat" class="q-mb-lg">
            <div class="text-subtitle1 text-weight-bold text-primary q-mb-sm">
              <q-icon name="label" class="q-mr-xs" />{{ cat }}
              <q-badge color="grey-5" :label="productsByCategory[cat]?.length ?? 0" class="q-ml-xs" />
            </div>
            <q-table
              :rows="productsByCategory[cat] ?? []"
              :columns="columns" row-key="id"
              flat bordered dense hide-bottom :rows-per-page-options="[0]"
            >
              <template #body-cell-quantity="props">
                <q-td :props="props">
                  <q-badge
                    :color="props.value > 5 ? 'positive' : props.value > 0 ? 'warning' : 'negative'"
                    :label="props.value"
                  />
                </q-td>
              </template>
              <template #body-cell-price="props">
                <q-td :props="props">{{ formatPrice(props.value) }}</q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props" class="q-gutter-xs">
                  <q-btn flat round icon="edit"   size="sm" color="primary"  @click="openEditDialog(props.row)" />
                  <q-btn flat round icon="delete" size="sm" color="negative" @click="confirmDelete(props.row)" />
                </q-td>
              </template>
            </q-table>
          </div>
          <div v-if="visibleCategories.length === 0" class="text-center text-grey-5 q-py-xl">
            Nenhum produto encontrado
          </div>
        </template>
      </q-tab-panel>

      <!-- ── Adicionar em Lote ── -->
      <q-tab-panel name="lote" class="q-pa-none">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1 text-weight-bold q-mb-md">Adicionar Itens em Lote</div>
            <div v-for="(item, i) in batchItems" :key="i" class="row q-col-gutter-sm q-mb-sm items-end">
              <div class="col-12 col-sm-4">
                <q-input v-model="item.name" :label="`Nome #${i+1} (opcional)`" outlined dense />
              </div>
              <div class="col-12 col-sm-3">
                <q-select v-model="item.category" :options="CATEGORIES" label="Categoria" outlined dense :rules="[v => !!v || 'Obrigatório']" />
              </div>
              <div class="col-6 col-sm-2">
                <q-input v-model.number="item.price" label="Preço (R$)" type="number" min="0" step="0.01" outlined dense />
              </div>
              <div class="col-4 col-sm-2">
                <q-input v-model.number="item.quantity" label="Qtd" type="number" min="0" outlined dense />
              </div>
              <div class="col-2 col-sm-1">
                <q-btn flat round icon="delete" color="negative" size="sm" :disable="batchItems.length === 1" @click="removeItem(i)" />
              </div>
            </div>
            <div class="row q-mt-md q-gutter-sm">
              <q-btn outline color="primary" icon="add" label="Adicionar linha" @click="addItem" />
              <q-space />
              <q-btn color="teal" icon="save" label="Salvar Lote" :loading="saving" :disable="!batchValid" @click="salvarLote" />
            </div>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <!-- FAB -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openDialog()" />
    </q-page-sticky>

    <!-- Dialog: adicionar / editar item -->
    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 340px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ editingId ? 'Editar Produto' : 'Adicionar Item' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup @click="resetDialog" />
        </q-card-section>

        <q-card-section class="q-pt-md q-gutter-sm">
          <q-input v-model="dialogItem.name" label="Nome do produto (opcional)" outlined dense />
          <q-select v-model="dialogItem.category" :options="CATEGORIES" label="Categoria *" outlined dense :rules="[v => !!v || 'Obrigatório']" />
          <q-input v-model.number="dialogItem.price" label="Preço (R$) *" type="number" min="0" step="0.01" outlined dense prefix="R$" />
          <q-input v-model.number="dialogItem.quantity" label="Quantidade *" type="number" min="0" outlined dense />
          <q-input v-model="dialogItem.description" label="Descrição (opcional)" outlined dense />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup @click="resetDialog" />
          <q-btn
            :color="editingId ? 'primary' : 'teal'"
            :icon="editingId ? 'save' : 'add'"
            :label="editingId ? 'Salvar' : 'Adicionar'"
            :loading="dialogSaving"
            :disable="!dialogItem.category"
            @click="salvarItem"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog: confirmar exclusão -->
    <q-dialog v-model="deleteDialogOpen">
      <q-card style="min-width: 300px">
        <q-card-section class="text-h6">Excluir produto</q-card-section>
        <q-card-section class="q-pt-none">
          Tem certeza que deseja excluir <strong>{{ deletingProduct?.name }}</strong>? Esta ação não pode ser desfeita.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="negative" label="Excluir" :loading="deleteSaving" @click="doDelete" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStock, CATEGORIES } from 'src/composables/useStock'

const { products, loading, fetchProducts, bulkAdd, updateProduct, deleteProduct } = useStock()

const tab = ref('tabela')
const filterCategory = ref(null)
const filterSearch = ref('')
const saving = ref(false)

// ── Dialog add/edit ──
const dialogOpen = ref(false)
const dialogSaving = ref(false)
const editingId = ref(null)
const defaultDialogItem = () => ({ name: '', category: '', price: 0, quantity: 0, description: '' })
const dialogItem = ref(defaultDialogItem())

function openDialog () {
  editingId.value = null
  dialogItem.value = defaultDialogItem()
  dialogOpen.value = true
}

function openEditDialog (product) {
  editingId.value = product.id
  dialogItem.value = {
    name: product.name ?? '',
    category: product.category ?? '',
    price: product.price ?? 0,
    quantity: product.quantity ?? 0,
    description: product.description ?? ''
  }
  dialogOpen.value = true
}

function resetDialog () {
  editingId.value = null
  dialogItem.value = defaultDialogItem()
}

async function salvarItem () {
  dialogSaving.value = true
  try {
    const payload = {
      name: dialogItem.value.name.trim() || dialogItem.value.category,
      category: dialogItem.value.category,
      price: Number(dialogItem.value.price) || 0,
      quantity: Number(dialogItem.value.quantity) || 0,
      description: dialogItem.value.description || null
    }
    if (editingId.value) {
      await updateProduct(editingId.value, payload)
    } else {
      await bulkAdd([payload])
    }
    dialogOpen.value = false
    resetDialog()
  } catch {
    // handled in composable
  } finally {
    dialogSaving.value = false
  }
}

// ── Dialog delete ──
const deleteDialogOpen = ref(false)
const deleteSaving = ref(false)
const deletingProduct = ref(null)

function confirmDelete (product) {
  deletingProduct.value = product
  deleteDialogOpen.value = true
}

async function doDelete () {
  deleteSaving.value = true
  try {
    await deleteProduct(deletingProduct.value.id)
    deleteDialogOpen.value = false
  } catch {
    // handled in composable
  } finally {
    deleteSaving.value = false
  }
}

// ── Table ──
const columns = [
  { name: 'name',        label: 'Nome',       field: 'name',        align: 'left',   sortable: true },
  { name: 'price',       label: 'Preço',      field: 'price',       align: 'right',  sortable: true },
  { name: 'quantity',    label: 'Estoque',    field: 'quantity',    align: 'center', sortable: true },
  { name: 'description', label: 'Descrição',  field: 'description', align: 'left' },
  { name: 'actions',     label: 'Ações',      field: 'actions',     align: 'center' }
]

const filteredProducts = computed(() =>
  products.value.filter(p => {
    const matchCat = !filterCategory.value || filterCategory.value === 'Todas' || p.category === filterCategory.value
    const matchSearch = !filterSearch.value || p.name.toLowerCase().includes(filterSearch.value.toLowerCase())
    return matchCat && matchSearch
  })
)

const productsByCategory = computed(() => {
  const map = {}
  for (const p of filteredProducts.value) {
    const cat = p.category || 'Sem categoria'
    if (!map[cat]) map[cat] = []
    map[cat].push(p)
  }
  return map
})

const visibleCategories = computed(() => {
  const all = CATEGORIES.filter(c => productsByCategory.value[c]?.length > 0)
  if (productsByCategory.value['Sem categoria']?.length > 0) all.push('Sem categoria')
  return all
})

async function reload () { await fetchProducts() }

// ── Batch form ──
const defaultItem = () => ({ name: '', category: '', price: 0, quantity: 0, description: '' })
const batchItems = ref([defaultItem()])
const batchValid = computed(() => batchItems.value.every(i => i.category))

function addItem () { batchItems.value.push(defaultItem()) }
function removeItem (i) { batchItems.value.splice(i, 1) }

async function salvarLote () {
  saving.value = true
  try {
    await bulkAdd(batchItems.value.map(i => ({
      name: i.name.trim() || i.category,
      category: i.category,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 0,
      description: i.description || null
    })))
    batchItems.value = [defaultItem()]
    tab.value = 'tabela'
  } catch {
    // handled in composable
  } finally {
    saving.value = false
  }
}

function formatPrice (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

onMounted(() => fetchProducts())
</script>
