const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            title: "Glasses.js demo",
            filename: "index.html",
            chunks: ["index"],
        }),
        new CopyPlugin({
            patterns: ["./models"],
        }),
    ],
    module: {
        rules: [
            {
                test: /\.wasm$/,
                type: "asset/resource",
            },
        ],
    },
    entry: {
        index: "./index.js",
        glasses: "./glasses.js",
    },
};
