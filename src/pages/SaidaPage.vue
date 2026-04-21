<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="router.push('/')" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold text-warning">
          <q-icon name="remove_circle" class="q-mr-sm" />Saída
        </div>
        <div class="text-caption text-grey-6">Registrar saída de produto sem venda (perda, avaria, etc.)</div>
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
          label="Quantidade a remover"
          type="number" min="1"
          outlined dense class="q-mb-md"
          :rules="[v => v > 0 || 'Mínimo 1']"
        />
        <q-input
          v-model="reason"
          label="Motivo (opcional)"
          outlined dense class="q-mb-md"
        />
        <q-input v-model="notes" label="Observações (opcional)" outlined dense class="q-mb-md" />

        <div v-if="selectedProductData" class="q-mb-md">
          <div
            class="rounded-borders q-pa-sm"
            :class="hasEnoughStock ? 'bg-orange-1' : 'bg-red-1'"
          >
            <div class="text-caption" :class="hasEnoughStock ? 'text-orange-9' : 'text-negative'">
              Estoque atual: <strong>{{ selectedProductData.quantity }} un</strong>
              <span v-if="hasEnoughStock">
                → após saída: <strong>{{ selectedProductData.quantity - (quantity || 0) }} un</strong>
              </span>
              <span v-else> — <strong>Estoque insuficiente!</strong></span>
            </div>
          </div>
        </div>

        <q-btn
          color="warning" icon="check_circle" label="Confirmar Saída"
          class="full-width" size="md"
          :disable="!selectedProduct || !quantity || quantity <= 0 || !hasEnoughStock"
          :loading="saving"
          @click="confirmar"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStock, CATEGORIES } from 'src/composables/useStock'

const router = useRouter()
const { products, loading, fetchProducts, registrarMovimento } = useStock()

const selectedCategory = ref('Todas')
const selectedProduct = ref(null)
const quantity = ref(1)
const reason = ref('')
const notes = ref('')
const saving = ref(false)


const filteredProducts = computed(() =>
  selectedCategory.value === 'Todas'
    ? products.value
    : products.value.filter(p => p.category === selectedCategory.value)
)

function productLabel (p) {
  const nameStr = p.name && p.name !== p.category ? `${p.name} — ` : ''
  return `${nameStr}${p.category} — ${formatPrice(p.price)} — ${p.quantity} un`
}

const productOptions = computed(() =>
  filteredProducts.value.map(p => ({ id: p.id, label: productLabel(p) }))
)

const selectedProductData = computed(() =>
  products.value.find(p => p.id === selectedProduct.value)
)

const hasEnoughStock = computed(() => {
  if (!selectedProductData.value) return false
  return selectedProductData.value.quantity >= (quantity.value || 0)
})

function onCategoryChange () {
  selectedProduct.value = null
}

async function confirmar () {
  const p = selectedProductData.value
  if (!p) return
  saving.value = true
  try {
    const obs = [reason.value, notes.value].filter(Boolean).join(' — ')
    await registrarMovimento('saida', p.id, p.name, p.category, quantity.value, p.price, obs)
    selectedProduct.value = null
    quantity.value = 1
    reason.value = ''
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
