import { createApp } from 'vue'
import App from './App.vue'
// 首页演示一次性载入全部内置字体，让下拉选择能立即生效。
// 右侧代码示例仍按用户所选字体生成最小化的生产依赖组合。
import '@u1in/shushi-fonts/fonts.css'
import './styles/tailwind.css'

// web 包只承载首页演示，不再维护独立文档路由或命名图谱页面。
createApp(App).mount('#app')
