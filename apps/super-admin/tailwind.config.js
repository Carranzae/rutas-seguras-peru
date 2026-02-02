/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                telemetry: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                cyber: {
                    primary: '#00f2ff',
                    secondary: '#0891b2',
                    dark: '#020617',
                    surface: '#0f172a',
                }
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'sos-pulse': 'sos-pulse 1s ease-in-out infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 242, 255, 0.3)' },
                    '50%': { boxShadow: '0 0 20px rgba(0, 242, 255, 0.6)' },
                },
                'sos-pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                    '50%': { boxShadow: '0 0 20px 10px rgba(239, 68, 68, 0.3)' },
                },
            },
        },
    },
    plugins: [],
}
