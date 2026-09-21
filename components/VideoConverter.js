'use client';

import { useEffect, useState, useRef } from 'react';

export default function VideoConverter() {
  // State variables
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedVideos, setConvertedVideos] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [progress, setProgress] = useState(0);
  const [selectedFormats, setSelectedFormats] = useState({});
  const [showDownloads, setShowDownloads] = useState(false);
  const [frameSelections, setFrameSelections] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);
  const fetchFileRef = useRef(null);
  const previewVideosRef = useRef({});
  const framePreviewsRef = useRef({});
  const videoPreviewRef = useRef(null);
  
  // Format options
  const availableFormats = [
    { width: 288, height: 432, label: '288x432', aspectRatio: '2:3' },
    { width: 320, height: 160, label: '320x160', aspectRatio: '2:1' },
    { width: 480, height: 240, label: '480x240', aspectRatio: '2:1' },
    { width: 480, height: 270, label: '480x270', aspectRatio: '16:9' },
    { width: 480, height: 288, label: '480x288', aspectRatio: '5:3' },
    { width: 512, height: 256, label: '512x256', aspectRatio: '2:1' },
    { width: 576, height: 288, label: '576x288', aspectRatio: '2:1' },
    { width: 672, height: 336, label: '672x336', aspectRatio: '2:1' },
    { width: 720, height: 360, label: '720x360', aspectRatio: '2:1' },
    { width: 720, height: 480, label: '720x480', aspectRatio: '3:2' },
    { width: 768, height: 384, label: '768x384', aspectRatio: '2:1' },
    { width: 800, height: 400, label: '800x400', aspectRatio: '2:1' },
    { width: 840, height: 360, label: '840x360', aspectRatio: '7:3' },
    { width: 864, height: 432, label: '864x432', aspectRatio: '2:1' },
    { width: 896, height: 448, label: '896x448', aspectRatio: '2:1' },
    { width: 960, height: 480, label: '960x480', aspectRatio: '2:1' },
    { width: 960, height: 576, label: '960x576', aspectRatio: '5:3' },
    { width: 1900, height: 950, label: '1900x950', aspectRatio: '2:1' }
  ];
  
  // Option settings
  const [removeAudio, setRemoveAudio] = useState(true);
  const [limitDuration, setLimitDuration] = useState(true);
  const [aspectRatioMode, setAspectRatioMode] = useState('crop');
  
  // Initialize on component mount
  useEffect(() => {
    // Set initial status message to show immediately
    setStatusMessage('Initializing converter...');
    setStatusType('info');
    
    // Add CORS headers for SharedArrayBuffer
    const meta1 = document.createElement('meta');
    meta1.httpEquiv = 'Cross-Origin-Opener-Policy';
    meta1.content = 'same-origin';
    document.head.appendChild(meta1);

    const meta2 = document.createElement('meta');
    meta2.httpEquiv = 'Cross-Origin-Embedder-Policy';
    meta2.content = 'require-corp';
    document.head.appendChild(meta2);
    
    // Add Google Fonts for Manrope
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(fontLink);
    
    // Load FFmpeg
    const ffmpegScript = document.createElement('script');
    ffmpegScript.src = 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
    
    // Show ready message immediately
    setTimeout(() => {
      setStatusMessage('Ready to convert files');
      setStatusType('success');
    }, 100);
    
    ffmpegScript.onload = async function() {
      const { createFFmpeg, fetchFile } = window.FFmpeg;
      // Configure FFmpeg with optimal settings for speed
      ffmpegRef.current = createFFmpeg({ 
        log: false, // Disable logging for better performance
        corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
        progress: ({ ratio }) => {
          setProgress(Math.round(ratio * 100));
        }
      });
      fetchFileRef.current = fetchFile;
      
      try {
        await ffmpegRef.current.load();
        setIsFFmpegLoaded(true);
        setStatusMessage('Converter fully loaded');
        setStatusType('success');
      } catch (err) {
        console.error('Failed to load FFmpeg:', err);
        setStatusMessage('Error loading FFmpeg: ' + err.message);
        setStatusType('error');
      }
    };
    
    ffmpegScript.onerror = function() {
      setStatusMessage('Failed to load FFmpeg library. Please refresh the page or try again later.');
      setStatusType('error');
    };
    
    document.body.appendChild(ffmpegScript);
    
    // Cleanup
    return () => {
      Object.values(previewVideosRef.current).forEach(video => {
        if (video) {
          video.pause();
          video.src = '';
        }
      });
    };
  }, []);
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    if (!isFFmpegLoaded) {
      setStatusMessage('FFmpeg is not yet loaded');
      setStatusType('error');
      return;
    }
    
    const files = e.target.files || (e.dataTransfer && e.dataTransfer.files);
    if (!files || files.length === 0) return;
    
    // Filter valid files (videos and images)
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    if (validFiles.length === 0) {
      setStatusMessage('No valid video or image files found');
      setStatusType('error');
      return;
    }
    
    setStatusMessage(`Processing ${validFiles.length} files...`);
    setStatusType('info');
    
    // Process each file and add to uploadedFiles array
    const newFiles = [];
    
    for (const file of validFiles) {
      // Create file object with additional properties
      const fileId = 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const fileObj = {
        file: file,
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        isImage: file.type.startsWith('image/'),
        duration: 0,
        width: 0,
        height: 0,
        progress: 0,
        status: 'ready',
        thumbnail: null,
        videoUrl: null,
        makeStatic: false // Per-file makeStatic property
      };
      
      // Get dimensions for image files
      if (fileObj.isImage) {
        try {
          const dimensions = await getImageDimensions(file);
          fileObj.width = dimensions.width;
          fileObj.height = dimensions.height;
          fileObj.thumbnail = dimensions.thumbnail;
          fileObj.aspectRatio = formatAspectRatio(dimensions.width, dimensions.height);
        } catch (error) {
          console.error('Error getting image dimensions:', error);
        }
      }
      
      // Get duration and dimensions for video files
      if (!fileObj.isImage) {
        try {
          const metadata = await getVideoMetadata(file);
          fileObj.duration = metadata.duration;
          fileObj.width = metadata.width;
          fileObj.height = metadata.height;
          fileObj.thumbnail = metadata.thumbnail;
          fileObj.aspectRatio = formatAspectRatio(metadata.width, metadata.height);
          fileObj.videoUrl = URL.createObjectURL(file);
          
          // Set default frame selection to 25% of the video duration
          setFrameSelections(prev => ({
            ...prev,
            [fileId]: metadata.duration * 0.25
          }));
        } catch (error) {
          console.error('Error getting video metadata:', error);
        }
      }
      
      newFiles.push(fileObj);
    }
    
    setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);
    setStatusMessage('Files ready for conversion. Select formats and click "Convert"');
    setStatusType('success');
  };
  
  // Get image dimensions and thumbnail
  function getImageDimensions(imageFile) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = function() {
        // Create thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200 * (img.height / img.width);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        
        resolve({
          width: img.width,
          height: img.height,
          thumbnail: thumbnail
        });
        URL.revokeObjectURL(img.src); // Clean up
      };
      img.onerror = function() {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(img.src); // Clean up
      };
      img.src = URL.createObjectURL(imageFile);
    });
  }
  
  // Get video metadata (duration, dimensions) and thumbnail
  function getVideoMetadata(videoFile) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        // Set video to 25% of its duration to capture a good thumbnail frame
        video.currentTime = video.duration * 0.25;
      };
      
      video.onseeked = function() {
        // Create thumbnail
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 200 * (video.videoHeight / video.videoWidth);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg');
        
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnail: thumbnail
        });
      };
      
      video.onerror = function() {
        reject(new Error('Failed to load video metadata'));
        URL.revokeObjectURL(video.src); // Clean up
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  }
  
  // Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Format time (seconds to MM:SS)
  function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Format aspect ratio as X:Y
  function formatAspectRatio(width, height) {
    if (!width || !height) return 'Unknown';
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(width, height);
    return `${width/divisor}:${height/divisor}`;
  }
  
  // Open the video preview modal
  const openVideoPreview = (file) => {
    if (!file || file.isImage) return;
    setPreviewFile(file);
    setShowPreview(true);
  };
  
  // Close the video preview modal
  const closeVideoPreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };
  
  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    handleFileUpload(e);
  };
  
  // Toggle format selection
  const toggleFormat = (formatLabel) => {
    setSelectedFormats(prev => ({
      ...prev,
      [formatLabel]: !prev[formatLabel]
    }));
  };
  
  // Toggle static mode for a specific file
  const toggleFileStatic = (fileId, e) => {
    e.stopPropagation();
    setUploadedFiles(prev => 
      prev.map(f => {
        if (f.id === fileId && !f.isImage) {
          const newMakeStatic = !f.makeStatic;
          // If enabling static mode, load the video preview
          if (newMakeStatic) {
            setTimeout(() => loadVideoPreview(fileId), 100);
          }
          return {...f, makeStatic: newMakeStatic};
        }
        return f;
      })
    );
  };
  
  // File selection handlers
  const removeFile = (fileId, e) => {
    e.stopPropagation();
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Clean up any preview videos and frame selections
    if (previewVideosRef.current[fileId]) {
      previewVideosRef.current[fileId].pause();
      URL.revokeObjectURL(previewVideosRef.current[fileId].src);
      delete previewVideosRef.current[fileId];
    }
    
    setFrameSelections(prev => {
      const newSelections = { ...prev };
      delete newSelections[fileId];
      return newSelections;
    });
  };
  
  // Removed toggle file selection, selectAllFiles, and deselectAllFiles functions
  // since we're removing the selection UI completely
  
  const clearAllFiles = () => {
    // Clean up previews
    Object.values(previewVideosRef.current).forEach(video => {
      if (video) {
        video.pause();
        URL.revokeObjectURL(video.src);
      }
    });
    previewVideosRef.current = {};
    
    // Clean up video URLs
    uploadedFiles.forEach(file => {
      if (file.videoUrl) {
        URL.revokeObjectURL(file.videoUrl);
      }
    });
    
    setUploadedFiles([]);
    setConvertedVideos({});
    setShowDownloads(false);
    setFrameSelections({});
  };
  
  // Load video preview for a specific file
  const loadVideoPreview = (fileId) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || file.isImage) return;
    
    // Create video element if it doesn't exist
    if (!previewVideosRef.current[fileId]) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file.file);
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Initialize frame selection if not already set
        if (!frameSelections[fileId]) {
          setFrameSelections(prev => ({
            ...prev,
            [fileId]: video.duration * 0.25
          }));
        }
        
        // Set to current frame selection
        video.currentTime = frameSelections[fileId] || (video.duration * 0.25);
      };
      
      video.onseeked = () => {
        updateFramePreview(fileId);
      };
      
      previewVideosRef.current[fileId] = video;
    } else {
      // Use existing video element
      const video = previewVideosRef.current[fileId];
      video.currentTime = frameSelections[fileId] || (video.duration * 0.25);
    }
  };
  
  // Update frame preview canvas
  const updateFramePreview = (fileId) => {
    const video = previewVideosRef.current[fileId];
    const canvas = framePreviewsRef.current[fileId];
    
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  };
  
  // Handle frame slider change
  const handleFrameSliderChange = (fileId, e) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file || file.isImage) return;
    
    const video = previewVideosRef.current[fileId];
    if (!video) return;
    
    const percentage = parseFloat(e.target.value);
    const newTime = (percentage / 100) * video.duration;
    
    setFrameSelections(prev => ({
      ...prev,
      [fileId]: newTime
    }));
    
    video.currentTime = newTime;
  };
  
  // Convert an image to video - optimized for speed
  async function convertImageToVideo(fileObj, format) {
    try {
      const { ffmpeg, fetchFile } = { ffmpeg: ffmpegRef.current, fetchFile: fetchFileRef.current };
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'processing', progress: 0} : f)
      );
      
      // Get image data - reuse existing data if possible
      const inputFileName = `input_${fileObj.id}.jpg`;
      
      // Only write file if it doesn't exist yet
      if (!ffmpeg.FS('readdir', '/').includes(inputFileName)) {
        const imageData = await fetchFile(fileObj.file);
        ffmpeg.FS('writeFile', inputFileName, imageData);
      }
      
      // Determine scaling filter based on aspect ratio mode
      const scaleFilter = aspectRatioMode === 'crop'
        ? `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height}`
        : `scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease,pad=${format.width}:${format.height}:(ow-iw)/2:(oh-ih)/2`;
      
      // Setup output filename
      const outputFileName = `output_${fileObj.id}_${format.label}.mp4`;
      
      // Set progress callback
      const progressCallback = ({ ratio }) => {
        const percent = Math.round(ratio * 100);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? {...f, progress: percent} : f)
        );
      };
      
      // Use optimized FFmpeg settings for speed
      ffmpeg.setProgress(progressCallback);
      
      // Run FFmpeg command with optimized settings
      await ffmpeg.run(
        '-loop', '1',
        '-i', inputFileName,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-tune', 'stillimage',
        '-t', '10',
        '-vf', scaleFilter,
        '-r', '25',
        '-pix_fmt', 'yuv420p',
        '-an', // Remove audio
        '-f', 'mp4',
        outputFileName
      );
      
      // Read the result
      const data = ffmpeg.FS('readFile', outputFileName);
      
      // Create a blob
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Add to converted videos
      setConvertedVideos(prev => ({
        ...prev,
        [fileObj.id]: {
          ...(prev[fileObj.id] || {}),
          [format.label]: {
            blob,
            url,
            fileName: fileObj.name.replace(/\.[^/.]+$/, '') + '_static_' + format.label + '.mp4'
          }
        }
      }));
      
      // Clean up output file only (keep input for reuse)
      ffmpeg.FS('unlink', outputFileName);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'completed', progress: 100} : f)
      );
      
      return true;
    } catch (error) {
      console.error('Error converting image:', error);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'failed', progress: 0} : f)
      );
      
      throw error;
    }
  }
  
  // Convert video to each selected format - optimized for speed
  async function convertVideo(fileObj, format) {
    try {
      const { ffmpeg, fetchFile } = { ffmpeg: ffmpegRef.current, fetchFile: fetchFileRef.current };
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'processing', progress: 0} : f)
      );
      
      // Get video data - only write once per file
      const inputFileName = `input_${fileObj.id}.mp4`;
      
      // Only write file if it doesn't exist yet
      if (!ffmpeg.FS('readdir', '/').includes(inputFileName)) {
        const videoData = await fetchFile(fileObj.file);
        ffmpeg.FS('writeFile', inputFileName, videoData);
      }
      
      // Determine scaling filter based on aspect ratio mode
      const scaleFilter = aspectRatioMode === 'crop'
        ? `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height}`
        : `scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease,pad=${format.width}:${format.height}:(ow-iw)/2:(oh-ih)/2`;
      
      // Setup output filename
      const outputFileName = `output_${fileObj.id}_${format.label}.mp4`;
      
      // Set progress callback
      const progressCallback = ({ ratio }) => {
        const percent = Math.round(ratio * 100);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? {...f, progress: percent} : f)
        );
      };
      
      ffmpeg.setProgress(progressCallback);
      
      // Build FFmpeg arguments with optimized settings
      const ffmpegArgs = ['-i', inputFileName];
      
      // Handle duration limiting
      if (limitDuration) {
        if (fileObj.duration < 10) {
          // For videos shorter than 10s, loop the last frame to reach 10s
          ffmpegArgs.push(
            '-filter_complex',
            `[0:v]${scaleFilter}[scaled];[scaled]tpad=stop_mode=clone:stop_duration=${(10 - fileObj.duration).toFixed(2)}[padded]`,
            '-map', '[padded]'
          );
        } else {
          // For longer videos, trim to 10s and apply scaling
          ffmpegArgs.push('-t', '10', '-vf', scaleFilter);
        }
      } else {
        // No duration limit, just apply scaling
        ffmpegArgs.push('-vf', scaleFilter);
      }
      
      // Add common parameters - optimized for speed
      ffmpegArgs.push(
        '-r', '25',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-profile:v', 'baseline',
        '-level', '3.0',
        '-movflags', '+faststart'
      );
      
      // Handle audio based on removeAudio setting
      if (removeAudio) {
        ffmpegArgs.push('-an');
      } else {
        ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');
      }
      
      // Add output format and filename
      ffmpegArgs.push('-f', 'mp4', outputFileName);
      
      // Run FFmpeg command
      await ffmpeg.run(...ffmpegArgs);
      
      // Read the result
      const data = ffmpeg.FS('readFile', outputFileName);
      
      // Create a blob
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Add to converted videos
      setConvertedVideos(prev => ({
        ...prev,
        [fileObj.id]: {
          ...(prev[fileObj.id] || {}),
          [format.label]: {
            blob,
            url,
            fileName: fileObj.name.replace(/\.[^/.]+$/, '') + '_' + format.label + '.mp4'
          }
        }
      }));
      
      // Clean up output file only (keep input for reuse)
      ffmpeg.FS('unlink', outputFileName);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'completed', progress: 100} : f)
      );
      
      return true;
    } catch (error) {
      console.error('Error converting video:', error);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'failed', progress: 0} : f)
      );
      
      throw error;
    }
  }
  
  // Create static video from video - optimized for speed
  async function createStaticVideo(fileObj, format) {
    try {
      const { ffmpeg, fetchFile } = { ffmpeg: ffmpegRef.current, fetchFile: fetchFileRef.current };
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'processing', progress: 0} : f)
      );
      
      // Get the selected frame time or use default
      const frameTime = frameSelections[fileObj.id] || (fileObj.duration * 0.25);
      
      // Get a frame from the video - reuse existing frame preview if possible
      const frameFileName = `frame_${fileObj.id}.jpg`;
      
      // Only extract the frame if not already done
      if (!ffmpeg.FS('readdir', '/').includes(frameFileName)) {
        let video = previewVideosRef.current[fileObj.id];
        let needsCleanup = false;
        
        if (!video) {
          // Create a new video element if none exists
          video = document.createElement('video');
          video.src = URL.createObjectURL(fileObj.file);
          needsCleanup = true;
          
          // Wait for video metadata
          await new Promise(resolve => {
            video.onloadedmetadata = resolve;
          });
        }
        
        // Set to the selected frame time
        video.currentTime = frameTime;
        
        // Wait for seek to complete
        await new Promise(resolve => {
          video.onseeked = resolve;
        });
        
        // Create a canvas with the selected frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to image data
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const response = await fetch(imageDataUrl);
        const frameBlob = await response.blob();
        const imageData = await fetchFile(frameBlob);
        
        // Clean up temporary video if created
        if (needsCleanup) {
          URL.revokeObjectURL(video.src);
        }
        
        // Write the frame to FFmpeg filesystem
        ffmpeg.FS('writeFile', frameFileName, imageData);
      }
      
      // Set up progress tracking
      const progressCallback = ({ ratio }) => {
        const percent = Math.round(ratio * 100);
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileObj.id ? {...f, progress: percent} : f)
        );
      };
      
      // Set progress tracker
      ffmpeg.setProgress(progressCallback);
      
      // Determine scaling filter based on aspect ratio mode
      const scaleFilter = aspectRatioMode === 'crop'
        ? `scale=${format.width}:${format.height}:force_original_aspect_ratio=increase,crop=${format.width}:${format.height}`
        : `scale=${format.width}:${format.height}:force_original_aspect_ratio=decrease,pad=${format.width}:${format.height}:(ow-iw)/2:(oh-ih)/2`;
      
      // Setup output filename
      const outputFileName = `output_${fileObj.id}_static_${format.label}.mp4`;
      
      // Run FFmpeg command for static video with optimized settings
      await ffmpeg.run(
        '-loop', '1',
        '-i', frameFileName,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-tune', 'stillimage',
        '-t', '10',
        '-vf', scaleFilter,
        '-r', '25',
        '-pix_fmt', 'yuv420p',
        '-an', // No audio
        '-f', 'mp4',
        outputFileName
      );
      
      // Read the result
      const data = ffmpeg.FS('readFile', outputFileName);
      
      // Create a blob
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // Add to converted videos
      setConvertedVideos(prev => ({
        ...prev,
        [fileObj.id]: {
          ...(prev[fileObj.id] || {}),
          [format.label]: {
            blob,
            url,
            fileName: fileObj.name.replace(/\.[^/.]+$/, '') + '_static_' + format.label + '.mp4',
            isStatic: true
          }
        }
      }));
      
      // Clean up output file only (keep frame for reuse)
      ffmpeg.FS('unlink', outputFileName);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'completed', progress: 100} : f)
      );
      
      return true;
    } catch (error) {
      console.error('Error creating static video:', error);
      
      // Update file status
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileObj.id ? {...f, status: 'failed', progress: 0} : f)
      );
      
      throw error;
    }
  }
  
  // Start batch conversion process
  const startConversion = async () => {
    const formats = availableFormats.filter(f => selectedFormats[f.label]);
    
    if (uploadedFiles.length === 0) {
      setStatusMessage('Please add files to convert');
      setStatusType('error');
      return;
    }
    
    if (formats.length === 0) {
      setStatusMessage('Please select at least one output format');
      setStatusType('error');
      return;
    }
    
    setIsConverting(true);
    setStatusMessage('Starting batch conversion...');
    setStatusType('info');
    
    // Clean up any existing files to avoid conflicts
    try {
      const files = ffmpegRef.current.FS('readdir', '/');
      for (const file of files) {
        if (file !== '.' && file !== '..') {
          try {
            ffmpegRef.current.FS('unlink', file);
          } catch (e) {
            // Ignore errors
          }
        }
      }
    } catch (e) {
      console.log('No files to clean up');
    }
    
    // Process each file
    try {
      for (const fileObj of uploadedFiles) {
        for (const format of formats) {
          if (fileObj.isImage) {
            await convertImageToVideo(fileObj, format);
          } else if (fileObj.makeStatic) {
            await createStaticVideo(fileObj, format);
          } else {
            await convertVideo(fileObj, format);
          }
        }
      }
      
      setStatusMessage('Conversion completed successfully!');
      setStatusType('success');
      setShowDownloads(true);
      
      // Add success animation
      const container = document.querySelector('.container');
      container.classList.add('conversion-complete');
      
      // Scroll to downloads section
      const downloadsSection = document.querySelector('.downloads-container');
      if (downloadsSection) {
        setTimeout(() => {
          downloadsSection.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
      
      // Remove animation class after animation completes
      setTimeout(() => {
        container.classList.remove('conversion-complete');
      }, 2000);
    } catch (error) {
      console.error('Error during conversion:', error);
      
      setStatusMessage('Error during conversion: ' + error.message);
      setStatusType('error');
    } finally {
      setIsConverting(false);
      
      // Clean up all temporary files after conversion
      try {
        const files = ffmpegRef.current.FS('readdir', '/');
        for (const file of files) {
          if (file !== '.' && file !== '..') {
            try {
              ffmpegRef.current.FS('unlink', file);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      } catch (e) {
        console.log('Error cleaning up temp files:', e);
      }
    }
  };
  
  // Download a converted video
  const downloadVideo = (fileId, formatLabel) => {
    const videoInfo = convertedVideos[fileId]?.[formatLabel];
    if (videoInfo) {
      const a = document.createElement('a');
      a.href = videoInfo.url;
      a.download = videoInfo.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  // Download all converted videos
  const downloadAllVideos = () => {
    if (Object.keys(convertedVideos).length === 0) {
      setStatusMessage('No converted videos to download');
      setStatusType('info');
      return;
    }
    
    setStatusMessage('Preparing downloads...');
    setStatusType('info');
    
    // Collect all videos
    const allVideos = [];
    Object.keys(convertedVideos).forEach(fileId => {
      Object.keys(convertedVideos[fileId]).forEach(formatLabel => {
        allVideos.push(convertedVideos[fileId][formatLabel]);
      });
    });
    
    // Download each with a delay to avoid browser issues
    allVideos.forEach((video, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = video.url;
        a.download = video.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        if (index === allVideos.length - 1) {
          setStatusMessage('All downloads initiated');
          setStatusType('success');
        }
      }, index * 1000); // 1 second delay between downloads
    });
  };
  
  // Handle thumbnail click to open preview
  const handleThumbnailClick = (file, e) => {
    e.stopPropagation(); // Prevent event from bubbling up
    if (!file.isImage) {
      openVideoPreview(file);
    }
  };
  
  // Render a single file item
  const renderFileItem = (file) => {
    const isProcessing = file.status === 'processing';
    const isCompleted = file.status === 'completed';
    const isFailed = file.status === 'failed';
    const showFrameSelector = !file.isImage && file.makeStatic;
    
    return (
      <div 
        key={file.id} 
        className={`file-item ${file.status}`}
      >
        <div className="file-header">
          {file.thumbnail && (
            <div className="file-thumbnail" onClick={(e) => handleThumbnailClick(file, e)}>
              <img src={file.thumbnail} alt={file.name} />
              
              {/* Video play indicator - improved with white circle background */}
              {!file.isImage && (
                <div className="play-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#4361ee" d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </div>
          )}
          
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-details">
              <span className="file-type">{file.isImage ? 'Image' : 'Video'}</span>
              <span className="file-dimensions">{file.width}x{file.height}</span>
              <span className="file-aspect-ratio">{file.aspectRatio}</span>
              {!file.isImage && file.duration > 0 && (
                <span className="file-duration">
                  {formatTime(file.duration)}
                </span>
              )}
              <span className="file-size">{formatFileSize(file.size)}</span>
            </div>
            
            {/* Modern static video toggle for video files */}
            {!file.isImage && (
              <div className="static-toggle-container">
                <button 
                  className={`static-toggle-btn ${file.makeStatic ? 'active' : ''}`}
                  onClick={(e) => toggleFileStatic(file.id, e)}
                  disabled={isConverting}
                  title={file.makeStatic ? "Using static frame (click to switch to regular video)" : "Create static video from single frame"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="static-icon">
                    <path fill="currentColor" d="M4 5h16v2H4z M4 11h16v2H4z M4 17h16v2H4z"/>
                  </svg>
                  <span>Static Frame</span>
                  <div className="toggle-switch">
                    <div className="toggle-switch-slider"></div>
                  </div>
                </button>
              </div>
            )}
          </div>
          
          <div className="file-actions">
            {/* Progress indicator */}
            {isProcessing && (
              <div className="file-progress">
                <div className="file-progress-bar">
                  <div 
                    className="file-progress-fill" 
                    style={{width: `${file.progress}%`}}
                  ></div>
                </div>
                <span className="file-progress-text">{file.progress}%</span>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="action-icons">              
              {/* Status indicators */}
              {isCompleted && (
                <span className="status-icon completed" title="Conversion completed">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <span>Done</span>
                </span>
              )}
              
              {isFailed && (
                <span className="status-icon failed" title="Conversion failed">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  <span>Failed</span>
                </span>
              )}
              
              <button 
                className="action-icon remove-btn"
                onClick={(e) => removeFile(file.id, e)}
                title="Remove file"
                disabled={isConverting}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
                <span>Remove</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Frame selection for videos when static is enabled */}
        {showFrameSelector && (
          <div className="frame-selection">
            <p>Select frame for static video:</p>
            <div className="frame-controls">
              <input 
                type="range" 
                className="frame-slider"
                min="0" 
                max="100" 
                value={frameSelections[file.id] ? (frameSelections[file.id] / file.duration) * 100 : 25}
                onChange={(e) => handleFrameSliderChange(file.id, e)}
                disabled={isConverting}
              />
              <div className="frame-time">
                <span>{formatTime(frameSelections[file.id])}</span> / 
                <span>{formatTime(file.duration)}</span>
              </div>
            </div>
            <div className="frame-preview-container">
              <canvas 
                ref={(el) => {
                  framePreviewsRef.current[file.id] = el;
                  if (el && file.makeStatic) {
                    // Load preview when the canvas is created and static is enabled
                    loadVideoPreview(file.id);
                  }
                }}
                width="320" 
                height={file && file.height ? (320 * (file.height / file.width)) : 180}
                className="frame-preview"
              ></canvas>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="container">
      <div className="header">
        <h1><span className="greeting-text">LT Advert video converter</span></h1>
      </div>
      
      {/* Upload area */}
      <div 
        className="upload-container" 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
                  <div className="upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="52" height="52">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="#888888"/>
            </svg>
          </div>
        <p>Drag & drop your videos or images here or click to browse</p>
        <p className="upload-subtitle">Select multiple files to batch convert</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="video/*,image/*" 
          multiple 
          style={{display: 'none'}} 
          onChange={handleFileUpload}
        />
      </div>
      
      {/* Status message */}
      {statusMessage && (
        <div className={`status ${statusType}`}>
          {statusMessage}
        </div>
      )}
      
      {/* File grid */}
      {uploadedFiles.length > 0 && (
        <div className="files-container">
          <div className="files-header">
            <h3>Files to Convert</h3>
            
            {uploadedFiles.length > 0 && (
              <div className="files-actions">
                <button className="action-btn" onClick={clearAllFiles} disabled={isConverting}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z"/>
                  </svg>
                  Clear All
                </button>
              </div>
            )}
          </div>
          
          <div className="files-grid">
            {uploadedFiles.map(renderFileItem)}
          </div>
        </div>
      )}
      
      {/* Format selection */}
      {uploadedFiles.length > 0 && (
        <div className="format-selection">
          <div className="conversion-options">
            <div className="option-group">
              <h3>Video Options:</h3>
              <div className="options-row">
                <label className="option-toggle">
                  <input 
                    type="checkbox" 
                    checked={removeAudio} 
                    onChange={() => setRemoveAudio(!removeAudio)}
                    disabled={isConverting}
                  />
                  <span>Remove Audio</span>
                </label>
                
                <label className="option-toggle">
                  <input 
                    type="checkbox" 
                    checked={limitDuration} 
                    onChange={() => setLimitDuration(!limitDuration)}
                    disabled={isConverting}
                  />
                  <span>Max 10 seconds</span>
                </label>
              </div>
              
              <div className="aspect-ratio-selector">
                <p>Aspect ratio handling:</p>
                <div className="radio-options">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="aspect-mode" 
                      checked={aspectRatioMode === 'crop'} 
                      onChange={() => setAspectRatioMode('crop')}
                      disabled={isConverting}
                    />
                    <span>Crop to fill frame</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="aspect-mode" 
                      checked={aspectRatioMode === 'pad'} 
                      onChange={() => setAspectRatioMode('pad')}
                      disabled={isConverting}
                    />
                    <span>Add black bars (letterbox)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <h3>Select output formats:</h3>
          <div className="format-options">
            {availableFormats.map(format => (
              <label 
                key={format.label} 
                className="format-option" 
                title={`Aspect ratio: ${format.aspectRatio}`}
              >
                <input 
                  type="checkbox" 
                  checked={!!selectedFormats[format.label]} 
                  onChange={() => toggleFormat(format.label)}
                  disabled={isConverting}
                />
                <span>{format.label}</span>
                <div className="format-tooltip">Aspect ratio: {format.aspectRatio}</div>
              </label>
            ))}
          </div>
          
          <button 
            className="btn" 
            onClick={startConversion}
            disabled={isConverting || !isFFmpegLoaded}
          >
            {isConverting ? 'Converting...' : 'Convert Selected Files'}
          </button>
        </div>
      )}
      
      {/* Overall progress bar */}
      {isConverting && (
        <div className="progress-container">
          <div className="progress-bar" style={{width: `${progress}%`}}></div>
        </div>
      )}
      
      {/* Downloads section */}
      {showDownloads && Object.keys(convertedVideos).length > 0 && (
        <div className="downloads-container">
          <h3>Download Converted Videos</h3>
          <div className="download-items">
            {Object.keys(convertedVideos).map(fileId => {
              const fileObj = uploadedFiles.find(f => f.id === fileId);
              if (!fileObj) return null;
              
              return (
                <div key={fileId} className="download-group">
                  <div className="download-group-header">
                    {fileObj.thumbnail && (
                      <div className="download-thumbnail">
                        <img src={fileObj.thumbnail} alt={fileObj.name} />
                      </div>
                    )}
                    <div className="download-info">
                      <strong className="download-filename">{fileObj.name}</strong>
                      <div className="download-details">
                        <span>{fileObj.width}x{fileObj.height}</span>
                        <span>{fileObj.isImage ? 'Image' : 'Video'}</span>
                        {!fileObj.isImage && fileObj.duration > 0 && (
                          <span>{formatTime(fileObj.duration)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="download-formats">
                    <h4>Available Formats:</h4>
                    <div className="download-buttons">
                      {Object.keys(convertedVideos[fileId]).map(formatLabel => {
                        const isStatic = convertedVideos[fileId][formatLabel].isStatic;
                        return (
                          <button 
                            key={formatLabel}
                            className={`download-btn ${isStatic ? 'static' : ''}`}
                            onClick={() => downloadVideo(fileId, formatLabel)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="download-icon">
                              <path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                            </svg>
                            <div className="download-btn-content">
                              <span className="download-format">{formatLabel}</span>
                              {isStatic && <span className="download-static-badge">Static</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            className="btn btn-download-all"
            onClick={downloadAllVideos}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" className="download-all-icon">
              <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
            </svg>
            Download All Videos
          </button>
        </div>
      )}
      
      {/* Video Preview Modal */}
      {showPreview && previewFile && (
        <div className="preview-modal">
          <div className="preview-content">
            <div className="preview-header">
              <h3>{previewFile.name}</h3>
              <button className="preview-close" onClick={closeVideoPreview}>×</button>
            </div>
            <div className="preview-body">
              <video 
                ref={videoPreviewRef}
                controls 
                autoPlay 
                className="preview-video"
                src={previewFile.videoUrl}
              ></video>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        :root {
          --bg-primary: #2A2A2A;
          --bg-secondary: #333333;
          --bg-tertiary: #3D3D3D;
          --bg-elevated: #404040;
          --bg-input: #444444;
          --bg-hover: #454545;
          
          --text-primary: #FFFFFF;
          --text-secondary: #CCCCCC;
          --text-tertiary: #999999;
          --text-placeholder: #777777;
          
          --border-light: #4A4A4A;
          --border-strong: #555555;
          
          --accent-primary: #58D8B8;
          --accent-primary-hover: #4ACAA9;
          --accent-secondary: #8C8C8C;
          --accent-success: #58D8B8;
          --accent-error: #EA5F5F;
          
          --shadow-light: 0 4px 12px rgba(0, 0, 0, 0.2);
          --shadow-medium: 0 8px 24px rgba(0, 0, 0, 0.3);
          
          --border-radius-sm: 6px;
          --border-radius-md: 12px;
          --border-radius-lg: 16px;
          --border-radius-xl: 24px;
          
          --transition-fast: all 0.15s ease;
          --transition-normal: all 0.25s ease;
          
          --font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        body {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: var(--font-family);
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
          transition: var(--transition-normal);
        }
        
        /* Base Container */
        .container {
          background-color: var(--bg-secondary);
          border-radius: var(--border-radius-lg);
          padding: 30px;
          box-shadow: var(--shadow-light);
        }
        
        /* Header */
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        h1 {
          font-size: 2.2rem;
          font-weight: 800; /* Bold */
          margin-bottom: 12px;
        }
        
        .greeting-text {
          background: linear-gradient(90deg, #CCCCCC, #FFFFFF);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          letter-spacing: -0.01em;
        }
        
        .emoji {
          color: initial; /* This ensures emojis use their original colors */
        }
        
        .subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          opacity: 0.8;
          margin-top: 0;
        }
        
        /* Upload Area */
        .upload-container {
          border: 2px dashed var(--border-light);
          border-radius: var(--border-radius-lg);
          padding: 40px 20px;
          text-align: center;
          margin: 30px 0;
          cursor: pointer;
          transition: var(--transition-normal);
          background-color: var(--bg-tertiary);
        }
        
        .upload-container:hover,
        .upload-container.drag-over {
          border-color: var(--accent-primary);
          background-color: rgba(88, 216, 184, 0.08);
        }
        
        .upload-icon {
          margin-bottom: 20px;
          color: var(--accent-primary);
        }
        
        .upload-subtitle {
          font-size: 0.9rem;
          color: var(--text-tertiary);
          margin-top: 10px;
        }
        
        /* Status Messages */
        .status {
          margin: 20px 0;
          padding: 16px;
          border-radius: var(--border-radius-md);
          text-align: center;
          font-weight: 500;
        }
        
        .status.info {
          background-color: rgba(79, 134, 198, 0.2);
          color: #81A4E8;
          border: 1px solid rgba(79, 134, 198, 0.3);
        }
        
        .status.success {
          background-color: rgba(88, 216, 184, 0.1);
          color: var(--accent-success);
          border: 1px solid rgba(88, 216, 184, 0.2);
        }
        
        .status.error {
          background-color: rgba(234, 95, 95, 0.1);
          color: var(--accent-error);
          border: 1px solid rgba(234, 95, 95, 0.2);
        }
        
        /* Contextual error and success messages */
        .upload-error, .upload-success, .upload-processing, .convert-error, .format-error {
          position: absolute;
          bottom: -45px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--bg-elevated);
          border-radius: var(--border-radius-md);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          box-shadow: var(--shadow-medium);
          animation: slideUp 0.3s ease;
          z-index: 10;
        }
        
        .upload-error, .convert-error, .format-error {
          color: var(--accent-error);
          border: 1px solid rgba(234, 95, 95, 0.3);
        }
        
        .upload-success {
          color: var(--accent-success);
          border: 1px solid rgba(88, 216, 184, 0.3);
        }
        
        .upload-processing {
          color: var(--text-primary);
          border: 1px solid var(--border-light);
        }
        
        .convert-error {
          bottom: -45px;
          top: auto;
        }
        
        .format-error {
          bottom: -45px;
          top: auto;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        /* Spinner animation */
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Conversion complete animation */
        .conversion-complete {
          animation: successPulse 2s ease;
        }
        
        .conversion-error {
          animation: errorPulse 2s ease;
        }
        
        @keyframes successPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(88, 216, 184, 0);
          }
          30% {
            box-shadow: 0 0 0 15px rgba(88, 216, 184, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(88, 216, 184, 0);
          }
        }
        
        @keyframes errorPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(234, 95, 95, 0);
          }
          30% {
            box-shadow: 0 0 0 15px rgba(234, 95, 95, 0.3);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(234, 95, 95, 0);
          }
        }
        
        /* Files Container */
        .files-container {
          margin: 30px 0;
          padding: 24px;
          background-color: var(--bg-tertiary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-light);
        }
        
        .files-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .files-header h3 {
          color: var(--text-primary);
          margin: 0;
          font-size: 1.2rem;
        }
        
        .files-actions {
          display: flex;
          gap: 10px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--border-radius-md);
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        
        .action-btn:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* File Grid */
        .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        /* File Items */
        .file-item {
          cursor: default;
          transition: var(--transition-normal);
          border: 1px solid var(--border-light);
          background-color: var(--bg-elevated);
          border-radius: var(--border-radius-md);
          overflow: hidden;
        }
        
        .file-item:hover {
          box-shadow: var(--shadow-medium);
          transform: translateY(-3px);
          border-color: var(--border-strong);
        }
        
        .file-item.processing {
          background-color: rgba(79, 134, 198, 0.08);
        }
        
        .file-item.completed {
          background-color: rgba(88, 216, 184, 0.08);
        }
        
        .file-item.failed {
          background-color: rgba(234, 95, 95, 0.08);
        }
        
        .file-header {
          padding: 16px;
        }
        
        /* Thumbnail */
        .file-thumbnail {
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border-radius: var(--border-radius-md);
          margin-bottom: 16px;
          aspect-ratio: 16/9;
          background-color: #222;
        }
        
        .file-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-normal);
        }
        
        .file-thumbnail:hover img {
          transform: scale(1.05);
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: rgba(20, 20, 20, 0.7);
          border-radius: 50%;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
          transition: var(--transition-fast);
          border: 2px solid rgba(255, 255, 255, 0.15);
        }
        
        .file-thumbnail:hover .play-icon {
          transform: translate(-50%, -50%) scale(1.1);
          background-color: rgba(20, 20, 20, 0.8);
          border-color: rgba(255, 255, 255, 0.25);
        }
        
        .play-icon svg {
          width: 24px;
          height: 24px;
          margin-left: 3px;
        }
        
        /* File Info */
        .file-info {
          margin-bottom: 16px;
        }
        
        .file-name {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--text-primary);
        }
        
        .file-details {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .file-type, .file-dimensions, .file-aspect-ratio, .file-duration, .file-size {
          font-size: 0.8rem;
          color: var(--text-secondary);
          background-color: var(--bg-tertiary);
          padding: 3px 8px;
          border-radius: var(--border-radius-sm);
        }
        
        /* Static Toggle */
        .static-toggle-container {
          margin: 16px 0;
        }
        
        .static-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: var(--border-radius-xl);
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition-fast);
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
          width: 100%;
        }
        
        .static-toggle-btn:hover {
          background-color: var(--bg-hover);
          border-color: var(--border-strong);
        }
        
        .static-toggle-btn.active {
          background-color: rgba(88, 216, 184, 0.15);
          border-color: rgba(88, 216, 184, 0.3);
          color: var(--accent-primary);
        }
        
        .static-icon {
          opacity: 0.7;
        }
        
        .static-toggle-btn.active .static-icon {
          opacity: 1;
        }
        
        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          width: 40px;
          height: 22px;
          border-radius: 20px;
          background-color: var(--bg-input);
          margin-left: auto;
          transition: var(--transition-fast);
          border: 1px solid var(--border-light);
        }
        
        .static-toggle-btn.active .toggle-switch {
          background-color: var(--accent-primary);
          border-color: rgba(249, 124, 102, 0.3);
        }
        
        .toggle-switch-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: var(--text-secondary);
          transition: var(--transition-fast);
        }
        
        .static-toggle-btn.active .toggle-switch-slider {
          transform: translateX(18px);
          background-color: white;
        }
        
        /* File Actions */
        .file-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .file-progress {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        
        .file-progress-bar {
          flex-grow: 1;
          height: 6px;
          background-color: var(--bg-input);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .file-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), #67EBC7);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .file-progress-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          min-width: 35px;
          text-align: right;
        }
        
        .action-icons {
          display: flex;
          gap: 8px;
        }
        
        .action-icon, .status-icon {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--bg-tertiary);
          color: var(--text-secondary);
          border: 1px solid var(--border-light);
          border-radius: var(--border-radius-md);
          padding: 6px 10px;
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        
        .action-icon:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        
        .remove-btn {
          color: var(--accent-error);
        }
        
        .remove-btn:hover {
          background-color: rgba(234, 95, 95, 0.1);
        }
        
        .status-icon.completed {
          color: var(--accent-success);
          background-color: rgba(88, 216, 184, 0.1);
          border-color: rgba(88, 216, 184, 0.2);
        }
        
        .status-icon.failed {
          color: var(--accent-error);
          background-color: rgba(234, 95, 95, 0.1);
          border-color: rgba(234, 95, 95, 0.2);
        }
        
        /* Frame Selection */
        .frame-selection {
          padding: 20px;
          background-color: var(--bg-tertiary);
          border-top: 1px solid var(--border-light);
          margin-top: 0;
          border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
        }
        
        .frame-selection p {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin-top: 0;
          margin-bottom: 12px;
        }
        
        .frame-controls {
          margin: 18px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .frame-slider {
          flex: 1;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--bg-input);
          border-radius: 4px;
          outline: none;
          overflow: hidden;
        }
        
        .frame-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-primary);
          cursor: pointer;
          border: 3px solid var(--bg-elevated);
          box-shadow: -405px 0 0 400px var(--accent-primary);
        }
        
        .frame-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent-primary);
          cursor: pointer;
          border: 3px solid var(--bg-elevated);
        }
        
        .frame-time {
          font-size: 0.85rem;
          color: var(--text-secondary);
          min-width: 80px;
          text-align: right;
        }
        
        .frame-preview-container {
          text-align: center;
          margin: 15px 0 5px;
        }
        
        .frame-preview {
          max-width: 100%;
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-light);
          background-color: #222;
        }
        
        /* Format Selection */
        .format-selection {
          margin: 30px 0;
          padding: 24px;
          background-color: var(--bg-tertiary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-light);
        }
        
        .format-selection h3 {
          color: var(--text-primary);
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.2rem;
          text-align: center;
        }
        
        .option-group {
          background-color: var(--bg-elevated);
          padding: 20px;
          border-radius: var(--border-radius-md);
          margin-bottom: 24px;
          border: 1px solid var(--border-light);
        }
        
        .option-group h3 {
          text-align: left;
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 1.1rem;
        }
        
        .options-row, .radio-options {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 18px;
        }
        
        .option-toggle, .radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text-secondary);
          transition: var(--transition-fast);
        }
        
        .option-toggle:hover, .radio-option:hover {
          color: var(--text-primary);
        }
        
        .option-toggle input[type="checkbox"], .radio-option input[type="radio"] {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          min-width: 20px;
          min-height: 20px;
          outline: none;
          cursor: pointer;
          position: relative;
          margin: 0;
          padding: 0;
          background-color: transparent;
          border: none;
        }
        
        .option-toggle input[type="checkbox"]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background-color: var(--bg-input);
          border: 2px solid var(--border-strong);
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        
        .radio-option input[type="radio"]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--bg-input);
          border: 2px solid var(--border-strong);
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        
        .option-toggle input[type="checkbox"]:checked::before, 
        .radio-option input[type="radio"]:checked::before {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
          transform: scale(1.05);
          box-shadow: 0 0 8px rgba(88, 216, 184, 0.5);
        }
        
        .option-toggle input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 7px;
          width: 5px;
          height: 10px;
          border: solid #333;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .radio-option input[type="radio"]:checked::after {
          content: "";
          position: absolute;
          top: 6px;
          left: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #333;
        }
        
        .option-toggle:hover input[type="checkbox"]::before,
        .radio-option:hover input[type="radio"]::before {
          border-color: var(--accent-primary);
        }
        
        .aspect-ratio-selector p {
          margin: 15px 0 8px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        /* Format Options */
        .format-options {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
        }
        
        .format-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background-color: var(--bg-elevated);
          border: 1px solid var(--border-light);
          border-radius: var(--border-radius-xl);
          cursor: pointer;
          transition: var(--transition-fast);
          position: relative;
        }
        
        .format-option:hover {
          transform: translateY(-2px);
          border-color: var(--border-strong);
          background-color: var(--bg-hover);
        }
        
        .format-option input[type="checkbox"] {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          min-width: 20px;
          min-height: 20px;
          outline: none;
          cursor: pointer;
          position: relative;
          margin: 0;
          padding: 0;
          background-color: transparent;
          border: none;
        }
        
        .format-option input[type="checkbox"]::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background-color: var(--bg-input);
          border: 2px solid var(--border-strong);
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        
        .format-option input[type="checkbox"]:checked::before {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
          transform: scale(1.05);
          box-shadow: 0 0 8px rgba(88, 216, 184, 0.5);
        }
        
        .format-option input[type="checkbox"]:checked::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 7px;
          width: 5px;
          height: 10px;
          border: solid #333;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .format-option:hover input[type="checkbox"]::before {
          border-color: var(--accent-primary);
        }
        
        .format-option span {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: var(--transition-fast);
        }
        
        .format-option:hover span {
          color: var(--text-primary);
        }
        
        .format-option input[type="checkbox"]:checked + span {
          color: var(--text-primary);
        }
        
        .format-tooltip {
          position: absolute;
          bottom: 120%;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--bg-elevated);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: var(--border-radius-md);
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: var(--transition-fast);
          pointer-events: none;
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-light);
        }
        
        .format-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -6px;
          border-width: 6px;
          border-style: solid;
          border-color: var(--bg-elevated) transparent transparent transparent;
        }
        
        .format-option:hover .format-tooltip {
          opacity: 1;
          visibility: visible;
        }
        
        /* Convert Button */
        .btn {
          background-color: var(--accent-primary);
          color: #333;
          font-weight: 700;
          border: none;
          padding: 14px 28px;
          border-radius: var(--border-radius-xl);
          font-size: 1rem;
          cursor: pointer;
          display: block;
          margin: 30px auto 0;
          transition: var(--transition-normal);
          box-shadow: 0 4px 12px rgba(88, 216, 184, 0.3);
        }
        
        .btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(88, 216, 184, 0.4);
          background-color: var(--accent-primary-hover);
        }
        
        .btn:disabled {
          background: linear-gradient(90deg, #777, #999);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          opacity: 0.7;
        }
        
        /* Progress Bar */
        .progress-container {
          width: 100%;
          height: 10px;
          background-color: var(--bg-input);
          border-radius: var(--border-radius-xl);
          margin-top: 30px;
          overflow: hidden;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-primary), #67EBC7);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        /* Downloads Section */
        .downloads-container {
          margin-top: 40px;
          padding: 28px;
          background-color: var(--bg-tertiary);
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-light);
        }
        
        .downloads-container h3 {
          color: var(--text-primary);
          text-align: center;
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 1.3rem;
        }
        
        .download-items {
          margin: 20px 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .download-group {
          background-color: var(--bg-elevated);
          border-radius: var(--border-radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
          transition: var(--transition-normal);
        }
        
        .download-group:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-medium);
          border-color: var(--border-strong);
        }
        
        .download-group-header {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid var(--border-light);
        }
        
        .download-thumbnail {
          width: 80px;
          height: 60px;
          overflow: hidden;
          border-radius: var(--border-radius-sm);
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .download-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .download-info {
          flex: 1;
        }
        
        .download-filename {
          font-size: 1rem;
          display: block;
          margin-bottom: 8px;
          color: var(--text-primary);
        }
        
        .download-details {
          display: flex;
          gap: 10px;
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }
        
        .download-formats {
          padding: 16px;
        }
        
        .download-formats h4 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        .download-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .download-btn {
          background-color: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: var(--border-radius-md);
          padding: 10px 14px;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-fast);
        }
        
        .download-btn:hover {
          background-color: var(--bg-hover);
          transform: translateY(-2px);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        
        .download-btn.static {
          background-color: rgba(88, 216, 184, 0.08);
          color: var(--accent-primary);
          border-color: rgba(88, 216, 184, 0.15);
        }
        
        .download-btn.static:hover {
          background-color: rgba(88, 216, 184, 0.12);
          border-color: rgba(88, 216, 184, 0.25);
        }
        
        .download-icon {
          opacity: 0.8;
        }
        
        .download-btn-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }
        
        .download-format {
          font-weight: 500;
        }
        
        .download-static-badge {
          font-size: 0.7rem;
          background-color: var(--accent-primary);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .btn-download-all {
          background: linear-gradient(90deg, var(--accent-primary), #6BC6B0);
          border-radius: var(--border-radius-xl);
          box-shadow: 0 4px 12px rgba(107, 198, 176, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          transition: var(--transition-normal);
          margin-top: 30px;
        }
        
        .btn-download-all:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(107, 198, 176, 0.4);
        }
        
        /* Preview Modal */
        .preview-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 15, 15, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .preview-content {
          background-color: var(--bg-secondary);
          width: 90%;
          max-width: 900px;
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          border: 1px solid var(--border-strong);
          box-shadow: var(--shadow-medium);
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
          background-color: var(--bg-tertiary);
        }
        
        .preview-header h3 {
          margin: 0;
          text-align: left;
          font-size: 1.1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-primary);
        }
        
        .preview-close {
          background: var(--bg-elevated);
          border: 1px solid var(--border-light);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-fast);
          color: var(--text-secondary);
          font-size: 20px;
        }
        
        .preview-close:hover {
          background-color: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        
        .preview-body {
          padding: 24px;
          overflow: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          background-color: #222;
        }
        
        .preview-video {
          width: 100%;
          max-height: 70vh;
          border-radius: var(--border-radius-md);
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .container {
            padding: 24px 16px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .upload-container {
            padding: 24px 16px;
          }
          
          .files-grid, .download-items {
            grid-template-columns: 1fr;
          }
          
          .files-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
          
          .preview-content {
            width: 95%;
          }
          
          .format-options {
            flex-direction: column;
            align-items: stretch;
          }
        }
        
        @media (max-width: 480px) {
          .download-group-header {
            flex-direction: column;
          }
          
          .download-thumbnail {
            width: 100%;
            margin-right: 0;
            margin-bottom: 12px;
            height: 120px;
          }
          
          .download-details {
            flex-direction: column;
            gap: 5px;
          }
        }
      `}</style>
    </div>
  );
}