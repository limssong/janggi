// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // GitHub Pages 배포를 위한 설정
  ssr: false, // SPA 모드로 변경 (GitHub Pages는 SPA만 지원)
  
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
  },
  
  // 정적 사이트 생성 설정
  app: {
    baseURL: '/janggi/', // repository name을 포함한 base URL
    buildAssetsDir: '/janggi/_nuxt/' // 빌드된 에셋 경로
  }
})
