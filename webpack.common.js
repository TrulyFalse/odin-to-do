import path from "node:path";
import HtmlWebpackPlugin from "html-webpack-plugin";

export default {
    entry: {
        app: "./src/js/app.js",
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(import.meta.dirname, 'dist'),
        clean: true,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./src/index.html",
        }),
    ],
    module:{
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(jpg|jpeg|png|webp|gif|svg)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.html$/i,
                use: ['html-loader'],
            }
        ]
    }
};