import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'wanglai',
    logger: {
      quiet: process.env.NODE_ENV === 'production',
      stats: true
    },
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    // 分平台输出，避免 weapp/h5/alipay/tt 互相覆盖
    outputRoot: `dist/${process.env.TARO_ENV || 'weapp'}`,
    plugins: [],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: 'webpack5',
    cache: { enable: false },
    mini: {
      postcss: {
        // NutUI 的 CSS 以逻辑 px 书写，按【文件】排除，不能按选择器（会误伤自己的 .nut-button 规则）
        pxtransform: {
          enable: true,
          config: {
            exclude: (filePath: string) => /node_modules[\\/]@nutui[\\/]/.test(filePath)
          }
        },
        cssModules: { enable: false }
      }
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js'
      },
      postcss: {
        autoprefixer: { enable: true, config: {} },
        // 同上：NutUI 的 px 不参与换算，保证 H5 与小程序尺寸一致
        pxtransform: {
          enable: true,
          config: {
            exclude: (filePath: string) => /node_modules[\\/]@nutui[\\/]/.test(filePath)
          }
        },
        cssModules: { enable: false }
      }
    }
  }
  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})
