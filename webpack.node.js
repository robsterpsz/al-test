const nodeExternals = require('webpack-node-externals');
const path = require('path');
const webpack = require('webpack');

const NODE_ENV = process.env.NODE_ENV || 'development';

const paths = {
  source: path.join(__dirname, './src'),
  javascript: path.join(__dirname, './src'),
  build: path.join(__dirname, './dist'),
};

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        plugins: [
          'syntax-decorators',
          'transform-class-properties',
          'transform-decorators-legacy',
          'transform-runtime'
        ],
      }
    }
  }
];

const plugins = [
  new webpack.optimize.UglifyJsPlugin({
    compress: {
      comparisons: true,
      conditionals: true,
      dead_code: true,
      drop_console: false, //!SERVER_RENDER, // Keep server logs
      drop_debugger: true,
      evaluate: true,
      if_return: true,
      join_vars: true,
      screw_ie8: true,
      sequences: true,
      unused: true,
      warnings: false,
    },
    output: {
      comments: false,
    },
  })
];

const resolve = {
  extensions: [/*'.webpack-loader.js', '.web-loader.js', '.loader.js', */'.js'],
  modules: [
    path.join(__dirname, './node_modules'),
    paths.javascript,
  ],
};

// Default server entry file
const entry = [
  path.join(paths.javascript, 'index.js'),
];


// Webpack config
module.exports = {
  context: paths.javascript,
  entry,
  output: {
    path: paths.build,
    publicPath: '/',
    filename: 'index.js'
  },
  module: {
    rules,
  },
  externals: [nodeExternals()],
  target: 'node',
  resolve,
  plugins
};
