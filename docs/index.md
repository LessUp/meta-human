---
layout: home
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

onMounted(() => {
  const router = useRouter()

  // 优先级：localStorage > URL 参数 > 浏览器语言
  // 与 Landing Page (src/lib/i18n.ts) 保持一致
  const stored = localStorage.getItem('preferred-lang')
  const params = new URLSearchParams(window.location.search)
  const urlLang = params.get('lang')

  let targetLang = 'en'
  if (urlLang === 'zh' || stored === 'zh-CN' || stored === 'zh') {
    targetLang = 'zh'
  } else if (urlLang === 'en' || stored === 'en') {
    targetLang = 'en'
  } else {
    const browserLang = navigator.language || navigator.userLanguage || ''
    if (browserLang.startsWith('zh')) targetLang = 'zh'
  }

  router.go(`/${targetLang}/`)
})
</script>

# Loading...

Detecting your language preference...
