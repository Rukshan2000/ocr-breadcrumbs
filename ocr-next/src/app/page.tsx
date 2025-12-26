'use client';

import dynamic from 'next/dynamic';
import { InstallPrompt } from '@/components/InstallPrompt';

// Dynamic import to avoid SSR issues with camera/canvas
const OCRScanner = dynamic(() => import('@/components/OCRScanner'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="text-white text-lg">Loading OCR Scanner...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <OCRScanner />
      <InstallPrompt />
    </>
  );
}
