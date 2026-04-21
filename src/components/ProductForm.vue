<template>
  <q-card style="min-width: 320px; max-width: 500px; width: 90vw">
    <q-card-section class="bg-primary text-white">
      <div class="text-h6">
        <q-icon :name="isEditing ? 'edit' : 'add'" class="q-mr-sm" />
        {{ isEditing ? 'Editar Produto' : 'Novo Produto' }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-lg">
      <q-form ref="formRef" @submit.prevent="handleSubmit">
        <q-input
          v-model="form.name"
          label="Nome do Produto *"
          outlined
          :rules="[val => !!val || 'Nome é obrigatório']"
          class="q-mb-md"
        />

        <q-input
          v-model="form.description"
          label="Descrição"
          outlined
          type="textarea"
          rows="3"
          class="q-mb-md"
        />

        <q-input
          v-model.number="form.price"
          label="Preço (R$) *"
          outlined
          type="number"
          step="0.01"
          min="0"
          :rules="[
            val => !!val || 'Preço é obrigatório',
            val => val > 0 || 'Preço deve ser maior que zero'
          ]"
          class="q-mb-lg"
        />

        <div class="row q-gutter-sm justify-end">
          <q-btn flat label="Cancelar" color="grey-7" @click="$emit('cancel')" />
          <q-btn type="submit" label="Salvar" color="primary" :loading="saving" />
        </div>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'cancel'])

const formRef = ref(null)
const saving = ref(false)

const isEditing = computed(() => !!props.product?.id)

const form = ref({ name: '', description: '', price: '' })

watch(() => props.product, (val) => {
  form.value = val
    ? { name: val.name || '', description: val.description || '', price: val.price || '' }
    : { name: '', description: '', price: '' }
}, { immediate: true })

async function handleSubmit () {
  const valid = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    emit('save', { ...form.value })
  } finally {
    saving.value = false
  }
}
</script>
