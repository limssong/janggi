// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // CSS 설정
  css: [
    'bootstrap/dist/css/bootstrap.min.css'
  ],
  
  // 모듈 설정
  modules: [],
  
  // 페이지 자동 생성 설정
  pages: true,
  
  // 라우팅 설정
  router: {
    options: {
      strict: false
    }
  },
  
  // 빌드 설정
  nitro: {
    prerender: {
      routes: ['/']
    }
  }
})
