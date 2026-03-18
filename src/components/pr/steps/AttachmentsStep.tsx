import React, { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { PRFormData, Attachment } from '../../../types/pr.types';
import { Upload, FileText, Download, Eye, Trash2, AlertCircle, File, Image as ImageIcon, FileArchive } from 'lucide-react';
import {
  Button as BlendButton,
  ButtonSize as BlendButtonSize,
  ButtonType as BlendButtonType,
  SingleSelect as BlendSingleSelect,
  TextInput as BlendTextInput,
  TextInputSize as BlendTextInputSize,
} from '@juspay/blend-design-system';

const ATTACHMENT_CATEGORY_ITEMS = [
  {
    items: [
      { label: 'Vendor Quote', value: 'Vendor Quote' },
      { label: 'Product Spec', value: 'Product Spec' },
      { label: 'Approval Docs', value: 'Approval Docs' },
      { label: 'Comparison', value: 'Comparison' },
      { label: 'Other', value: 'Other' },
    ],
  },
];

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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">Attachments & Documentation</h2>
        <p className="text-sm text-zinc-500 mt-1">Upload quotes, specifications, or any other relevant documents.</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative p-12 border-2 border-dashed rounded-3xl transition-all text-center space-y-4 ${
          isDragging 
            ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-100' 
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
          <h3 className="text-lg font-semibold text-zinc-900">Click or drag files to upload</h3>
          <p className="text-sm text-zinc-500">Support PDF, DOC, XLS, ZIP and Images (Max 10MB each)</p>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
          <span>Max 10 Files</span>
          <div className="w-1 h-1 bg-zinc-300 rounded-full" />
          <span>Encrypted Storage</span>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Uploaded Files ({attachments.length}/10)</h3>
            <BlendButton
              onClick={() => setValue('attachments', [])}
              buttonType={BlendButtonType.SECONDARY}
              size={BlendButtonSize.SMALL}
              text="Remove All"
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {attachments.map((file) => (
              <div key={file.id} className="group bg-white border border-zinc-200 rounded-2xl p-4 hover:border-blue-200 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-zinc-50 rounded-xl">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-zinc-900 truncate pr-4">{file.name}</div>
                      <div className="flex items-center gap-1">
                        <BlendButton
                          buttonType={BlendButtonType.SECONDARY}
                          size={BlendButtonSize.SMALL}
                          text="View"
                          leadingIcon={<Eye className="w-4 h-4" />}
                        />
                        <BlendButton
                          buttonType={BlendButtonType.SECONDARY}
                          size={BlendButtonSize.SMALL}
                          text="Download"
                          leadingIcon={<Download className="w-4 h-4" />}
                        />
                        <BlendButton
                          onClick={() => removeAttachment(file.id)}
                          buttonType={BlendButtonType.SECONDARY}
                          size={BlendButtonSize.SMALL}
                          text="Remove"
                          leadingIcon={<Trash2 className="w-4 h-4" />}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{formatSize(file.size)}</span>
                      <div className="w-1 h-1 bg-zinc-300 rounded-full" />
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <BlendSingleSelect
                        label="Category"
                        placeholder="Select category"
                        items={ATTACHMENT_CATEGORY_ITEMS}
                        selected={file.category}
                        onSelect={(value) => updateCategory(file.id, value as Attachment['category'])}
                        fullWidth
                      />
                      <BlendTextInput
                        value={file.description || ''}
                        onChange={(event) => updateDescription(file.id, event.target.value)}
                        placeholder="Add a brief note..."
                        label="Description (Optional)"
                        size={BlendTextInputSize.MEDIUM}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-2xl flex gap-3 items-start">
        <div className="p-1.5 bg-white rounded-lg text-zinc-600">
          <AlertCircle className="w-4 h-4" />
        </div>
        <p className="text-xs text-zinc-700 leading-relaxed">
          Ensure all quotes are in PDF format and clearly show the vendor name, 
          tax details, and validity period. For IT hardware, product specifications 
          are mandatory.
        </p>
      </div>
    </div>
  );
};
