const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: path.resolve(__dirname, './src/main.js'),
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: '[name].[contenthash].js',
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new CleanWebpackPlugin(),
        new CopyPlugin({
            patterns: [
                {from: "public/json/*.json"},
                {from: "public/img/*.png"},
                {from: "public/img/*.svg"},
                {from: "public/img/*.ico"},
            ],
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.resolve(__dirname, 'src', 'index.html'),
            inject: true,
        }),
    ],
    resolve: {
        extensions: ['.js'],
    }
};
