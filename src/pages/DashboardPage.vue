<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h5 text-weight-bold">
        <q-icon name="dashboard" class="q-mr-sm" />Dashboard
      </div>
      <q-space />
      <q-btn-toggle
        v-model="period"
        :options="periodOptions"
        unelevated rounded
        color="grey-3" text-color="grey-8"
        toggle-color="primary" toggle-text-color="white"
        :disable="!!dateFrom || !!dateTo"
        @update:model-value="load"
      />
    </div>

    <div class="row q-col-gutter-sm q-mb-lg items-center">
      <div class="col-6 col-sm-3 col-md-2">
        <q-input v-model="dateFrom" label="De" type="date" outlined dense @update:model-value="load" />
      </div>
      <div class="col-6 col-sm-3 col-md-2">
        <q-input v-model="dateTo" label="Até" type="date" outlined dense @update:model-value="load" />
      </div>
      <div class="col-auto">
        <q-btn
          v-if="dateFrom || dateTo"
          flat dense icon="clear" color="grey-7" label="Limpar datas"
          @click="clearDates"
        />
      </div>
    </div>

    <!-- Cards de vendas -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="shopping_cart" size="2rem" color="positive" />
          <div v-if="loadingSales" class="q-mt-sm"><q-spinner color="positive" /></div>
          <div v-else class="text-h4 text-weight-bold text-positive">{{ salesCount }}</div>
          <div class="text-caption text-grey-7">Vendas ({{ periodLabel }})</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="attach_money" size="2rem" color="positive" />
          <div v-if="loadingSales" class="q-mt-sm"><q-spinner color="positive" /></div>
          <div v-else class="text-h5 text-weight-bold text-positive">{{ formatPrice(salesTotal) }}</div>
          <div class="text-caption text-grey-7">Faturamento ({{ periodLabel }})</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="trending_up" size="2rem" :color="growthColor" />
          <div v-if="loadingSales" class="q-mt-sm"><q-spinner :color="growthColor" /></div>
          <div v-else class="text-h4 text-weight-bold" :class="`text-${growthColor}`">
            {{ growth > 0 ? '+' : '' }}{{ growth }}%
          </div>
          <div class="text-caption text-grey-7">Crescimento vs período anterior</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="swap_horiz" size="2rem" color="primary" />
          <div v-if="loadingSales" class="q-mt-sm"><q-spinner color="primary" /></div>
          <div v-else class="text-h4 text-weight-bold text-primary">{{ trocasCount }}</div>
          <div class="text-caption text-grey-7">Trocas ({{ periodLabel }})</div>
        </q-card>
      </div>
    </div>

    <!-- Cards de estoque -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="inventory_2" size="2rem" color="primary" />
          <div v-if="loadingStock" class="q-mt-sm"><q-spinner color="primary" /></div>
          <div v-else class="text-h4 text-weight-bold text-primary">{{ totalProducts }}</div>
          <div class="text-caption text-grey-7">Produtos em estoque</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="category" size="2rem" color="orange" />
          <div v-if="loadingStock" class="q-mt-sm"><q-spinner color="orange" /></div>
          <div v-else class="text-h4 text-weight-bold text-orange">{{ totalCategories }}</div>
          <div class="text-caption text-grey-7">Categorias com itens</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="account_balance_wallet" size="2rem" color="teal" />
          <div v-if="loadingStock" class="q-mt-sm"><q-spinner color="teal" /></div>
          <div v-else class="text-h5 text-weight-bold text-teal">{{ formatPrice(stockValue) }}</div>
          <div class="text-caption text-grey-7">Valor em estoque</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="warning" size="2rem" color="negative" />
          <div v-if="loadingStock" class="q-mt-sm"><q-spinner color="negative" /></div>
          <div v-else class="text-h4 text-weight-bold text-negative">{{ lowStockCount }}</div>
          <div class="text-caption text-grey-7">Itens com estoque baixo (≤2)</div>
        </q-card>
      </div>
    </div>

    <!-- Top 5 mais vendidos -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section class="q-pb-sm">
            <div class="text-h6 text-weight-medium">
              <q-icon name="emoji_events" color="warning" class="q-mr-xs" />Top 5 mais vendidos
            </div>
          </q-card-section>
          <q-separator />
          <div v-if="loadingSales" class="text-center q-py-md"><q-spinner color="primary" /></div>
          <q-list v-else separator dense>
            <q-item v-for="(item, i) in topSellers" :key="item.name">
              <q-item-section avatar>
                <q-avatar :color="i === 0 ? 'warning' : 'grey-4'" text-color="white" size="sm">
                  {{ i + 1 }}
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
                <q-item-label caption>{{ item.category }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-weight-bold text-positive">{{ formatPrice(item.total) }}</div>
                  <div class="text-caption text-grey-6">{{ item.qty }} un vendidas</div>
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="!topSellers.length">
              <q-item-section class="text-center text-grey-5 q-py-sm">Sem vendas no período</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered>
          <q-card-section class="q-pb-sm">
            <div class="text-h6 text-weight-medium">
              <q-icon name="category" color="orange" class="q-mr-xs" />Vendas por categoria
            </div>
          </q-card-section>
          <q-separator />
          <div v-if="loadingSales" class="text-center q-py-md"><q-spinner color="primary" /></div>
          <q-list v-else separator dense>
            <q-item v-for="cat in salesByCategory" :key="cat.category">
              <q-item-section>
                <q-item-label>{{ cat.category }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="text-right">
                  <div class="text-weight-bold text-positive">{{ formatPrice(cat.total) }}</div>
                  <div class="text-caption text-grey-6">{{ cat.qty }} un</div>
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="!salesByCategory.length">
              <q-item-section class="text-center text-grey-5 q-py-sm">Sem vendas no período</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>

    <!-- Últimas vendas -->
    <q-card flat bordered>
      <q-card-section class="q-pb-sm">
        <div class="text-h6 text-weight-medium">Últimas vendas do período</div>
      </q-card-section>
      <q-separator />
      <div v-if="loadingSales" class="text-center q-py-xl">
        <q-spinner-dots color="primary" size="3rem" />
      </div>
      <q-list v-else separator>
        <q-item v-for="tx in recentSales" :key="tx.id">
          <q-item-section avatar>
            <q-avatar color="positive" text-color="white" icon="shopping_cart" size="sm" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ tx.product_name }}</q-item-label>
            <q-item-label caption>{{ tx.category }} · {{ tx.quantity }} un · {{ formatDate(tx.created_at) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <span class="text-positive text-weight-bold">{{ formatPrice(tx.total) }}</span>
          </q-item-section>
        </q-item>
        <q-item v-if="!recentSales.length">
          <q-item-section class="text-center text-grey-5 q-py-md">
            Nenhuma venda neste período
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from 'src/boot/supabase'

const period = ref('month')
const dateFrom = ref('')
const dateTo = ref('')

const periodOptions = [
  { label: 'Semana', value: 'week' },
  { label: 'Mês',    value: 'month' },
  { label: 'Ano',    value: 'year' }
]
const periodLabel = computed(() => ({ week: 'semana', month: 'mês', year: 'ano' }[period.value]))

const loadingSales = ref(false)
const loadingStock = ref(false)

// Sales metrics
const salesCount  = ref(0)
const salesTotal  = ref(0)
const trocasCount = ref(0)
const prevTotal   = ref(0)
const recentSales = ref([])

// Stock metrics
const products = ref([])

const totalProducts  = computed(() => products.value.reduce((s, p) => s + (p.quantity || 0), 0))
const totalCategories = computed(() => new Set(products.value.filter(p => p.quantity > 0).map(p => p.category)).size)
const stockValue     = computed(() => products.value.reduce((s, p) => s + p.price * (p.quantity || 0), 0))
const lowStockCount  = computed(() => products.value.filter(p => p.quantity > 0 && p.quantity <= 2).length)

const allSalesData = ref([])

const topSellers = computed(() => {
  const map = {}
  for (const r of allSalesData.value) {
    const key = r.product_name
    if (!map[key]) map[key] = { name: r.product_name, category: r.category, qty: 0, total: 0 }
    map[key].qty   += r.quantity ?? 0
    map[key].total += r.total ?? 0
  }
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5)
})

const salesByCategory = computed(() => {
  const map = {}
  for (const r of allSalesData.value) {
    const key = r.category || 'Sem categoria'
    if (!map[key]) map[key] = { category: key, qty: 0, total: 0 }
    map[key].qty   += r.quantity ?? 0
    map[key].total += r.total ?? 0
  }
  return Object.values(map).sort((a, b) => b.total - a.total)
})

const growth = computed(() => {
  if (!prevTotal.value) return salesTotal.value > 0 ? 100 : 0
  return Math.round(((salesTotal.value - prevTotal.value) / prevTotal.value) * 100)
})
const growthColor = computed(() => growth.value > 0 ? 'positive' : growth.value < 0 ? 'negative' : 'grey-6')

function periodRange (p, offset = 0) {
  const now = new Date()
  let from, to
  if (p === 'week') {
    const day = now.getDay()
    from = new Date(now); from.setDate(now.getDate() - day - offset * 7); from.setHours(0,0,0,0)
    to   = new Date(from); to.setDate(from.getDate() + 6); to.setHours(23,59,59,999)
  } else if (p === 'month') {
    from = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    to   = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0, 23, 59, 59, 999)
  } else {
    from = new Date(now.getFullYear() - offset, 0, 1)
    to   = new Date(now.getFullYear() - offset, 11, 31, 23, 59, 59, 999)
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

function clearDates () {
  dateFrom.value = ''
  dateTo.value = ''
  load()
}

async function load () {
  loadingSales.value = true
  try {
    const usingCustomDate = dateFrom.value || dateTo.value
    const cur = usingCustomDate
      ? { from: dateFrom.value ? dateFrom.value + 'T00:00:00' : '2000-01-01T00:00:00', to: dateTo.value ? dateTo.value + 'T23:59:59' : new Date().toISOString() }
      : periodRange(period.value, 0)
    const prev = usingCustomDate ? null : periodRange(period.value, 1)

    const promises = [
      supabase.from('transactions').select('id, product_name, category, quantity, total, created_at')
        .eq('type', 'venda').gte('created_at', cur.from).lte('created_at', cur.to)
        .order('created_at', { ascending: false }),
      prev
        ? supabase.from('transactions').select('total').eq('type', 'venda').gte('created_at', prev.from).lte('created_at', prev.to)
        : Promise.resolve({ data: [] }),
      supabase.from('transactions').select('id', { count: 'exact', head: true })
        .eq('type', 'troca').gte('created_at', cur.from).lte('created_at', cur.to)
    ]

    const [curRes, prevRes, trocaRes] = await Promise.all(promises)

    const curData  = curRes.data  ?? []
    const prevData = prevRes.data ?? []

    salesCount.value   = curData.length
    salesTotal.value   = curData.reduce((s, r) => s + (r.total ?? 0), 0)
    prevTotal.value    = prevData.reduce((s, r) => s + (r.total ?? 0), 0)
    trocasCount.value  = trocaRes.count ?? 0
    recentSales.value  = curData.slice(0, 10)
    allSalesData.value = curData
  } finally {
    loadingSales.value = false
  }
}

async function loadStock () {
  loadingStock.value = true
  const { data } = await supabase.from('products').select('category, price, quantity')
  products.value = data ?? []
  loadingStock.value = false
}

function formatPrice (v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)
}
function formatDate (v) {
  if (!v) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(v))
}

onMounted(() => Promise.all([load(), loadStock()]))
</script>

<style scoped>
.stat-card { transition: transform 0.15s; }
.stat-card:hover { transform: translateY(-2px); }
</style>
