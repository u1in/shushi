import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import DivisionNamingMapPage from './pages/DivisionNamingMapPage.vue'
import MultiplicationNamingMapPage from './pages/MultiplicationNamingMapPage.vue'
import './styles/tailwind.css'
import './styles/naming-map.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/division-elements', component: DivisionNamingMapPage },
    { path: '/multiplication-elements', component: MultiplicationNamingMapPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
