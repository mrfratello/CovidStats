const path = require('path')
// const MiniCssExtractPlugin = require('mini-css-extract-plugin')
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
        // {
        //     enforce: 'pre',
        //     test: /\.(js|jsx)$/,
        //     exclude: /node_modules/,
        //     loader: 'eslint-loader',
        //     options: {
        //         emitWarning: true,
        //     },
        // },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        // {
        //   test: /\.(png|jpg|gif)$/,
        //   use: [{
        //       loader: 'file-loader',
        //       options: {
        //           outputPath: "images"
        //       }
        //   }],
        // },
        // {
        //   test: /\.(woff|woff2|eot|ttf|otf|svg)$/i,
        //   use: [{
        //       loader: 'url-loader',
        //       options: {
        //           limit: 8192,
        //           outputPath: "font"
        //       }
        //   }]
        // }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        template: path.resolve(__dirname, './src/index.html'),
        hash: true,
      }),
      // new MiniCssExtractPlugin({
      //   filename: '[name].[contenthash].css'
      // })
    ],
    devServer: {
      contentBase: path.resolve(__dirname, './dist'),
      hot: true,
    }
  }
}