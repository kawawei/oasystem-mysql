import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import { setupPermissionGuard } from './router/permission'
import App from './App.vue'
import './styles/main.scss'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(router)
app.use(ElementPlus)
app.use(pinia)

// 設置權限守衛
setupPermissionGuard(router)

app.mount('#app') 