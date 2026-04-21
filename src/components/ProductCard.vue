<template>
  <q-card flat bordered class="product-card">
    <q-card-section>
      <div class="row items-center no-wrap">
        <q-avatar color="primary" text-color="white" class="q-mr-md" size="42px">
          {{ product.name.charAt(0).toUpperCase() }}
        </q-avatar>
        <div class="ellipsis col">
          <div class="text-weight-bold ellipsis">{{ product.name }}</div>
          <div class="text-caption text-grey-7 ellipsis">
            {{ product.description || 'Sem descrição' }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-actions class="row items-center q-px-md">
      <div class="text-h6 text-positive text-weight-bold">
        R$ {{ formatPrice(product.price) }}
      </div>
      <q-space />
      <q-btn flat round icon="edit" color="primary" size="sm" @click="$emit('edit', product)" />
      <q-btn flat round icon="delete" color="negative" size="sm" @click="$emit('delete', product)" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
defineProps({
  product: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

function formatPrice (price) {
  return Number(price).toFixed(2)
}
</script>
