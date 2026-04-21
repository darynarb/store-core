<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg">
      <q-icon name="home" class="q-mr-sm" />
      Home
    </div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="stat in quickStats"
        :key="stat.label"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat bordered class="stat-card">
          <q-card-section class="row items-center no-wrap q-py-md">
            <div>
              <div class="text-caption text-grey-7">{{ stat.label }}</div>
              <div class="text-h5 text-weight-bold" :class="`text-${stat.color}`">
                {{ stat.value }}
              </div>
            </div>
            <q-space />
            <q-icon :name="stat.icon" size="2.5rem" :color="stat.color" />
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="text-h6 text-weight-medium q-mb-md">Atividade Recente</div>
    <q-card flat bordered>
      <q-list separator>
        <q-item v-for="item in recentActivity" :key="item.id">
          <q-item-section avatar>
            <q-avatar :color="item.color" text-color="white" :icon="item.icon" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
            <q-item-label caption>{{ item.time }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useProducts } from 'src/composables/useProducts'

const { products, fetchProducts } = useProducts()

const quickStats = ref([
  { label: 'Total de Produtos', value: '0', icon: 'inventory_2', color: 'primary' },
  { label: 'Categorias', value: '1', icon: 'category', color: 'teal' },
  { label: 'Pedidos Hoje', value: '0', icon: 'shopping_cart', color: 'orange' }
])

const recentActivity = ref([
  { id: 1, title: 'Sistema iniciado com sucesso', time: 'Agora mesmo', icon: 'check_circle', color: 'positive' },
  { id: 2, title: 'Banco de dados conectado', time: 'Agora mesmo', icon: 'storage', color: 'primary' }
])

onMounted(async () => {
  await fetchProducts()
  quickStats.value[0].value = String(products.value.length)
})
</script>
