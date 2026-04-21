import { ref } from 'vue'
import { useQuasar } from 'quasar'
import * as productService from 'src/services/productService'

export function useProducts () {
  const $q = useQuasar()
  const products = ref([])
  const loading = ref(false)

  async function fetchProducts () {
    loading.value = true
    try {
      products.value = await productService.getProducts()
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Erro ao carregar produtos.' })
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  async function createProduct (data) {
    try {
      await productService.createProduct(data)
      $q.notify({ type: 'positive', message: 'Produto criado com sucesso!' })
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Erro ao criar produto.' })
      console.error(error)
      throw error
    }
  }

  async function updateProduct (id, data) {
    try {
      await productService.updateProduct(id, data)
      $q.notify({ type: 'positive', message: 'Produto atualizado com sucesso!' })
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Erro ao atualizar produto.' })
      console.error(error)
      throw error
    }
  }

  async function deleteProduct (id) {
    try {
      await productService.deleteProduct(id)
      $q.notify({ type: 'positive', message: 'Produto excluído com sucesso!' })
    } catch (error) {
      $q.notify({ type: 'negative', message: 'Erro ao excluir produto.' })
      console.error(error)
      throw error
    }
  }

  return { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct }
}
