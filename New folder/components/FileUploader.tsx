
import React, { useCallback, useState, useRef } from 'react';

interface FileUploaderProps {
  onFile: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFile }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFile]);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFile(e.target.files[0]);
    }
  };

  const dragClass = isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600';

  return (
    <div className="w-full p-4">
      <div 
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`flex justify-center items-center w-full h-80 px-6 py-10 border-4 border-dashed ${dragClass} rounded-2xl cursor-pointer transition-all duration-300 text-center`}
      >
        <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
        />
        <div className="space-y-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          <h2 className="text-2xl font-bold text-white">اسحب وأفلت ملف الإكسل هنا</h2>
          <p>أو <span className="font-semibold text-cyan-400">انقر للاختيار</span></p>
          <p className="text-xs">الملفات المدعومة: XLSX, XLS</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
