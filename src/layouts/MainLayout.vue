<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round dense icon="menu" aria-label="Menu" @click="toggleDrawer" />
        <q-toolbar-title class="text-weight-bold">
          <q-icon name="store" size="sm" class="q-mr-xs" />
          Store Core
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      :breakpoint="600"
      bordered
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <div class="q-pa-md q-pb-sm">
          <div class="text-h6 text-primary text-weight-bold">
            <q-icon name="store" class="q-mr-xs" />
            Store Core
          </div>
          <div class="text-caption text-grey-6">Sistema ERP para lojas</div>
        </div>

        <q-separator />

        <q-list padding class="q-mt-xs">
          <q-item
            v-for="link in menuLinks"
            :key="link.to"
            :to="link.to"
            exact
            clickable
            v-ripple
            active-class="text-primary bg-blue-1"
            class="rounded-borders q-mx-sm q-mb-xs"
          >
            <q-item-section avatar>
              <q-icon :name="link.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ link.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const drawerOpen = ref(!$q.platform.is.mobile)

function toggleDrawer () {
  drawerOpen.value = !drawerOpen.value
}

const menuLinks = [
  { label: 'Home', icon: 'home', to: '/' },
  { label: 'Dashboard', icon: 'dashboard', to: '/dashboard' },
  { label: 'Produtos', icon: 'inventory_2', to: '/products' }
]
</script>
