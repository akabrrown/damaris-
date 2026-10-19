import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/poem',
        destination: '/poetry',
        permanent: true,
      },
      {
        source: '/poem/:slug*',
        destination: '/poetry/:slug*',
        permanent: true,
      },
      {
        source: '/quote',
        destination: '/quotes',
        permanent: true,
      },
      {
        source: '/quote/:slug*',
        destination: '/quotes/:slug*',
        permanent: true,
      },
      {
        source: '/story',
        destination: '/stories',
        permanent: true,
      },
      {
        source: '/story/:slug*',
        destination: '/stories/:slug*',
        permanent: true,
      },
      {
        source: '/reflection',
        destination: '/reflections',
        permanent: true,
      },
      {
        source: '/reflection/:slug*',
        destination: '/reflections/:slug*',
        permanent: true,
      },
      {
        source: '/book',
        destination: '/books',
        permanent: true,
      },
      {
        source: '/book/:slug*',
        destination: '/books/:slug*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

