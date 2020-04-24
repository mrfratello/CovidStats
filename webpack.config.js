const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env) => {
  const production = env && env.production

  return {
    mode: production
      ? 'production'
      : 'development',
    entry: [
      // '@babel/polyfill',
      './src/index.js'
    ],
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'build.js'
    },
    resolve: {
      extensions: ['.wasm', '.mjs', '.jsx', '.js', '.json']
    },
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [require('autoprefixer')],
              },
            },
            'sass-loader'
          ],
        },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [{
              loader: 'file-loader',
              options: {
                  outputPath: "images"
              }
          }],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, './src/index.html'),
        hash: true,
      }),
      new MiniCssExtractPlugin({
        filename: '[name].css'
      })
    ],
    devServer: {
      contentBase: path.resolve(__dirname, './dist'),
      hot: true,
      proxy: {
        '/api': {
            target: 'http://[::1]:8000',
            secure: false,
            changeOrigin: true,
            logLevel: 'debug',
        },
      },
    }
  }
}