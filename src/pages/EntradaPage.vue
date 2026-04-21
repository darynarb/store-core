<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="router.push('/')" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold text-teal">
          <q-icon name="add_circle" class="q-mr-sm" />Entrada
        </div>
        <div class="text-caption text-grey-6">Adicionar unidades ao estoque de um produto existente</div>
      </div>
    </div>

    <q-card flat bordered style="max-width: 600px">
      <q-card-section>
        <q-select
          v-model="selectedCategory"
          :options="['Todas', ...CATEGORIES]"
          label="Filtrar por categoria"
          outlined dense class="q-mb-md"
          @update:model-value="onCategoryChange"
        />
        <q-select
          v-model="selectedProduct"
          :options="productOptions"
          option-value="id"
          option-label="label"
          label="Produto"
          outlined dense class="q-mb-md"
          :loading="loading"
          emit-value map-options
        />
        <q-input
          v-model.number="quantity"
          label="Quantidade a adicionar"
          type="number" min="1"
          outlined dense class="q-mb-md"
          :rules="[v => v > 0 || 'Mínimo 1']"
        />
        <q-input
          v-model.number="unitPrice"
          label="Preço unitário (R$)"
          type="number" min="0" step="0.01"
          outlined dense class="q-mb-md"
          prefix="R$"
        />
        <q-input v-model="notes" label="Observações (opcional)" outlined dense class="q-mb-md" />

        <div v-if="selectedProductData" class="bg-teal-1 rounded-borders q-pa-sm q-mb-md">
          <div class="text-caption text-teal-9">
            Estoque atual: <strong>{{ selectedProductData.quantity }} un</strong>
            → após entrada: <strong>{{ selectedProductData.quantity + (quantity || 0) }} un</strong>
          </div>
        </div>

        <q-btn
          color="teal" icon="check_circle" label="Confirmar Entrada"
          class="full-width" size="md"
          :disable="!selectedProduct || !quantity || quantity <= 0"
          :loading="saving"
          @click="confirmar"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStock, CATEGORIES } from 'src/composables/useStock'

const router = useRouter()
const { products, loading, fetchProducts, registrarMovimento } = useStock()

const selectedCategory = ref('Todas')
const selectedProduct = ref(null)
const quantity = ref(1)
const unitPrice = ref(0)
const notes = ref('')
const saving = ref(false)

const filteredProducts = computed(() =>
  selectedCategory.value === 'Todas'
    ? products.value
    : products.value.filter(p => p.category === selectedCategory.value)
)

const productOptions = computed(() =>
  filteredProducts.value.map(p => ({
    id: p.id,
    label: productLabel(p)
  }))
)

const selectedProductData = computed(() =>
  products.value.find(p => p.id === selectedProduct.value)
)

// Auto-fill price when product is selected
watch(selectedProductData, (p) => {
  if (p) unitPrice.value = p.price
})

function productLabel (p) {
  const nameStr = p.name && p.name !== p.category ? `${p.name} — ` : ''
  return `${nameStr}${p.category} — ${formatPrice(p.price)} — ${p.quantity} un`
}

function onCategoryChange () {
  selectedProduct.value = null
}

async function confirmar () {
  const p = selectedProductData.value
  if (!p) return
  saving.value = true
  try {
    await registrarMovimento('entrada', p.id, p.name, p.category, quantity.value, unitPrice.value, notes.value)
    selectedProduct.value = null
    quantity.value = 1
    unitPrice.value = 0
    notes.value = ''
    await fetchProducts()
  } catch {
    // handled in composable
  } finally {
    saving.value = false
  }
}

function formatPrice (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}

onMounted(() => fetchProducts())
</script>
