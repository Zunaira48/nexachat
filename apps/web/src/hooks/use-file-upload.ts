'use client';

import { useState } from 'react';
import { authedFetch } from '@/lib/api';

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export function useFileUpload(conversationId: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const { uploadUrl, key, publicUrl } = await authedFetch<UploadUrlResponse>(
        `/api/conversations/${conversationId}/attachments/request-upload`,
        {
          method: 'POST',
          body: JSON.stringify({ fileName: file.name, mimeType: file.type, size: file.size }),
        },
      );

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error('Upload to storage failed');

      await authedFetch(`/api/conversations/${conversationId}/attachments/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          publicUrl,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadFile, isUploading, error };
}