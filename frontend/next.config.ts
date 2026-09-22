/** @type {import('next').NextConfig} */
const nextConfig = {
  // सभी डोमेन और सबडोमेन के लिए API रिक्वेस्ट्स को Django बैकएंड पर प्रॉक्सी करें
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
