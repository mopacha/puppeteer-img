
const path = require('path')

module.exports = () => {
    return {
        mode: 'production',
        entry: './src/index.js',
        target: 'node',
        output: {
            filename: 'puppteer.js',
            path: path.resolve(__dirname, 'dist')
        },
        node: {
            global: true,
            __filename: true,
            __dirname: true
        },
        module: {
            rules: [
                {
                    test: /\.js/,
                    use: [
                        {
                            loader: 'babel-loader',
                        }
                    ],
                    exclude: /node_modules/,
                },
            ]
        }
    }
}