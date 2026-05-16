/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte}'],
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'Inter',
					'ui-sans-serif',
					'system-ui',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Helvetica Neue',
					'sans-serif'
				]
			},
			keyframes: {
				aurora: {
					'0%, 100%': {
						transform: 'translate3d(0,0,0) scale(1)',
						filter: 'hue-rotate(0deg)'
					},
					'50%': {
						transform: 'translate3d(2%,-3%,0) scale(1.05)',
						filter: 'hue-rotate(15deg)'
					}
				},
				'aurora-drift': {
					'0%': { backgroundPosition: '0% 0%, 100% 0%, 0% 100%, 100% 100%' },
					'50%': { backgroundPosition: '20% 30%, 80% 20%, 30% 80%, 70% 60%' },
					'100%': { backgroundPosition: '0% 0%, 100% 0%, 0% 100%, 100% 100%' }
				},
				'pulse-soft': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.005)' }
				},
				'spin-slow': {
					to: { transform: 'rotate(360deg)' }
				},
				'fly-up': {
					from: { transform: 'translateY(8px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'fly-down': {
					from: { transform: 'translateY(0)', opacity: '1' },
					to: { transform: 'translateY(-8px)', opacity: '0' }
				}
			},
			animation: {
				aurora: 'aurora-drift 30s ease-in-out infinite',
				'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
				'spin-slow': 'spin-slow 4s linear infinite'
			}
		}
	},
	plugins: []
};
