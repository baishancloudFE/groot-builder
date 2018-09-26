module.exports = function(argv = {}) {
  process.env.NODE_ENV = 'development'

  var opn = require('opn')
  var path = require('path')
  var chalk = require('chalk')
  var express = require('express')
  var webpack = require('webpack')
  var proxyMiddleware = require('http-proxy-middleware')
  var utils = require('./utils')
  var webpackConfig = require('./webpack.dev.conf')

  // default port where dev server listens for incoming traffic
  var port = process.env.PORT || utils.appConfig.port

  // default domain where browsers open the tab
  var domain = utils.appConfig.domain

  // automatically open browser, if not set will be false
  var autoOpenBrowser = argv.openBrowser === undefined ? true : argv.openBrowser

  // Define HTTP proxies to your custom API backend
  // https://github.com/chimurai/http-proxy-middleware
  var proxyTable = {}

  var app = express()
  var compiler = webpack(webpackConfig)

  var devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: utils.appConfig.quiet || true,
    stats: {colors: true}
  })

  var hotMiddleware = require('webpack-hot-middleware')(compiler, {
    log: () => {}
  })

  // force page reload when html-webpack-plugin template changes
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb()
    })
  })

  // proxy api requests
  Object.keys(proxyTable).forEach(function (context) {
    var options = proxyTable[context]
    if (typeof options === 'string') {
      options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
  })

  // handle fallback for HTML5 history API
  app.use(require('connect-history-api-fallback')())

  // serve webpack bundle output
  app.use(devMiddleware)

  // enable hot-reload and state-preserving
  // compilation error display
  app.use(hotMiddleware)

  // serve pure static assets
  var staticPath = path.posix.join('/', 'static')
  app.use(staticPath, express.static('./src/static'))

  var uri = `http://${domain}:${port}`

  var _resolve
  var readyPromise = new Promise(resolve => {
    _resolve = resolve
  })

  console.log('> Starting dev server...')
  devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + chalk.cyan(uri) + '\n');

    autoOpenBrowser && opn(uri)

    _resolve()
  })

  // register pages routing
  utils.subdir.forEach(dir => {
    app.use(proxyMiddleware(`/${dir}`, {
      target: `http://${domain}:${port}/${dir}.html`,
      pathRewrite: {[`^/${dir}`] : ""}
    }))
  })

  // redirect to the home page
  app.use('/', (req, res) => res.redirect(`/${utils.appConfig.homepage}`))

  var server = app.listen(port)

  return {
    ready: readyPromise,
    close: () => {
      server.close()
    }
  }
}