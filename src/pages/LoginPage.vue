<template>
  <div class="fixed-full flex flex-center bg-grey-2">
    <q-card flat bordered style="width: 360px">
      <q-card-section class="text-center q-pt-xl q-pb-md">
        <q-icon name="store" size="3rem" color="primary" />
        <div class="text-h5 text-weight-bold text-primary q-mt-sm">Stilo Top</div>
        <div class="text-caption text-grey-6">Faça login para continuar</div>
      </q-card-section>

      <q-card-section class="q-px-lg q-pb-lg">
        <q-form @submit.prevent="handleLogin">
          <q-input
            v-model="email"
            label="E-mail"
            type="email"
            outlined dense class="q-mb-md"
            autofocus
            :rules="[v => !!v || 'Obrigatório']"
          />
          <q-input
            v-model="password"
            label="Senha"
            :type="showPwd ? 'text' : 'password'"
            outlined dense class="q-mb-md"
            :rules="[v => !!v || 'Obrigatório']"
          >
            <template #append>
              <q-icon
                :name="showPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPwd = !showPwd"
              />
            </template>
          </q-input>

          <div v-if="errorMsg" class="text-negative text-caption q-mb-md">{{ errorMsg }}</div>

          <q-btn
            type="submit"
            label="Entrar"
            color="primary"
            class="full-width"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from 'src/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const showPwd = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin () {
  errorMsg.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
