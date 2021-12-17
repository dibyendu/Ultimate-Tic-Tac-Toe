// import { viteExternalsPlugin } from 'vite-plugin-externals'

export default {
	server: {
		host: '0.0.0.0',
		hmr: {
			protocol: 'wss',
			port: 443
		}
	},
	build: {
		outDir: 'build'
		// rollupOptions: {
    //   external: [
		// 		'react',
		// 		'react-dom',
		// 		'@tensorflow/tfjs',
		// 	],
    //   output: {
    //     globals: {
    //       react: 'React',
		// 			'react-dom': 'ReactDOM',
		// 			'@tensorflow/tfjs': 'tf'
    //     }
    //   }
		// }
	}
	// plugins: [
  //   viteExternalsPlugin({
  //     react: 'React',
  //     'react-dom': 'ReactDOM',
	// 		'@tensorflow/tfjs': 'tf'
  //   })
  // ]
}