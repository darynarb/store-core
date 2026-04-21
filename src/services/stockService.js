import { supabase } from 'src/boot/supabase'

export const CATEGORIES = [
  'Camisetas', 'Shorts', 'Calças', 'Conjuntos', 'Roupas de Baixo',
  'Chapéus', 'Cintos', 'Acessórios', 'Celular', 'Carteiras', 'Relógios'
]

export async function getAllProducts () {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getProductsByCategory (category) {
  let query = supabase.from('products').select('*').order('name')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function bulkCreateProducts (items) {
  const { data, error } = await supabase
    .from('products')
    .insert(items)
    .select()
  if (error) throw error
  return data
}

export async function adjustStock (id, delta) {
  const { data: product, error: fetchErr } = await supabase
    .from('products').select('quantity').eq('id', id).single()
  if (fetchErr) throw fetchErr
  const newQty = product.quantity + delta
  if (newQty < 0) throw new Error('Estoque insuficiente')
  const { data, error } = await supabase
    .from('products')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function registerTransaction (tx) {
  const { data, error } = await supabase
    .from('transactions').insert([tx]).select().single()
  if (error) throw error
  return data
}

export async function updateProductById (id, data) {
  const { data: result, error } = await supabase
    .from('products')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id).select().single()
  if (error) throw error
  return result
}

export async function deleteProductById (id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function getTransactions (limit = 50) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}