import { documentParsingService } from '../services/documentParsingService';

export const fileUploadUtils = {
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File too large. Maximum size is 10MB.' };
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'message/rfc822',
      'application/vnd.ms-outlook'
    ];

    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type. Please upload PDF, Excel, or Email.' };
    }

    return { valid: true };
  },

  getFileIcon(fileType) {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) return '📊';
    if (fileType.includes('email') || fileType.includes('outlook') || fileType.includes('message')) return '📧';
    return '📎';
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  getFileName(file) {
    return file.name;
  },

  getFileExtension(file) {
    return file.name.split('.').pop().toLowerCase();
  },

  isSupportedFile(file) {
    const validation = this.validateFile(file);
    return validation.valid;
  },

  async uploadFile(file) {
    try {
      const result = await documentParsingService.processDocument(file);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};