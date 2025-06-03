
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      },
      { 
        protocol: 'https',
        // IMPORTANT: Replace '[your-supabase-project-ref]' with your actual Supabase project reference ID
        // e.g., 'abcdefgh1234567890.supabase.co'
        hostname: '[your-supabase-project-ref].supabase.co', 
      },
    ],
  },
};

export default nextConfig;
