import { supabase } from './supabase';

export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadLogoImage(imageUrl: string, userId: string, companyName: string): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const fileExt = 'png';
      const fileName = `${userId}/${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo to storage:', error);
      throw error;
    }
  }

  async deleteLogoImage(imageUrl: string): Promise<void> {
    try {
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/logos/');
      if (pathParts.length < 2) return;

      const filePath = pathParts[1];

      const { error } = await supabase.storage
        .from('logos')
        .remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
      }
    } catch (error) {
      console.error('Error deleting logo from storage:', error);
    }
  }
}

export const storageService = StorageService.getInstance();
