import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuth } from 'src/composables/useAuth'

export default route(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory()
  })

  Router.beforeEach((to) => {
    const { isAuthenticated, role, restoreSession } = useAuth()

    // Restore session from localStorage on first navigation
    if (!isAuthenticated.value) restoreSession()

    if (to.path === '/login') {
      return isAuthenticated.value ? '/' : true
    }

    if (to.meta?.requiresAuth && !isAuthenticated.value) {
      return '/login'
    }

    const allowedRoles = to.meta?.roles
    if (allowedRoles && !allowedRoles.includes(role.value)) {
      return '/'
    }

    return true
  })

  return Router
})
