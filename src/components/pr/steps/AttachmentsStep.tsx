import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Attachment } from '../../../types/pr.types';
import { Upload, FileText, X, Download, Eye, Edit3, Trash2, AlertCircle, CheckCircle2, File, Image as ImageIcon, FileArchive } from 'lucide-react';

export const AttachmentsStep: React.FC = () => {
  const { watch, setValue } = useFormContext<PRFormData>();
  const attachments = watch('attachments') || [];
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const newAttachments: Attachment[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      category: 'Other'
    }));

    // Limit to 10 files
    const updated = [...attachments, ...newAttachments].slice(0, 10);
    setValue('attachments', updated);
  };

  const removeAttachment = (id: string) => {
    setValue('attachments', attachments.filter(a => a.id !== id));
  };

  const updateCategory = (id: string, category: Attachment['category']) => {
    setValue('attachments', attachments.map(a => a.id === id ? { ...a, category } : a));
  };

  const updateDescription = (id: string, description: string) => {
    setValue('attachments', attachments.map(a => a.id === id ? { ...a, description } : a));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('zip')) return <FileArchive className="w-5 h-5 text-amber-500" />;
    return <File className="w-5 h-5 text-zinc-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Attachments & Documentation</h2>
        <p className="text-sm text-zinc-500 mt-1">Upload quotes, specifications, or any other relevant documents.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative p-12 border-2 border-dashed rounded-3xl transition-all text-center space-y-4 ${
          isDragging 
            ? 'border-blue-600 bg-blue-50/50 ring-8 ring-blue-50' 
            : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300'
        }`}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFiles(Array.from(e.target.files || []))}
        />
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-center mx-auto">
          <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-zinc-400'}`} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-zinc-900">Click or drag files to upload</h3>
          <p className="text-sm text-zinc-500">Support PDF, DOC, XLS, ZIP and Images (Max 10MB each)</p>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Max 10 Files</span>
          <div className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>Encrypted Storage</span>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Uploaded Files ({attachments.length}/10)</h3>
            <button 
              type="button" 
              onClick={() => setValue('attachments', [])}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Remove All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {attachments.map((file) => (
              <div key={file.id} className="group bg-white border border-zinc-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-zinc-900 truncate pr-4">{file.name}</div>
                      <div className="flex items-center gap-1">
                        <button type="button" className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeAttachment(file.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{formatSize(file.size)}</span>
                      <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Category</label>
                        <select
                          value={file.category}
                          onChange={(e) => updateCategory(file.id, e.target.value as any)}
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-bold text-zinc-700 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        >
                          <option>Vendor Quote</option>
                          <option>Product Spec</option>
                          <option>Approval Docs</option>
                          <option>Comparison</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Description (Optional)</label>
                        <input
                          type="text"
                          value={file.description || ''}
                          onChange={(e) => updateDescription(file.id, e.target.value)}
                          placeholder="Add a brief note..."
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-medium text-zinc-700 focus:ring-2 focus:ring-blue-500/10 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
        <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
          <AlertCircle className="w-4 h-4" />
        </div>
        <p className="text-xs text-blue-700 leading-relaxed">
          Ensure all quotes are in PDF format and clearly show the vendor name, 
          tax details, and validity period. For IT hardware, product specifications 
          are mandatory.
        </p>
      </div>
    </div>
  );
};
