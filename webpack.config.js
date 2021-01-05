const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

const buildMode = process.env.NODE_ENV;
const isDevMode = buildMode !== 'production';
const GLOBAL_CONFIG = {
    src: path.resolve(__dirname, 'src'),
    dist: path.resolve(__dirname, 'dist'),
    entry: './app.js',
    proxy: {
        '/api': 'http://localhost/'
    },
    copyPatterns: ['img']
};


const getOptimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all'
        }
    }

    if (!isDevMode) {
        config.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }
    return config;
}

const getCssLoader = (extra = []) => {
    const loaders = [{
        loader: MiniCssExtractPlugin.loader,
        options: {
            hmr: isDevMode,
        },
    },
        'css-loader',
    ...('loaders' in extra ? extra['loaders'] : [])
    ];

    return loaders;
}

const getBabelLoaderOptions = (extraPresets = []) => {
    return {
        presets: [
            '@babel/preset-env',
            ...extraPresets
        ],
        plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-proposal-class-properties']
    }
}

const getJsLoaders = (extra = {}) => {
    const loaders = [
        ...(isDevMode ? ['eslint-loader'] : []),
        ...('loaders' in extra ? extra['loaders'] : [])];

    return [{
        loader: 'babel-loader',
        options: getBabelLoaderOptions('options' in extra ? extra['options'] : [])
    },
    ...loaders]
}

const getCopyPatterns = (patternList, srcDir = GLOBAL_CONFIG.src, bundleDir = GLOBAL_CONFIG.dist) => {
    const patterns = [];
    for (const pattern of patternList) {
        if (typeof pattern === 'object') {
            patterns.push(pattern);
        } else if (typeof pattern == 'string') {
            patterns.push({
                from: path.resolve(__dirname, srcDir, pattern),
                to: path.resolve(__dirname, bundleDir, pattern)
            });
        }
    }
    return patterns;
}

const getPlugins = (plugins, config) => {
    config.CopyWepackPlugin.patterns = getCopyPatterns(config.CopyWepackPlugin.patterns);
    if (config.CopyWepackPlugin.patterns.length != 0) {
        plugins.push(new CopyWebpackPlugin(config.CopyWepackPlugin))
    }
    return plugins;
}

module.exports = {
    context: GLOBAL_CONFIG.src,
    mode: buildMode,
    entry: GLOBAL_CONFIG.entry,
    output: {
        filename: '[name].js',
        path: GLOBAL_CONFIG.dist
    },
    optimization: getOptimization(),
    devServer: {
        port: 8080,
        // watchOptions: {
        //     poll: true
        // },
        proxy: GLOBAL_CONFIG.proxy,
        open: true
    },
    devtool: isDevMode ? 'source-map' : '',
    resolve: {
        extensions: ['.js', '.ts', '.json', '.jsx', '.tsx'],
        alias: {
            '@': GLOBAL_CONFIG.src
        }
    },
    plugins: getPlugins([
        new HTMLWebpackPlugin({
            template: './index.html',
            minify: {
                collapseWhitespace: true
            }
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin(),
    ], {
        'CopyWepackPlugin': {
            patterns: GLOBAL_CONFIG.copyPatterns
        }
    }),
    module: {
        rules: [{
            test: /\.css$/i,
            use: getCssLoader(),
        },
        {
            test: /\.s[ac]ss$/i,
            use: getCssLoader({ 'loaders': ['sass-loader'] }),
        },
        {
            test: /\.(png|jpg|svg|gif)$/,
            use: ['file-loader']
        },
        {
            test: /\.(ttf|woff|woff2|eot)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'fonts/'
                }
            }]
        },
        {
            test: /\.xml$/,
            use: ['xml-loader']
        },
        {
            test: /\.csv$/,
            use: ['csv-loader']
        },
        {
            test: /\.js$/,
            exclude: /node_modules/,
            use: getJsLoaders()
        },
        {
            test: /\.jsx$/,
            exclude: /node_modules/,
            use: getJsLoaders({ 'options': ['@babel/preset-react'] })
        },
        {
            test: /\.tsx$/,
            exclude: /node_modules/,
            use: getJsLoaders({ 'options': ['@babel/preset-typescript', '@babel/preset-react'] })
        },
        {
            test: /\.(ts)$/,
            exclude: /node_modules/,
            use: getJsLoaders({ 'options': ['@babel/preset-typescript'] })
        }
        ]
    }
}