import { supabase } from '../lib/supabase';

export interface DocumentRecord {
  id: string;
  fileName: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  fileSize: string;
  fileType: string;
  storagePath: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface DbDocument {
  id: string;
  file_name: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  file_size: string;
  file_type: string;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

function mapDbDoc(row: DbDocument): DocumentRecord {
  return {
    id: row.id,
    fileName: row.file_name,
    title: row.title,
    category: row.category,
    description: row.description,
    tags: row.tags,
    fileSize: row.file_size,
    fileType: row.file_type,
    storagePath: row.storage_path,
    uploadedBy: row.uploaded_by ?? 'Unknown',
    uploadedAt: row.uploaded_at,
  };
}

/**
 * Fetch all documents from DB.
 */
export async function getDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false })
    .returns<DbDocument[]>();

  if (error) {
    console.error('Failed to fetch documents:', error.message);
    return [];
  }

  return (data ?? []).map(mapDbDoc);
}

/**
 * Upload a file to Supabase Storage and insert a metadata row.
 */
export async function uploadDocument(
  file: File,
  meta: { title: string; category: string; description: string; tags: string[] },
): Promise<DocumentRecord | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const storagePath = `${Date.now()}-${file.name}`;

  // Upload to Storage bucket "documents"
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file);

  if (storageError) {
    console.error('Storage upload failed:', storageError.message);
    return null;
  }

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);

  // Get current user id
  const { data: { user } } = await supabase.auth.getUser();

  // Insert metadata row
  const { data, error } = await supabase
    .from('documents')
    .insert({
      file_name: file.name,
      title: meta.title,
      category: meta.category,
      description: meta.description,
      tags: meta.tags,
      file_size: `${sizeMB} MB`,
      file_type: ext,
      storage_path: storagePath,
      uploaded_by: user?.id ?? null,
    })
    .select()
    .single<DbDocument>();

  if (error) {
    console.error('Document metadata insert failed:', error.message);
    return null;
  }

  return mapDbDoc(data);
}

/**
 * Download a document from Supabase Storage.
 */
export async function downloadDocument(storagePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);

  if (error || !data) {
    console.error('Download failed:', error?.message);
    return;
  }

  // Trigger browser download
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Delete a document from Storage and DB.
 */
export async function deleteDocument(id: string, storagePath: string): Promise<boolean> {
  // Delete from storage
  if (storagePath) {
    await supabase.storage.from('documents').remove([storagePath]);
  }

  // Delete metadata row
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) {
    console.error('Document delete failed:', error.message);
    return false;
  }

  return true;
}
