import path from 'node:path';

import CleanCSS from 'clean-css';
import postcssPresetEnv from 'postcss-preset-env';
import inlinePostCSS from 'rollup-plugin-inline-postcss';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import { defineConfig } from 'vite';

const include = [path.resolve(__dirname, 'src/**/*.ts')];

// the minify-html plugin uses an older version of clean-css by default
// the older version would treat svg positional properties as invalid and silently remove them
const css = new CleanCSS();

export default defineConfig({
	root: path.resolve(__dirname, 'src'),
	publicDir: path.resolve(__dirname, 'public'),
	build: {
		outDir: '../../../dist/src/binary-view',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				chunkFileNames: '[name].js',
				entryFileNames: '[name].js',
			},
		},
	},
	plugins: [
		inlinePostCSS({
			include,
			plugins: [
				postcssPresetEnv({
					features: {
						'nesting-rules': true,
					},
				}),
			],
		}),
		minifyHTML({
			include,
			failOnError: true,
			options: {
				minifyOptions: {
					minifyCSS: (value) => css.minify(value).styles,
				},
			},
		}),
	],
});
