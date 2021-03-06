const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('./WatchMissingNodeModulesPlugin')

module.exports = function(root) {
  const utils = require('./utils')(root, true)
  const config = require('../config')(root)
  const baseWebpackConfig = require('./webpack.base.conf')(root, true)

  // add hot-reload related code to entry chunks
  Object.keys(baseWebpackConfig.entry).forEach(function (name) {
    baseWebpackConfig.entry[name] = [`webpack-hot-middleware/client?name=${name}`, 'react-hot-loader/patch', ...baseWebpackConfig.entry[name]]
  })

  return merge(baseWebpackConfig, {
    module: {
      rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap })
    },
    // cheap-module-eval-source-map is faster for development
    devtool: '#cheap-eval-source-map',
    plugins: [
      new webpack.DefinePlugin({
        'process.env': '"development"',
        APP_CONFIG: JSON.stringify(utils.appConfig.define)
      }),
      new webpack.NamedModulesPlugin(),
      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      new webpack.HotModuleReplacementPlugin(),
      new WatchMissingNodeModulesPlugin(path.join(process.cwd(), 'node_modules')),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ].concat(utils.subdir.map(dir => {
      // https://github.com/ampedandwired/html-webpack-plugin
      return new HtmlWebpackPlugin({
        filename: `${dir}.html`,
        template: path.join(root, `src/pages/${dir}/index.html`),
        chunks: [dir]
      })
    })),
    performance: {hints: false}
  })
}