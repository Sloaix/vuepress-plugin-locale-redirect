import { defineClientAppEnhance } from '@vuepress/client'
import { SiteDataRef } from '@vuepress/client';

/**
 * 当前运行环境检测
 * @returns ture,if is node.js environment
 */
function isNodeEnv(): boolean {
    return !(typeof window != 'undefined' && window.document);
}

// 用户浏览器的首选语言
let USER_LANGUAGE = function (): string {
    if (isNodeEnv()) {
        return "empty language"
    }
    else {
        return navigator.language
    }
}()

/**
 * 从SiteDataRef中解析出vuepress支持的语言
 * @param siteData SiteDataRef
 * @returns string[] 支持的语言类型字符串数组
 */
function obtainSupportLanguages(siteData: SiteDataRef): Map<string, string> {
    // 存储不同语言以及对应的导航路径
    let languageRouteMap: Map<string, string> = new Map()
    for (const routePath in siteData.value.locales) {
        if (Object.prototype.hasOwnProperty.call(siteData.value.locales, routePath)) {
            const element = siteData.value.locales[routePath];
            if (element.lang) {
                languageRouteMap.set(routePath, element.lang)
            }
        }
    }
    return languageRouteMap
}

/**
 * 根据用户的语言匹配出一个重定向的路径
 * @param userLanguage 用户首选语言
 * @param languageRouteMap 
 * @returns 匹配用户语言的重定向路径
 */
function getRedirectUrlFromUserLanguage(userLanguage: string, languageRouteMap: Map<string, string>) {
    var path: string | null = null

    languageRouteMap.forEach((language, routePath) => {
        if (isSameLanguage(userLanguage, language)) {
            path = routePath
            console.log(`matched language is ${language}, route path is ${routePath}`)
        }
    })

    return path
}

/**
 * 目标语言和被比较的语言是否是同一种语言
 * @param target 
 * @param compared 
 */
function isSameLanguage(target: string, compared: string): boolean {
    // 先进行精准匹配,类似 zh-CN 和 zh_CN的情况
    // check is exact match
    var isSame = target === compared

    // 匹配成功直接返回
    if (isSame) {
        return true
    }

    // 进行模糊匹配
    // 对中文进行特殊处理
    if (target.includes('zh')) {
        // special handle for chinese
        let bothHans = isHans(target) && isHans(compared)
        let bothHant = isHant(target) && isHant(compared)
        isSame = bothHans || bothHant
    }
    else {
        // 进行模糊匹配,例如en-US和en-gb,只比较前缀en
        // try partial match
        let targetPrefix = getLanguagePrefix(target)
        let comparedPrefix = getLanguagePrefix(compared)
        isSame = targetPrefix === comparedPrefix
    }

    return isSame
}

/**
 * 简体检测
 * @param language 
 * @returns true, if is hans
 */
function isHans(language: string): boolean {
    let result = [
        'zh-CN',
        'zh-SG',
        'zh-CHT'
    ].includes(language) || language.includes('Hans')

    return result
}


/**
 * 繁体检测
 * @param language 
 * @returns true, if is hant
 */
function isHant(language: string): boolean {
    let result = [
        'zh-HK',
        'zh-MO',
        'zh-TW',
        'zh-CHT'
    ].includes(language) || language.includes('Hant')

    return result
}

/**
 * 获取语言前缀
 * @param language 
 * @returns zh if language is zh-CN, en if language is en-US
 */
function getLanguagePrefix(language: string) {
    return language.split('-')[0]
}

export default defineClientAppEnhance(({ app, router, siteData }) => {
    // vuepress支持的所有语言
    let supportLanguages = obtainSupportLanguages(siteData)

    if (supportLanguages.size == 0) {
        // 不支持多语言，直接返回
        return
    }

    router.beforeEach((to, from) => {
        // 第一次打开vuepress
        let isFirstStart = to.fullPath == from.fullPath
        console.log(`isFirstBoot ${isFirstStart}`);

        // 即将显示的是否是主页
        let isHome = to.fullPath == "/"
        console.log(`isHome ${isHome}`);

        if (isFirstStart && isHome) {
            let redirectUrl = getRedirectUrlFromUserLanguage(USER_LANGUAGE, supportLanguages)

            // 为了避免无限的重定向,这里要检测redirectUrl和即将导航到的页面的url是否一致
            // to avoid loop redirect, check redirectUrl is same as "to" first.
            if (redirectUrl && to.fullPath != redirectUrl) {
                console.log(`current language ${USER_LANGUAGE}, try to redirectUrl is ${redirectUrl}`);
                return redirectUrl
            }
            else {
                console.log(`current language ${USER_LANGUAGE}, is matched default language, do nothing.`);
            }
        }
    })
})