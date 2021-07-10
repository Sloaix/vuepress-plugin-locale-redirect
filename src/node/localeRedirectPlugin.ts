import type { Plugin } from '@vuepress/core'
import { path } from '@vuepress/utils'

export const localeRedirectPlugin: Plugin = (_, app) => {
    return {
        name: 'vuepress-plugin-locale-redirect',
        clientAppEnhanceFiles: path.resolve(__dirname, '../client/clientAppEnhance.js'),
    }
}
