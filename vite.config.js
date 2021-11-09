export default {
	envPrefix: 'CLIENT_',
	server: {
		host: '0.0.0.0',
		port: process.env.PORT,
		strictPort: true,
		hmr: {
			protocol: 'wss',
			port: 443
		}
	},
	build: {
		outDir: 'build'
	}
}