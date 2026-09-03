import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Homebridge Samsung Tizen',
  description: 'Documentation for homebridge-samsung-tizen plugin',

  base: '/homebridge-samsung-tizen/',

  head: [
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  themeConfig: {
    nav: [
      {
        text: 'Donate',
        items: [
          { text: 'GitHub Sponsors', link: 'https://github.com/sponsors/tavicu' },
          { text: 'Buy Me a Coffee', link: 'https://www.buymeacoffee.com/tavicu' },
          { text: 'PayPal', link: 'https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tavicu/homebridge-samsung-tizen' }
    ],

    search: {
      provider: 'local'
    },

    sidebar: [
      {
        text: 'Introduction',
        link: '/'
      },
      {
        text: 'Installation',
        collapsed: false,
        items: [
          { text: 'Getting started', link: '/installation/' },
          { text: 'Plugin installation', link: '/installation/plugin-installation' },
          { text: 'Setting the device', link: '/installation/setting-the-device' },
          { text: 'Pairing the device', link: '/installation/pairing-the-device' },
          { text: 'Adding to Home app', link: '/installation/adding-to-home-app' }
        ]
      },
      {
        text: 'Configuration',
        collapsed: false,
        items: [
          { text: 'Examples', link: '/configuration/' },
          { text: 'Device settings', link: '/configuration/device-settings' },
          { text: 'Frame TVs', link: '/configuration/frame-tvs' },
          { text: 'SmartThings API', link: '/configuration/smartthings-api' }
        ]
      },
      {
        text: 'Features',
        collapsed: false,
        items: [
          { text: 'Inputs', link: '/features/inputs' },
          { text: 'Switches', link: '/features/switches' },
          { text: 'Keys', link: '/features/keys' }
        ]
      },
      {
        text: 'Troubleshooting',
        collapsed: false,
        items: [
          { text: 'Common issues', link: '/troubleshooting/common-issues' },
          { text: 'How to open new issue', link: '/troubleshooting/open-new-issue' }
        ]
      },
      {
        text: 'Extra',
        collapsed: false,
        items: [
          { text: 'Applications', link: '/extra/applications' },
          { text: 'Commands', link: '/extra/commands' },
          { text: 'Installing beta version', link: '/extra/install-beta' }
        ]
      }
    ]
  }
})
