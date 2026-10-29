import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import DivisionNamingMapPage from './pages/DivisionNamingMapPage.vue'
import MultiplicationNamingMapPage from './pages/MultiplicationNamingMapPage.vue'
import AdditionNamingMapPage from './pages/AdditionNamingMapPage.vue'
import SubtractionNamingMapPage from './pages/SubtractionNamingMapPage.vue'
import ShortDivisionNamingMapPage from './pages/ShortDivisionNamingMapPage.vue'
import './styles/tailwind.css'
import './styles/naming-map.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/division-elements', component: DivisionNamingMapPage },
    { path: '/multiplication-elements', component: MultiplicationNamingMapPage },
    { path: '/addition-elements', component: AdditionNamingMapPage },
    { path: '/subtraction-elements', component: SubtractionNamingMapPage },
    { path: '/short-division-elements', component: ShortDivisionNamingMapPage },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
