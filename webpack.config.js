'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: ['./elts/icons.html'],
	output: {
		filename: 'icons.bundle.js',
		path: path.resolve(__dirname, './assets'),
		publicPath: 'assets'
	},
	resolve: {
		modules: ['node_modules'],
		descriptionFiles: ['package.json']
	},
	devtool: 'inline-source-map',
	module: {
		loaders: [{
			test: /\.html/,
			use: [
				{
					loader: 'polymer-webpack-loader'
				}
			]
		}]
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env': {
				'NODE_ENV': "'production'"
			}
		})//,
		// NOTE: was causing build error (copied from jonw.me)
		//new webpack.optimize.UglifyJsPlugin()
	]
};