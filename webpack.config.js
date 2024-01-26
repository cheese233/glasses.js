const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
    mode: "development",
    plugins: [
        new HtmlWebpackPlugin({
            title: "Webpack demo",
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
    entry: "./index.js",
};
