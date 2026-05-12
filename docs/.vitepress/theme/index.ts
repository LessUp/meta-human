import DefaultTheme from 'vitepress/theme';
import { onMounted, watch } from 'vue';
import { useData } from 'vitepress';
import './style.css';

export default {
  ...DefaultTheme,
  setup() {
    const { lang } = useData();

    onMounted(() => {
      // 初始化：同步当前语言到 localStorage
      syncLangToStorage(lang.value);

      // 监听语言变化，同步到 localStorage
      watch(lang, (newLang) => {
        syncLangToStorage(newLang);
      });
    });
  },
};

/**
 * 同步 VitePress 语言到 localStorage
 * 格式：'en' | 'zh-CN'
 */
function syncLangToStorage(vpLang: string): void {
  // VitePress lang 格式：'en-US' | 'zh-CN'
  let storedLang: 'en' | 'zh-CN';
  if (vpLang === 'zh-CN' || vpLang.startsWith('zh')) {
    storedLang = 'zh-CN';
  } else {
    storedLang = 'en';
  }
  localStorage.setItem('preferred-lang', storedLang);
}
