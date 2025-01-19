/// <reference types="vite/client" />
/// <reference types="vue/dist/vue.d.ts" />
/// <reference types="vue-router" />

declare module '*.vue' {
  import { ComponentOptions } from 'vue'
  const component: ComponentOptions
  export default component
}

declare module 'vue-router' 