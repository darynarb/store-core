<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round icon="arrow_back" @click="router.push('/')" class="q-mr-sm" />
      <div>
        <div class="text-h5 text-weight-bold text-positive">
          <q-icon name="shopping_cart" class="q-mr-sm" />Venda
        </div>
        <div class="text-caption text-grey-6">Selecione os produtos e finalize a venda</div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- Product selection -->
      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section class="q-pb-sm">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="selectedCategory"
                  :options="['Todas', ...CATEGORIES]"
                  label="Categoria"
                  outlined dense
                />
              </div>
              <div class="col-12 col-sm-5">
                <q-input v-model="search" label="Buscar produto" outlined dense>
                  <template #append><q-icon name="search" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-2">
                <q-toggle
                  v-model="hideOutOfStock"
                  label="Só com estoque"
                  color="positive"
                  dense
                />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-sm">
            <div v-if="loading" class="text-center q-py-lg">
              <q-spinner size="2rem" color="primary" />
            </div>
            <div v-else-if="filteredProducts.length === 0" class="text-center text-grey-5 q-py-lg">
              Nenhum produto encontrado
            </div>
            <div v-else class="row q-col-gutter-sm">
              <div v-for="p in filteredProducts" :key="p.id" class="col-12 col-sm-6">
                <q-card
                  flat bordered clickable v-ripple
                  class="product-item cursor-pointer"
                  :class="{ 'out-of-stock': p.quantity === 0 }"
                  @click="addToCart(p)"
                >
                  <q-card-section class="q-py-sm q-px-md">
                    <div class="row items-center no-wrap">
                      <div class="col">
                        <div class="text-subtitle2 text-weight-medium ellipsis">{{ p.name }}</div>
                        <div class="text-caption text-grey-6">{{ p.category }}</div>
                      </div>
                      <div class="col-auto text-right q-ml-sm">
                        <div class="text-subtitle1 text-weight-bold text-positive">
                          {{ formatPrice(p.price) }}
                        </div>
                        <q-badge
                          v-if="canAccessStock"
                          :color="p.quantity > 0 ? 'teal' : 'negative'"
                          :label="`${p.quantity} un`"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Cart -->
      <div class="col-12 col-md-5">
        <q-card flat bordered class="sticky-cart">
          <q-card-section class="q-pb-sm">
            <div class="text-h6 text-weight-bold">
              <q-icon name="receipt" class="q-mr-xs" />Carrinho
            </div>
          </q-card-section>
          <q-separator />

          <q-card-section class="q-pa-sm">
            <div v-if="cart.length === 0" class="text-center text-grey-5 q-py-md">
              Nenhum item adicionado
            </div>
            <q-list v-else separator>
              <q-item v-for="(item, i) in cart" :key="item.id" class="q-pa-sm">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ item.name }}</q-item-label>
                  <q-item-label caption>{{ formatPrice(item.price) }} un</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row items-center q-gutter-xs">
                    <q-btn round flat icon="remove" size="xs" @click="decreaseQty(i)" />
                    <span class="text-weight-bold q-px-xs">{{ item.cartQty }}</span>
                    <q-btn round flat icon="add" size="xs" @click="increaseQty(i)" />
                    <q-btn round flat icon="delete" size="xs" color="negative" @click="removeFromCart(i)" />
                  </div>
                  <div class="text-right text-positive text-weight-bold text-caption">
                    {{ formatPrice(item.price * item.cartQty) }}
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>

          <q-separator />
          <q-card-section class="q-py-sm">
            <div class="row justify-between text-h6 text-weight-bold">
              <span>Total</span>
              <span class="text-positive">{{ formatPrice(cartTotal) }}</span>
            </div>
          </q-card-section>
          <q-card-actions class="q-pa-md">
            <q-btn
              label="Finalizar Venda"
              color="positive" icon="check_circle"
              class="full-width" size="lg"
              :disable="cart.length === 0"
              :loading="saving"
              @click="abrirConfirmacao"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog de confirmação -->
    <q-dialog v-model="confirmDialog">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">
          <q-icon name="check_circle" color="positive" class="q-mr-sm" />Confirmar Venda
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-list dense separator>
            <q-item v-for="item in cart" :key="item.id">
              <q-item-section>{{ item.name }} × {{ item.cartQty }}</q-item-section>
              <q-item-section side class="text-positive text-weight-medium">
                {{ formatPrice(item.price * item.cartQty) }}
              </q-item-section>
            </q-item>
          </q-list>
          <div class="row justify-between text-h6 text-weight-bold q-mt-sm q-px-sm">
            <span>Total</span>
            <span class="text-positive">{{ formatPrice(cartTotal) }}</span>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cancelar" v-close-popup />
          <q-btn color="positive" icon="check_circle" label="Confirmar" :loading="saving" @click="confirmarVenda" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStock, CATEGORIES } from 'src/composables/useStock'
import { useAuth } from 'src/composables/useAuth'

const router = useRouter()
const { canAccessStock } = useAuth()
const { products, loading, fetchProducts, finalizarVenda } = useStock()

const selectedCategory = ref('Todas')
const search = ref('')
const hideOutOfStock = ref(false)
const cart = ref([])
const saving = ref(false)
const confirmDialog = ref(false)

const filteredProducts = computed(() =>
  products.value.filter(p => {
    if (hideOutOfStock.value && p.quantity === 0) return false
    const matchCat = selectedCategory.value === 'Todas' || p.category === selectedCategory.value
    const matchSearch = !search.value || p.name.toLowerCase().includes(search.value.toLowerCase())
    return matchCat && matchSearch
  })
)

const cartTotal = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price * item.cartQty, 0)
)

function addToCart (product) {
  if (product.quantity === 0) return
  const existing = cart.value.find(i => i.id === product.id)
  if (existing) {
    if (existing.cartQty < product.quantity) existing.cartQty++
  } else {
    cart.value.push({ ...product, cartQty: 1 })
  }
}

function increaseQty (i) {
  const item = cart.value[i]
  const stockItem = products.value.find(p => p.id === item.id)
  if (item.cartQty < (stockItem?.quantity ?? item.cartQty)) item.cartQty++
}

function decreaseQty (i) {
  if (cart.value[i].cartQty > 1) cart.value[i].cartQty--
  else removeFromCart(i)
}

function removeFromCart (i) { cart.value.splice(i, 1) }

function abrirConfirmacao () { confirmDialog.value = true }

async function confirmarVenda () {
  saving.value = true
  try {
    await finalizarVenda(cart.value)
    cart.value = []
    confirmDialog.value = false
    await fetchProducts()
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

<style scoped>
.product-item { transition: background 0.1s; }
.product-item:hover { background: #f5f5f5; }
.out-of-stock { opacity: 0.5; pointer-events: none; }
.sticky-cart { position: sticky; top: 72px; }
</style>
