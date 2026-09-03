import DefaultTheme from 'vitepress/theme'
import SmartThingsToken from '../components/SmartThingsToken.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SmartThingsToken', SmartThingsToken)
  }
}
