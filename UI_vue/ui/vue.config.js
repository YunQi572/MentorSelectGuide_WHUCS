/*
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  devServer: {
    open: true,
    host: 'localhost',
    port: 8080
  }
})
*/

const { defineConfig } = require('@vue/cli-service')
const webpack = require('webpack');
module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(process.env.VITE_DEEPSEEK_API_KEY),
      }),
    ],
  },
  transpileDependencies: true,
  lintOnSave: false,
  // 跨域配置
  devServer: {               //记住，别写错了devServer//设置本地默认端口  选填
    port: 9876,
    proxy: {                  //设置代理，必须填
      '/api': {              //设置拦截器  拦截器格式   斜杠+拦截器名字，名字可以自己定
        target: 'http://47.122.112.16:9090',  // 改为你的服务器地址
        changeOrigin: true,              //是否设置同源，输入是的
        logLevel: 'debug' // 启用调试日志
      }
    },
    client: {
      overlay: false
    }
  }
})


