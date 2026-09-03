import { onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import mediumZoom from 'medium-zoom'
import SmartThingsToken from '../components/SmartThingsToken.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SmartThingsToken', SmartThingsToken)
  },
  setup() {
    const route = useRoute()
    let zoom

    const initZoom = () => {
      zoom?.detach()
      zoom = mediumZoom('.main img', {
        margin: 30,
        background: 'var(--vp-c-bg)'
      })
    }

    onMounted(() => {
      initZoom()
    })

    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  }
}
