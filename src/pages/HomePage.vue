<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-xs">
      <q-icon name="point_of_sale" class="q-mr-sm" />
      Caixa
    </div>
    <div class="text-caption text-grey-6 q-mb-xl">Selecione o tipo de operação</div>

    <div class="row q-col-gutter-lg justify-center">
      <div
        v-for="op in visibleOperations"
        :key="op.type"
        class="col-12 col-sm-6 col-md-5"
      >
        <q-card
          clickable v-ripple flat bordered
          class="operation-card cursor-pointer"
          :style="`border: 2px solid ${op.borderColor}`"
          @click="router.push(op.route)"
        >
          <q-card-section class="column items-center q-py-xl">
            <q-icon :name="op.icon" :color="op.color" size="4rem" class="q-mb-md" />
            <div class="text-h5 text-weight-bold" :class="`text-${op.color}`">{{ op.label }}</div>
            <div class="text-caption text-grey-6 q-mt-xs text-center">{{ op.description }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from 'src/composables/useAuth'

const router = useRouter()
const { role } = useAuth()

const allOperations = [
  {
    type: 'venda',
    label: 'Venda',
    description: 'Registrar venda e baixar do estoque',
    icon: 'shopping_cart',
    color: 'positive',
    borderColor: '#21ba45',
    route: '/venda',
    roles: ['root', 'owner', 'workforce']
  },
  {
    type: 'troca',
    label: 'Troca',
    description: 'Trocar produto por outro do estoque',
    icon: 'swap_horiz',
    color: 'primary',
    borderColor: '#1976d2',
    route: '/troca',
    roles: ['root', 'owner', 'workforce']
  },
  {
    type: 'entrada',
    label: 'Entrada',
    description: 'Adicionar itens ao estoque',
    icon: 'add_circle',
    color: 'teal',
    borderColor: '#26a69a',
    route: '/entrada',
    roles: ['root', 'owner']
  },
  {
    type: 'saida',
    label: 'Saída',
    description: 'Registrar saída sem venda',
    icon: 'remove_circle',
    color: 'warning',
    borderColor: '#f2c037',
    route: '/saida',
    roles: ['root', 'owner']
  }
]

const visibleOperations = computed(() =>
  allOperations.filter(op => op.roles.includes(role.value))
)
</script>

<style scoped>
.operation-card {
  transition: transform 0.15s, box-shadow 0.15s;
}
.operation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
</style>
