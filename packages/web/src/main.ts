import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import DivisionNamingMapPage from './pages/DivisionNamingMapPage.vue'
import MultiplicationNamingMapPage from './pages/MultiplicationNamingMapPage.vue'
import AdditionNamingMapPage from './pages/AdditionNamingMapPage.vue'
import SubtractionNamingMapPage from './pages/SubtractionNamingMapPage.vue'
import ShortDivisionNamingMapPage from './pages/ShortDivisionNamingMapPage.vue'
import { MacroApiDocsPage, MacroDocPage, MacroLanguageDocsPage, macroDocPages } from '@vertical-arithmetic/macro-docs'
import './styles/tailwind.css'
import './styles/naming-map.css'

/** 两个入口使用独立页面，页面清单、侧边栏和翻页互不共享。 */
const isTechnicalGroup = (group: string): boolean => group === 'technical' || group === 'api'
const macroDocRoutes = macroDocPages
  .filter(({ slug, group }) => !isTechnicalGroup(group) && slug !== 'intro')
  .map(({ slug }) => ({ path: slug, component: MacroDocPage, props: { slug } }))
const technicalDocRoutes = macroDocPages
  .filter(({ slug, group }) => isTechnicalGroup(group) && slug !== 'install')
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
      component: MacroLanguageDocsPage,
      children: [
        { path: '', component: MacroDocPage, props: { slug: 'intro' } },
        ...macroDocRoutes,
      ],
    },
    {
      path: '/macro-api',
      component: MacroApiDocsPage,
      children: [
        { path: '', component: MacroDocPage, props: { slug: 'install' } },
        ...technicalDocRoutes,
      ],
    },
    { path: '/macro-rules/quickstart', redirect: '/macro-api/quickstart' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

createApp(App).use(router).mount('#app')
