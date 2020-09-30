import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import Dotenv from 'dotenv-webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import TerserJsPlugin from 'terser-webpack-plugin';

const webpackConf: webpack.ConfigurationFactory = (
  env: string | Record<string, string | number | boolean> | undefined,
  args: webpack.CliConfigOptions,
) => {
  const isProduction = args.mode === 'production';
  const isDevelopment = args.mode === 'development';

  const getLoaders = (cssOption?: webpack.RuleSetQuery): webpack.RuleSetUse => {
    const loaders = [
      isDevelopment && require.resolve('style-loader'),
      isProduction && {
        loader: MiniCssExtractPlugin.loader,
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOption,
      },
      { loader: require.resolve('sass-loader') },
    ].filter(Boolean) as webpack.RuleSetUse;
    return loaders;
  };

  const getPlugin = (): webpack.Plugin[] => {
    const plugins = [
      new CleanWebpackPlugin(),
      new Dotenv(),
      new HtmlWebpackPlugin({
        inject: true,
        template: path.resolve(__dirname, '../public/index.html'),
        minify: isProduction,
      }),
      isProduction &&
        new MiniCssExtractPlugin({
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      isProduction &&
        new FaviconsWebpackPlugin({
          logo: path.resolve(__dirname, '../public/favicon.png'),
          publicPath: './',
          cache: true,
        }),
      new ForkTsCheckerWebpackPlugin({
        async: isDevelopment,
        eslint: {
          files: './src/**/*.{ts,tsx,js,jsx}',
        },
      }),
    ].filter(Boolean) as webpack.Plugin[];
    return plugins;
  };
  return {
    entry: path.resolve(__dirname, '../src/index.tsx'),
    output: {
      path: isProduction
        ? path.resolve(__dirname, '../build')
        : path.resolve(__dirname, '../build'),
      pathinfo: !isProduction,
      filename: isProduction
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/bundle.js',
      chunkFilename: isProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : 'static/js/[name].chunk.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
      alias: {
        'react-dom': '@hot-loader/react-dom',
      },
    },
    devServer: {
      inline: true,
      stats: 'errors-only',
      contentBase: path.resolve(__dirname, '../dist'),
      historyApiFallback: true,
      open: true,
      port: 3000,
      hot: true,
    },
    module: {
      strictExportPresence: true,
      rules: [
        { parser: { requireEnsure: false } },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: 10000,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              exclude: '/node_modules/',
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                    '@babel/preset-typescript',
                  ],
                  plugins: [
                    [
                      '@babel/plugin-transform-runtime',
                      {
                        regenerator: true,
                      },
                    ],
                    'react-hot-loader/babel',
                  ],
                  sourceType: 'unambiguous',
                  babelrc: false,
                  cacheDirectory: true,
                  compact: isProduction,
                },
              },
            },
            {
              test: /\.css$/,
              exclude: /node_modules/,
              use: getLoaders({ importLoaders: 1 }),
            },
            {
              test: /\.(scss|sass)$/,
              exclude: /node_modules/,
              use: getLoaders(),
            },
            {
              loader: require.resolve('file-loader'),
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              options: {
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
          ],
        },
      ],
    },
    plugins: getPlugin(),
    devtool: '#cheap-module-source-map',
    optimization: {
      minimize: isProduction,
      runtimeChunk: 'single',
      namedModules: true,
      splitChunks: {
        maxInitialRequests: Infinity,
        minSize: 0,
        chunks: 'all',
        cacheGroups: {
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'reactVendor',
          },
          vendor: {
            test: /[\\/]node_modules[\\/](!react)(!react-dom)[\\/]/,
            name: 'vendor',
          },
        },
      },
      minimizer: [new OptimizeCssAssetsPlugin({}), new TerserJsPlugin({})],
    },
  };
};

export default webpackConf;
