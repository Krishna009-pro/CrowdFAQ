const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin, container } = require("webpack");

const { ModuleFederationPlugin } = container;
const dependencies = require("./package.json").dependencies;

module.exports = {
  entry: "./src/index.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    publicPath: "auto",
    clean: false,
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        type: "javascript/auto",
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "aq_portal",
      filename: "remoteEntry.js",
      exposes: {
        "./AQSearch": "./src/components/SearchWidget",
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: dependencies.react,
          eager: true,
        },
        "react-dom": {
          singleton: true,
          requiredVersion: dependencies["react-dom"],
          eager: true,
        },
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new DefinePlugin({
      "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
        process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1"
      ),
    }),
  ],
  devServer: {
    port: 3001,
    host: "0.0.0.0",
    allowedHosts: "all",
    historyApiFallback: true,
    hot: true,
    open: false,
    client: {
      overlay: {
      errors: true,
      warnings: false,
    },
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
};
