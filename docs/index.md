---
layout: home
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

onMounted(() => {
  const router = useRouter()

  // 优先级：URL 参数 > localStorage > 浏览器语言 > 默认中文
  // 与 Landing Page (src/lib/i18n.ts) 保持一致
  const stored = localStorage.getItem('preferred-lang')
  const params = new URLSearchParams(window.location.search)
  const urlLang = params.get('lang')
  const browserLang = navigator.language || navigator.userLanguage || ''

  let targetLang = 'zh' // 默认中文

  // 1. URL 参数（最高优先级）
  if (urlLang === 'zh') {
    targetLang = 'zh'
  } else if (urlLang === 'en') {
    targetLang = 'en'
  }
  // 2. localStorage（用户偏好）
  else if (stored === 'zh-CN' || stored === 'zh') {
    targetLang = 'zh'
  } else if (stored === 'en') {
    targetLang = 'en'
  }
  // 3. 浏览器语言
  else if (browserLang.startsWith('zh')) {
    targetLang = 'zh'
  } else if (/^en/i.test(browserLang)) {
    targetLang = 'en'
  }
  // 4. 默认中文（已设置）

  router.go(`/${targetLang}/`)
})
</script>

# Loading...

Detecting your language preference...
