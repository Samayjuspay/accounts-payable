import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { fileUploadUtils } from '../../utils/fileUpload';
import { toast } from 'sonner';

const QuoteUploadWidget = ({ onFileProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file) => {
    setError(null);
    setSelectedFile(file);

    const validation = fileUploadUtils.validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      toast.error(validation.error);
      return;
    }

    setIsUploading(true);

    try {
      const result = await fileUploadUtils.uploadFile(file);
      
      if (result.success && result.data) {
        toast.success('Quote analyzed successfully!');
        onFileProcessed(result.data, result.fileUrl, file.name);
      } else {
        throw new Error(result.error || 'Failed to process document');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.xlsx,.xls,.csv,.eml,.msg';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    };
    input.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📧 Quick Import from Quote</h2>
        <p className="text-gray-600">Upload vendor quote (PDF, Email, Excel) to auto-fill the form</p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'bg-blue-50 border-blue-400'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        } ${isUploading ? 'pointer-events-none' : ''}`}
      >
        {isUploading ? (
          <div className="py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-lg font-medium text-gray-900 mb-2">Analyzing quote with AI...</p>
            <p className="text-sm text-gray-600">This may take 10-30 seconds</p>
          </div>
        ) : selectedFile ? (
          <div className="py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">{selectedFile.name}</p>
            <p className="text-sm text-gray-600 mb-4">{fileUploadUtils.formatFileSize(selectedFile.size)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Remove and try another file
            </button>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Upload className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Drop vendor quote here or click to upload</p>
            <p className="text-sm text-gray-600 mb-4">PDF, Excel, or Email files • Max 10MB</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <FileText className="w-4 h-4" />
                PDF
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Excel
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Email
              </span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteUploadWidget;