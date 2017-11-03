const path = require('path');
const webpack = require('webpack');
const NamedModulesPlugin = webpack.NamedModulesPlugin;

module.exports = function (param) {
  return {
    entry: {
      app: path.join(__dirname, 'www/js/app.js'),
    },
    output: {
      path: path.join(__dirname, './www'),
      filename: '[name].bundle.js',
    },
    resolveLoader: {
      modules: [
        'node_modules',
        path.resolve(__dirname, 'www/lib')
      ]
    },
    devtool: 'cheap-eval-source-map',
    module: {
      loaders: [
        {
          test: /\.js$/,
          loaders: ['babel-loader','angular-hot-replacement'],
          exclude: [/node_modules/],
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: 'style-loader',
              options: {
                insertAt: 'top'
              }
            },
            {
              loader: 'css-loader'
            }
          ]
        },
        {
          test: /\.html$/,
          loaders: ['angular-hot-replacement','raw-loader']
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'fonts/[name].[ext]',
              }
            }
          ]
        },
        {
          test: /\.(png|jpg|svg|gif)$/,
          loader: 'file-loader',
          options: {
            name: 'img/[name].[ext]',
          }
        }]
    },
    plugins: [
      new NamedModulesPlugin(),
    ],
    devServer: {
      hotOnly: true,
      contentBase: path.join(__dirname, "www"),
      historyApiFallback: true,
      port: 8080 // 端口号
    }
  }
};
