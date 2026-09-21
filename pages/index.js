import Head from 'next/head'
import dynamic from 'next/dynamic'

// Import the component with SSR disabled
const VideoConverter = dynamic(() => import('../components/VideoConverter'), { 
  ssr: false 
})

export default function Home() {
  return (
    <div>
      <Head>
        <title>Video Converter</title>
        <meta name="description" content="Convert videos to MP4 format" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* Layout rules that VideoConverter's own styles do not cover */}
      <style jsx global>{`
        h1, h3 {
          color: #212529;
          text-align: center;
          margin-top: 0;
        }

        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .file-item {
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }

        .file-header {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
        }

        .file-thumbnail {
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 150px;
          margin-bottom: 8px;
          border-radius: 8px;
        }

        .file-info {
          flex-grow: 1;
        }

        .file-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 5px;
        }

        .action-icon svg {
          opacity: 0.8;
        }

        .action-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .conversion-options {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 20px;
        }

        .option-group {
          flex: 1;
          min-width: 280px;
          padding: 15px;
          background-color: white;
          border-radius: 12px;
        }

        @media (max-width: 768px) {
          .container { padding: 20px; }
          h1 { font-size: 2rem; }
          .upload-container { padding: 30px; }
          .conversion-options { flex-direction: column; }
          .files-grid { grid-template-columns: 1fr; }
          .files-header { flex-direction: column; gap: 10px; }
          .preview-content { width: 95%; }
        }

        @media (max-width: 480px) {
          .format-options { flex-direction: column; align-items: center; }
          .file-details { flex-direction: column; align-items: flex-start; }
          .action-icons { flex-direction: column; gap: 5px; }
        }
      `}</style>

      <main>
        <VideoConverter />
      </main>
    </div>
  )
}