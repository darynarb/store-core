<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-lg">
      <q-icon name="inventory_2" class="q-mr-sm" />
      Produtos
    </div>

    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="4rem" />
      <div class="text-grey-6 q-mt-md">Carregando produtos...</div>
    </div>

    <template v-else>
      <div v-if="!products.length" class="text-center q-pa-xl">
        <q-icon name="inventory_2" size="5rem" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Nenhum produto cadastrado</div>
        <div class="text-grey-5 q-mb-lg">Clique no botão + para adicionar o primeiro produto</div>
        <q-btn color="primary" icon="add" label="Novo Produto" @click="openCreateDialog" />
      </div>

      <div v-else class="row q-col-gutter-md">
        <div
          v-for="product in products"
          :key="product.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <ProductCard
            :product="product"
            @edit="openEditDialog"
            @delete="confirmDelete"
          />
        </div>
      </div>
    </template>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="openCreateDialog" />
    </q-page-sticky>

    <q-dialog v-model="dialogOpen" persistent>
      <ProductForm
        :product="selectedProduct"
        @save="handleSave"
        @cancel="dialogOpen = false"
      />
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useProducts } from 'src/composables/useProducts'
import ProductCard from 'src/components/ProductCard.vue'
import ProductForm from 'src/components/ProductForm.vue'

const $q = useQuasar()
const { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct } = useProducts()

const dialogOpen = ref(false)
const selectedProduct = ref(null)

function openCreateDialog () {
  selectedProduct.value = null
  dialogOpen.value = true
}

function openEditDialog (product) {
  selectedProduct.value = { ...product }
  dialogOpen.value = true
}

async function handleSave (productData) {
  if (selectedProduct.value?.id) {
    await updateProduct(selectedProduct.value.id, productData)
  } else {
    await createProduct(productData)
  }
  dialogOpen.value = false
  await fetchProducts()
}

function confirmDelete (product) {
  $q.dialog({
    title: 'Confirmar exclusão',
    message: `Deseja excluir o produto "${product.name}"?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative' },
    persistent: true
  }).onOk(async () => {
    await deleteProduct(product.id)
    await fetchProducts()
  })
}

onMounted(() => {
  fetchProducts()
})
</script>
