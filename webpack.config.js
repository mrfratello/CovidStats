const path = require('path')
const fs = require('fs')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const StylelintPlugin = require('stylelint-webpack-plugin')
const version = require('./package.json').version
const pages = ['index', 'map']
const metrika = fs.readFileSync('./src/metrika.html')

module.exports = (env) => {
  const production = env && env.production

  return {
    mode: production ? 'production' : 'development',
    entry: pages.reduce(
      (entry, page) => ({
        ...entry,
        [page]: `./src/${page}.js`,
      }),
      {},
    ),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].build.js',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 1,
        minChunks: 2,
      },
    },
    resolve: {
      extensions: ['.wasm', '.mjs', '.ts', '.js', '.json'],
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
            'sass-loader',
          ],
        },
        {
          test: /\.(ts|js)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.(png|jpg|gif)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: 'images',
              },
            },
          ],
        },
      ],
    },
    plugins: [
      ...pages.map(
        (page) =>
          new HtmlWebpackPlugin({
            filename: `${page}.html`,
            template: path.resolve(__dirname, `./src/${page}.html`),
            hash: true,
            chunks: [page],
            metrika,
            version,
          }),
      ),
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
      new ESLintPlugin({
        emitWarning: true,
        extensions: ['js', 'ts'],
      }),
      new StylelintPlugin({
        emitWarning: true,
        fix: true,
      }),
    ],
    devServer: {
      contentBase: path.resolve(__dirname, './dist'),
      hot: true,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          // target: 'http://[::1]:8000',
          target: 'https://covid.syomochkin.xyz',
          secure: false,
          changeOrigin: true,
          logLevel: 'debug',
        },
      },
    },
  }
}
