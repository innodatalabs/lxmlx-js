import pkg from './package.json';

export default [
    // browser-friendly UMD build
    {
        input: 'src/lxmlx.js',
        output: {
            name: 'lxmlx',
            file: pkg.main,
            format: 'umd',
        }
    }
];
