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

      <style jsx global>{`
        :root {
          --primary-color: #4361ee;
          --secondary-color: #3f37c9;
          --success-color: #4cc9f0;
          --warning-color: #f72585;
          --light-color: #f8f9fa;
          --dark-color: #212529;
          --border-radius: 12px;
          --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          --transition: all 0.3s ease;
        }
        
        body {
          font-family: 'Manrope', sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
          color: var(--dark-color);
          line-height: 1.6;
        }
        
        .container {
          background-color: white;
          border-radius: var(--border-radius);
          padding: 30px;
          box-shadow: var(--box-shadow);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        h1, h3 {
          color: var(--dark-color);
          text-align: center;
          margin-top: 0;
        }
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .greeting-text {
          background: linear-gradient(45deg, var(--primary-color), var(--success-color));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .emoji {
          font-family: system-ui;
        }
        
        .upload-container {
          border: 2px dashed #ccc;
          border-radius: var(--border-radius);
          padding: 40px;
          text-align: center;
          margin: 20px 0;
          cursor: pointer;
          transition: var(--transition);
          background-color: var(--light-color);
        }
        
        .upload-container:hover,
        .upload-container.drag-over {
          border-color: var(--primary-color);
          background-color: rgba(67, 97, 238, 0.05);
        }
        
        .upload-icon {
          margin-bottom: 15px;
          color: var(--primary-color);
        }
        
        .upload-subtitle {
          font-size: 0.9rem;
          color: #666;
          margin-top: 5px;
        }
        
        .status {
          margin: 15px 0;
          padding: 15px;
          border-radius: var(--border-radius);
          text-align: center;
          font-weight: 500;
        }
        
        .status.info {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        .status.success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .status.error {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .files-container {
          margin: 20px 0;
          padding: 20px;
          background-color: var(--light-color);
          border-radius: var(--border-radius);
        }
        
        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .files-actions {
          display: flex;
          gap: 5px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 20px;
          padding: 5px 10px;
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .action-btn:hover {
          background-color: #5a6268;
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .action-btn:disabled {
          background-color: #adb5bd;
          cursor: not-allowed;
        }
        
        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .file-item {
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.08);
          overflow: hidden;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          position: relative;
          cursor: pointer;
        }
        
        .file-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.12);
        }
        
        .file-item.selected {
          box-shadow: 0 0 0 2px var(--primary-color), 0 4px 10px rgba(67, 97, 238, 0.2);
        }
        
        .file-item.processing {
          background-color: rgba(67, 97, 238, 0.05);
        }
        
        .file-item.completed {
          background-color: rgba(76, 201, 240, 0.05);
        }
        
        .file-item.failed {
          background-color: rgba(247, 37, 133, 0.05);
        }
        
        .file-header {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .file-checkbox-container {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 2;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .file-checkbox {
          margin: 0;
          accent-color: var(--primary-color);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .file-thumbnail {
          width: 100%;
          height: 150px;
          position: relative;
          overflow: hidden;
          border-radius: 8px;
          margin-bottom: 8px;
        }
        
        .file-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .file-info {
          flex-grow: 1;
        }
        
        .file-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 5px;
        }
        
        .file-details {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 8px;
        }
        
        .file-type, .file-size, .file-dimensions, .file-aspect-ratio, .file-duration {
          font-size: 0.75rem;
          color: #666;
          background-color: #f1f3f5;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .file-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 5px;
        }
        
        .action-icons {
          display: flex;
          gap: 8px;
        }
        
        .action-icon {
          display: flex;
          align-items: center;
          gap: 3px;
          background-color: #f1f3f5;
          color: #666;
          border: none;
          border-radius: 4px;
          padding: 5px 8px;
          font-size: 11px;
          cursor: pointer;
          transition: var(--transition);
        }
        
        .action-icon svg {
          opacity: 0.8;
        }
        
        .action-icon:hover {
          background-color: #e9ecef;
        }
        
        .action-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .frame-select-btn {
          color: var(--primary-color);
        }
        
        .frame-select-btn:hover {
          background-color: rgba(67, 97, 238, 0.1);
        }
        
        .remove-btn {
          color: #c62828;
        }
        
        .remove-btn:hover {
          background-color: rgba(198, 40, 40, 0.1);
        }
        
        .status-icon {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 5px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        
        .status-icon.completed {
          color: #2e7d32;
          background-color: rgba(46, 125, 50, 0.1);
        }
        
        .status-icon.failed {
          color: #c62828;
          background-color: rgba(198, 40, 40, 0.1);
        }
        
        .file-progress {
          display: flex;
          align-items: center;
          gap: 5px;
          flex: 1;
          max-width: 150px;
        }
        
        .file-progress-bar {
          flex-grow: 1;
          height: 6px;
          background-color: #e9ecef;
          border-radius: 3px;
          overflow: hidden;
        }
        
        .file-progress-fill {
          height: 100%;
          background: linear-gradient(45deg, var(--primary-color), var(--success-color));
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .file-progress-text {
          font-size: 0.75rem;
          color: #666;
          min-width: 30px;
          text-align: right;
        }
        
        .frame-selection {
          padding: 15px;
          background-color: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }
        
        .frame-controls {
          display: flex;
          align-items: center;
          margin: 10px 0;
          gap: 10px;
        }
        
        .frame-slider {
          flex-grow: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: #ddd;
          border-radius: 4px;
          outline: none;
        }
        
        .frame-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
        }
        
        .frame-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--primary-color);
          cursor: pointer;
          border: none;
        }
        
        .frame-time {
          min-width: 80px;
          text-align: right;
          font-size: 12px;
          color: #555;
        }
        
        .frame-preview-container {
          text-align: center;
          margin: 15px 0 5px;
        }
        
        .frame-preview {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          background-color: #000;
        }
        
        .format-selection {
          margin: 20px 0;
          padding: 20px;
          background-color: var(--light-color);
          border-radius: var(--border-radius);
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
          background-color: white;
          padding: 15px;
          border-radius: var(--border-radius);
        }
        
        .option-group h3 {
          text-align: left;
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .options-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .option-toggle, .radio-option {
          display: flex;
          align-items: center;
          cursor: pointer;
          margin: 5px 0;
        }
        
        .aspect-ratio-selector p {
          margin: 15px 0 5px;
          font-weight: 500;
        }
        
        .radio-options {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .format-options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin: 20px 0;
        }
        
        .format-option {
          display: flex;
          align-items: center;
          padding: 8px 15px;
          background-color: white;
          border-radius: 30px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .format-option:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .format-option:hover .format-tooltip {
          opacity: 1;
          visibility: visible;
        }
        
        .format-tooltip {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #333;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: var(--transition);
          pointer-events: none;
        }
        
        .format-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: #333 transparent transparent transparent;
        }
        
        .btn {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: block;
          margin: 20px auto 0;
          transition: var(--transition);
        }
        
        .btn:hover {
          background-color: #3250d9;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .progress-container {
          width: 100%;
          height: 10px;
          background-color: #f0f0f0;
          border-radius: 30px;
          margin-top: 20px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(45deg, var(--primary-color), var(--success-color));
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 30px;
        }
        
        .downloads-container {
          margin-top: 30px;
          padding: 20px;
          background-color: var(--light-color);
          border-radius: var(--border-radius);
        }
        
        .download-items {
          margin: 15px 0;
        }
        
        .download-group {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .download-group-header {
          margin-bottom: 10px;
        }
        
        .download-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .download-btn {
          background-color: var(--success-color);
          color: white;
          border: none;
          padding: 8px 15px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          transition: var(--transition);
        }
        
        .download-btn:hover {
          background-color: #3ba8d0;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .btn-download-all {
          background-color: var(--success-color);
          margin-top: 15px;
        }
        
        .btn-download-all:hover {
          background-color: #3ba8d0;
        }
        
        .preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .preview-content {
          background-color: white;
          width: 90%;
          max-width: 800px;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }
        
        .preview-header h3 {
          margin: 0;
          text-align: left;
          font-size: 18px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .preview-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        
        .preview-close:hover {
          background-color: #f1f3f5;
        }
        
        .preview-body {
          padding: 20px;
          overflow: auto;
        }
        
        .preview-video {
          width: 100%;
          max-height: 70vh;
          border-radius: 8px;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 20px;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .upload-container {
            padding: 30px;
          }
          
          .conversion-options {
            flex-direction: column;
          }
          
          .files-grid {
            grid-template-columns: 1fr;
          }
          
          .files-header {
            flex-direction: column;
            gap: 10px;
          }
          
          .preview-content {
            width: 95%;
          }
        }
        
        @media (max-width: 480px) {
          .format-options {
            flex-direction: column;
            align-items: center;
          }
          
          .file-details {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .action-icons {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>

      <main>
        <VideoConverter />
      </main>
    </div>
  )
}