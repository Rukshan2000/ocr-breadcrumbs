# OCR Scanner - Next.js

A Next.js application for scanning and extracting text from tickets using OCR (Optical Character Recognition).

## Features

- 📷 Camera capture with alignment guides
- ✂️ Image cropping before OCR processing
- 🔍 OCR text extraction using Tesseract.js
- 📝 Text correction for common OCR errors
- 🎫 Structured ticket data extraction (Sri Dalada Maligawa tickets)
- 📱 Mobile-friendly responsive design
- 🎨 Beautiful bill preview template

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd ocr-next
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### For Mobile Testing (HTTPS required for camera)

Since camera access requires HTTPS on mobile devices, you'll need to either:

1. **Use a local HTTPS proxy** like [local-ssl-proxy](https://www.npmjs.com/package/local-ssl-proxy)
2. **Deploy to a service** like Vercel for quick HTTPS access
3. **Use ngrok** to tunnel your local server

## Project Structure

```
ocr-next/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles with Tailwind
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page
│   ├── components/
│   │   ├── AlignmentGuide.tsx   # Camera alignment overlay
│   │   ├── CropperModal.tsx     # Image cropping modal
│   │   ├── DataModal.tsx        # Ticket data display
│   │   ├── OCRScanner.tsx       # Main scanner component
│   │   └── ResultModal.tsx      # OCR results display
│   └── utils/
│       └── ocr.ts           # OCR utilities and text processing
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## Usage

1. Allow camera permissions when prompted
2. Position your ticket within the alignment guides
3. Press the capture button
4. Adjust the crop area if needed
5. View the extracted text and structured data

## Technologies

- [Next.js 14](https://nextjs.org/) - React framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

MIT
