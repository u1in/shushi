import { createApp } from 'vue'
import App from './App.vue'
import './styles/tailwind.css'

// web 包只承载首页演示，不再维护独立文档路由或命名图谱页面。
createApp(App).mount('#app')
