import { ref } from 'vue'
import { useQuasar } from 'quasar'
import * as stockService from 'src/services/stockService'
import { useAuth } from 'src/composables/useAuth'

export { CATEGORIES } from 'src/services/stockService'

export function useStock () {
  const $q = useQuasar()
  const { currentUser } = useAuth()
  const products = ref([])
  const loading = ref(false)

  function userMeta () {
    return {
      user_id: currentUser.value?.id ?? null,
      user_name: currentUser.value?.name ?? null
    }
  }

  async function fetchProducts (category = null) {
    loading.value = true
    try {
      products.value = await stockService.getProductsByCategory(category)
    } catch {
      $q.notify({ type: 'negative', message: 'Erro ao carregar produtos.' })
    } finally {
      loading.value = false
    }
  }

  async function bulkAdd (items) {
    loading.value = true
    try {
      await stockService.bulkCreateProducts(items)
      $q.notify({ type: 'positive', message: `${items.length} item(s) adicionado(s) ao estoque!` })
      await fetchProducts()
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Erro ao adicionar itens.' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function finalizarVenda (cartItems) {
    loading.value = true
    try {
      for (const item of cartItems) {
        await stockService.adjustStock(item.id, -item.cartQty)
        await stockService.registerTransaction({
          type: 'venda',
          product_id: item.id,
          product_name: item.name,
          category: item.category,
          quantity: item.cartQty,
          unit_price: item.price,
          total: item.price * item.cartQty,
          ...userMeta()
        })
      }
      $q.notify({ type: 'positive', message: 'Venda finalizada com sucesso!' })
    } catch (e) {
      $q.notify({ type: 'negative', message: e.message || 'Erro ao finalizar venda.' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function registrarMovimento (type, productId, productName, category, quantity, unitPrice, notes = '') {
    const delta = (type === 'entrada') ? quantity : -quantity
    loading.value = true
    try {
      await stockService.adjustStock(productId, delta)
      await stockService.registerTransaction({
        type, product_id: productId, product_name: productName,
        category, quantity, unit_price: unitPrice,
        total: unitPrice * quantity, notes,
        ...userMeta()
      })
      $q.notify({ type: 'positive', message: 'Movimento registrado!' })
    } catch (e) {
      $q.notify({ type: 'negative', message: e.message || 'Erro ao registrar movimento.' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateProduct (id, data) {
    loading.value = true
    try {
      await stockService.updateProductById(id, data)
      $q.notify({ type: 'positive', message: 'Produto atualizado!' })
      await fetchProducts()
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Erro ao atualizar produto.' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct (id) {
    loading.value = true
    try {
      await stockService.deleteProductById(id)
      $q.notify({ type: 'positive', message: 'Produto excluído!' })
      await fetchProducts()
    } catch (e) {
      $q.notify({ type: 'negative', message: 'Erro ao excluir produto.' })
      throw e
    } finally {
      loading.value = false
    }
  }

  return { products, loading, fetchProducts, bulkAdd, finalizarVenda, registrarMovimento, updateProduct, deleteProduct }
}
