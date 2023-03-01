const path = require('path');

module.exports = {
    title: 'Homebridge Samsung Tizen',
    description: '',

    port: 8181,
    base: '/homebridge-samsung-tizen/',

    head: [
        ['meta', { name: 'theme-color', content: '#3eaf7c' }],
        ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
        ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
    ],

    configureWebpack: {
        resolve: {
            alias: {
                '@images': path.resolve(__dirname, 'images')
            }
        }
    },

    themeConfig: {
        repo: 'tavicu/homebridge-samsung-tizen',
        docsDir: 'docs',
        searchPlaceholder: 'Search ...',
        nav: [
            {
                text: 'Donate',
                items: [
                    { text: 'PayPal', link: 'https://www.paypal.com/donate?hosted_button_id=5QLCDRNH77Z9L' },
                    { text: 'Buy Me a Coffee', link: 'https://www.buymeacoffee.com/tavicu' }
                ]
              }
        ],
        sidebar: [
            {
                title: 'Introduction',
                path: '/',
                collapsable: false
            },
            {
                title: 'Installation',
                path: '/installation/',
                collapsable: false,
                children: [
                    '/installation/',
                    '/installation/plugin-installation',
                    '/installation/setting-the-device',
                    '/installation/pairing-the-device',
                    '/installation/adding-to-home-app',
                ]
            },
            {
                title: 'Configuration',
                path: '/configuration/',
                collapsable: false,
                children: [
                    '/configuration/',
                    '/configuration/options',
                    '/configuration/smartthings-api',
                ]
            },
            {
                title: 'Features',
                collapsable: false,
                children: [
                    '/features/inputs',
                    '/features/switches',
                    '/features/keys',
                ]
            },
            {
                title: 'Troubleshooting',
                collapsable: false,
                children: [
                    '/troubleshooting/common-issues',
                    '/troubleshooting/open-new-issue',
                ]
            },
            {
                title: 'Extra',
                collapsable: false,
                children: [
                    '/extra/applications',
                    '/extra/commands',
                    '/extra/install-beta',
                ]
            },
            {
                title: 'Config',
                path: '/config/',
                collapsable: false
            }
        ]
    },

    plugins: {
        'vuepress-plugin-medium-zoom': {
            options: {
                margin: 30,
                background: 'rgba(255,255,255,0.95)'
            }
        },
        'vuepress-plugin-smooth-scroll': {}
    }
}
