import type { UserConfigExport } from '@tarojs/cli'

export default {
  mini: {},
  h5: {
    /**
     * WebpackChunkName for dynamic imports: keep chunks readable
     */
    webpackChain (chain) {
      chain.merge({ optimization: {} })
    }
  }
} satisfies UserConfigExport
