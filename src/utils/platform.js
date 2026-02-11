import { Capacitor } from '@capacitor/core'

/**
 * 是否运行在原生平台（Android/iOS）
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform()
}

/**
 * 获取当前平台：'android' | 'ios' | 'web'
 */
export const getPlatform = () => {
  return Capacitor.getPlatform()
}

/**
 * 是否运行在 Android 上
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android'
}

/**
 * 是否运行在 Web 上
 */
export const isWeb = () => {
  return Capacitor.getPlatform() === 'web'
}
