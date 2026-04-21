<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg">
      <q-icon name="dashboard" class="q-mr-sm" />
      Dashboard
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="inventory_2" size="2rem" color="primary" />
          <div class="text-h4 text-weight-bold text-primary">{{ stats.totalProducts }}</div>
          <div class="text-caption text-grey-7">Produtos</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="attach_money" size="2rem" color="positive" />
          <div class="text-h5 text-weight-bold text-positive">R$ {{ stats.totalValue }}</div>
          <div class="text-caption text-grey-7">Valor Total</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="category" size="2rem" color="orange" />
          <div class="text-h4 text-weight-bold text-orange">{{ stats.categories }}</div>
          <div class="text-caption text-grey-7">Categorias</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md stat-card">
          <q-icon name="trending_up" size="2rem" color="teal" />
          <div class="text-h4 text-weight-bold text-teal">{{ stats.growth }}%</div>
          <div class="text-caption text-grey-7">Crescimento</div>
        </q-card>
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-weight-medium">Produtos Cadastrados</div>
      </q-card-section>

      <q-card-section v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="3rem" />
        <div class="text-grey-6 q-mt-sm">Carregando...</div>
      </q-card-section>

      <q-list v-else separator>
        <q-item v-for="product in products" :key="product.id">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              {{ product.name.charAt(0).toUpperCase() }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ product.name }}</q-item-label>
            <q-item-label caption>{{ product.description || 'Sem descrição' }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge color="positive" class="text-subtitle2">
              R$ {{ formatPrice(product.price) }}
            </q-badge>
          </q-item-section>
        </q-item>

        <q-item v-if="!products.length">
          <q-item-section class="text-center text-grey-6 q-py-xl">
            <q-icon name="inventory_2" size="3rem" color="grey-4" class="q-mb-sm" />
            <div>Nenhum produto cadastrado ainda.</div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProducts } from 'src/composables/useProducts'

const { products, loading, fetchProducts } = useProducts()

const stats = computed(() => ({
  totalProducts: products.value.length,
  totalValue: products.value.reduce((sum, p) => sum + Number(p.price || 0), 0).toFixed(2),
  categories: 1,
  growth: 0
}))

function formatPrice (price) {
  return Number(price).toFixed(2)
}

onMounted(() => {
  fetchProducts()
})
</script>
