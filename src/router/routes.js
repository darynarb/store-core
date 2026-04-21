const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',        component: () => import('pages/HomePage.vue') },
      { path: 'venda',   component: () => import('pages/VendaPage.vue') },
      { path: 'troca',   component: () => import('pages/TrocaPage.vue') },
      { path: 'entrada', component: () => import('pages/EntradaPage.vue'),  meta: { roles: ['root', 'owner'] } },
      { path: 'saida',   component: () => import('pages/SaidaPage.vue'),    meta: { roles: ['root', 'owner'] } },
      { path: 'estoque', component: () => import('pages/EstoquePage.vue'),  meta: { roles: ['root', 'owner'] } },
      { path: 'dashboard',  component: () => import('pages/DashboardPage.vue'), meta: { roles: ['root', 'owner'] } },
      { path: 'historico', component: () => import('pages/HistoricoPage.vue'), meta: { roles: ['root', 'owner'] } },
      { path: 'usuarios',  component: () => import('pages/UsersPage.vue'),     meta: { roles: ['root'] } }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
