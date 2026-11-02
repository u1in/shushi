import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import DivisionNamingMapPage from './pages/DivisionNamingMapPage.vue'
import MultiplicationNamingMapPage from './pages/MultiplicationNamingMapPage.vue'
import AdditionNamingMapPage from './pages/AdditionNamingMapPage.vue'
import SubtractionNamingMapPage from './pages/SubtractionNamingMapPage.vue'
import ShortDivisionNamingMapPage from './pages/ShortDivisionNamingMapPage.vue'
import { MacroDocPage, MacroDocsLayout, macroDocPages } from '@vertical-arithmetic/macro-docs'
import './styles/tailwind.css'
import './styles/naming-map.css'

/** 文档静态页由 macro-docs 包的内容清单生成，新增页面只需在包内登记。 */
const macroDocRoutes = macroDocPages
  .filter(({ slug }) => slug !== 'intro')
  .map(({ slug }) => ({ path: slug, component: MacroDocPage, props: { slug } }))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/division-elements', component: DivisionNamingMapPage },
    { path: '/multiplication-elements', component: MultiplicationNamingMapPage },
    { path: '/addition-elements', component: AdditionNamingMapPage },
    { path: '/subtraction-elements', component: SubtractionNamingMapPage },
    { path: '/short-division-elements', component: ShortDivisionNamingMapPage },
    {
      path: '/macro-rules',
      component: MacroDocsLayout,
      children: [
        { path: '', component: MacroDocPage, props: { slug: 'intro' } },
        ...macroDocRoutes,
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
