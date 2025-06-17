const path = require('path');
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

module.exports = {
  mode,
  entry: './static/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'static/dist'),
    publicPath: '/static/dist/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: 'raw-loader'
      }
    ]
  },
  resolve: {
    alias: {
      'three$': 'three/build/three.module.js',
      'three/examples/jsm': path.resolve(__dirname, 'node_modules/three/examples/jsm')
    },
    extensions: ['.js', '.json', '.glsl']
  },
  stats: 'verbose',
  performance: {
    hints: mode === 'production' ? 'warning' : false
  }
};
