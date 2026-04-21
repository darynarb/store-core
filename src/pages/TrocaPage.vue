<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="router.push('/')" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold text-primary">
          <q-icon name="swap_horiz" class="q-mr-sm" />Troca
        </div>
        <div class="text-caption text-grey-6">Produto devolvido pelo cliente e novo(s) produto(s) entregue(s)</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">

      <!-- ── Produto Devolvido ── -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="full-height">
          <q-card-section class="bg-red-1">
            <div class="text-subtitle1 text-weight-bold text-negative q-mb-sm">
              <q-icon name="undo" class="q-mr-xs" />Produto Devolvido
            </div>

            <q-toggle v-model="returnNotRegistered" label="Produto não cadastrado no sistema" color="negative" dense class="q-mb-sm" />

            <template v-if="returnNotRegistered">
              <q-select v-model="returnFreeCategory" :options="CATEGORIES" label="Categoria" outlined dense class="q-mb-sm" />
              <q-input v-model="returnFreeName" label="Nome (opcional)" outlined dense class="q-mb-sm" />
              <q-input v-model.number="returnFreePrice" label="Valor (R$)" type="number" min="0" step="0.01" outlined dense class="q-mb-sm" prefix="R$" />
            </template>
            <template v-else>
              <q-select
                v-model="returnCategory" :options="['Todas', ...CATEGORIES]"
                label="Categoria" outlined dense class="q-mb-sm"
                @update:model-value="returnProduct = null"
              />
              <q-select
                v-model="returnProduct" :options="returnOptions"
                option-value="id" option-label="label"
                label="Produto" outlined dense class="q-mb-sm"
                emit-value map-options :loading="loading"
              />
            </template>

            <q-input v-model.number="returnQty" label="Quantidade" type="number" min="1" outlined dense />
            <div class="text-caption text-negative q-mt-sm">
              Total devolvido: <strong>{{ formatPrice(effectiveReturnPrice * returnQty) }}</strong>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- ── Produtos Entregues ── -->
      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section class="bg-green-1 q-pb-sm">
            <div class="row items-center q-mb-sm">
              <div class="text-subtitle1 text-weight-bold text-positive">
                <q-icon name="redo" class="q-mr-xs" />Produtos Entregues
              </div>
              <q-space />
              <q-btn
                outline color="positive" icon="add" label="Adicionar produto"
                size="sm" :disable="giveItems.length >= 3" @click="addGiveItem"
              />
            </div>

            <div
              v-for="(item, i) in giveItems"
              :key="i"
              class="q-pa-sm q-mb-sm rounded-borders bg-white"
              style="border: 1px solid #e0e0e0"
            >
              <div class="row items-center q-mb-xs">
                <div class="text-caption text-weight-bold text-grey-7">Item {{ i + 1 }}</div>
                <q-space />
                <q-btn
                  v-if="giveItems.length > 1"
                  flat round icon="close" size="xs" color="negative"
                  @click="removeGiveItem(i)"
                />
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-5">
                  <q-select
                    v-model="item.category"
                    :options="['Todas', ...CATEGORIES]"
                    label="Categoria"
                    outlined dense
                    @update:model-value="item.product = null"
                  />
                </div>
                <div class="col-12 col-sm-5">
                  <q-select
                    v-model="item.product"
                    :options="giveOptionsFor(item.category)"
                    option-value="id" option-label="label"
                    label="Produto"
                    outlined dense
                    emit-value map-options :loading="loading"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model.number="item.qty"
                    label="Qtd" type="number" min="1"
                    outlined dense
                  />
                </div>
              </div>
              <div v-if="giveProductData(i)" class="text-caption text-positive q-mt-xs">
                {{ formatPrice(giveProductData(i).price) }} un
                — subtotal: <strong>{{ formatPrice(giveProductData(i).price * item.qty) }}</strong>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Resumo + observações -->
    <div class="q-mt-md row q-col-gutter-md items-start">
      <div class="col-12 col-sm-6">
        <q-input v-model="notes" label="Observações (opcional)" outlined dense />
      </div>
      <div class="col-12 col-sm-6">
        <q-card flat bordered class="q-pa-sm">
          <div class="row justify-between text-caption q-mb-xs">
            <span class="text-grey-7">Total devolvido</span>
            <span class="text-negative">{{ formatPrice(returnTotal) }}</span>
          </div>
          <div class="row justify-between text-caption q-mb-xs">
            <span class="text-grey-7">Total entregue</span>
            <span class="text-positive">{{ formatPrice(giveTotal) }}</span>
          </div>
          <q-separator class="q-my-xs" />
          <div class="row justify-between text-subtitle2 text-weight-bold">
            <span>Diferença</span>
            <span :class="priceDiff > 0 ? 'text-positive' : priceDiff < 0 ? 'text-negative' : 'text-grey-6'">
              {{ priceDiff > 0 ? '+' : '' }}{{ formatPrice(priceDiff) }}
              <span v-if="priceDiff > 0" class="text-caption text-grey-6"> (cliente paga)</span>
              <span v-else-if="priceDiff < 0" class="text-caption text-grey-6"> (loja devolve)</span>
            </span>
          </div>
        </q-card>
      </div>
    </div>

    <q-btn
      color="primary" icon="check_circle" label="Confirmar Troca"
      class="q-mt-md" size="md"
      :disable="!canConfirm"
      :loading="saving"
      @click="confirmar"
    />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStock, CATEGORIES } from 'src/composables/useStock'
import { adjustStock, registerTransaction } from 'src/services/stockService'
import { useQuasar } from 'quasar'
import { useAuth } from 'src/composables/useAuth'

const router = useRouter()
const $q = useQuasar()
const { currentUser } = useAuth()
const { products, loading, fetchProducts } = useStock()

function userMeta () {
  return { user_id: currentUser.value?.id ?? null, user_name: currentUser.value?.name ?? null }
}

// Produto devolvido
const returnCategory = ref('Todas')
const returnProduct = ref(null)
const returnQty = ref(1)
const returnNotRegistered = ref(false)
const returnFreeCategory = ref('')
const returnFreeName = ref('')
const returnFreePrice = ref(0)

// Produtos entregues (lista dinâmica)
const giveItems = ref([{ category: 'Todas', product: null, qty: 1 }])

const notes = ref('')
const saving = ref(false)

function productLabel (p) {
  const nameStr = p.name && p.name !== p.category ? `${p.name} — ` : ''
  return `${nameStr}${p.category} — ${formatPrice(p.price)}`
}

const returnOptions = computed(() => {
  const list = returnCategory.value === 'Todas'
    ? products.value
    : products.value.filter(p => p.category === returnCategory.value)
  return list.map(p => ({ id: p.id, label: productLabel(p) }))
})

function giveOptionsFor (category) {
  const list = category === 'Todas'
    ? products.value
    : products.value.filter(p => p.category === category)
  return list
    .filter(p => p.quantity > 0)
    .map(p => ({ id: p.id, label: productLabel(p) }))
}

const returnProductData = computed(() => products.value.find(p => p.id === returnProduct.value))

const effectiveReturnPrice = computed(() =>
  returnNotRegistered.value ? (returnFreePrice.value || 0) : (returnProductData.value?.price ?? 0)
)

function giveProductData (i) {
  return products.value.find(p => p.id === giveItems.value[i]?.product)
}

const returnTotal = computed(() => effectiveReturnPrice.value * (returnQty.value || 0))

const giveTotal = computed(() =>
  giveItems.value.reduce((sum, item) => {
    const p = products.value.find(x => x.id === item.product)
    return sum + (p?.price ?? 0) * (item.qty || 0)
  }, 0)
)

const priceDiff = computed(() => giveTotal.value - returnTotal.value)

const canConfirm = computed(() => {
  const returnOk = returnNotRegistered.value
    ? (returnFreeCategory.value && returnQty.value > 0)
    : (returnProduct.value && returnQty.value > 0)
  return returnOk && giveItems.value.every(i => i.product && i.qty > 0)
})

function addGiveItem () {
  giveItems.value.push({ category: 'Todas', product: null, qty: 1 })
}

function removeGiveItem (i) {
  giveItems.value.splice(i, 1)
}

async function confirmar () {
  saving.value = true
  try {
    // Return: add stock back (only if product is in system)
    if (returnNotRegistered.value) {
      await registerTransaction({
        type: 'troca',
        product_id: null,
        product_name: returnFreeName.value || returnFreeCategory.value,
        category: returnFreeCategory.value,
        quantity: returnQty.value,
        unit_price: returnFreePrice.value,
        total: returnFreePrice.value * returnQty.value,
        notes: `[DEVOLUÇÃO - não cadastrado] ${notes.value}`, ...userMeta()
      })
    } else {
      const rp = returnProductData.value
      if (!rp) return
      await adjustStock(rp.id, returnQty.value)
      await registerTransaction({
        type: 'troca', product_id: rp.id, product_name: rp.name,
        category: rp.category, quantity: returnQty.value,
        unit_price: rp.price, total: rp.price * returnQty.value,
        notes: `[DEVOLUÇÃO] ${notes.value}`, ...userMeta()
      })
    }
    // Give: remove each item from stock
    for (const item of giveItems.value) {
      const gp = products.value.find(p => p.id === item.product)
      if (!gp) continue
      await adjustStock(gp.id, -item.qty)
      await registerTransaction({
        type: 'troca', product_id: gp.id, product_name: gp.name,
        category: gp.category, quantity: item.qty,
        unit_price: gp.price, total: gp.price * item.qty,
        notes: `[ENTREGA] ${notes.value}`, ...userMeta()
      })
    }
    $q.notify({ type: 'positive', message: 'Troca registrada com sucesso!' })
    returnProduct.value = null
    returnQty.value = 1
    returnNotRegistered.value = false
    returnFreeCategory.value = ''
    returnFreeName.value = ''
    returnFreePrice.value = 0
    giveItems.value = [{ category: 'Todas', product: null, qty: 1 }]
    notes.value = ''
    await fetchProducts()
  } catch (e) {
    $q.notify({ type: 'negative', message: e.message || 'Erro ao registrar troca.' })
  } finally {
    saving.value = false
  }
}

function formatPrice (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}

onMounted(() => fetchProducts())
</script>
