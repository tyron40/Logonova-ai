import { supabase } from './supabase';
import { storageService } from './storageService';
import { LogoConfig, GeneratedLogo } from '../types';

export class LogoService {
  private static instance: LogoService;

  static getInstance(): LogoService {
    if (!LogoService.instance) {
      LogoService.instance = new LogoService();
    }
    return LogoService.instance;
  }

  async saveLogo(logo: LogoConfig, userId: string): Promise<void> {
    try {
      const generatedLogosWithPermanentUrls: GeneratedLogo[] = [];

      for (const generatedLogo of logo.generatedLogos) {
        try {
          const permanentUrl = await storageService.uploadLogoImage(
            generatedLogo.imageUrl,
            userId,
            logo.companyName
          );

          generatedLogosWithPermanentUrls.push({
            ...generatedLogo,
            imageUrl: permanentUrl
          });
        } catch (error) {
          console.error('Error uploading logo image:', error);
          generatedLogosWithPermanentUrls.push(generatedLogo);
        }
      }

      let selectedLogoWithPermanentUrl = logo.selectedLogo;
      if (logo.selectedLogo) {
        const uploadedVersion = generatedLogosWithPermanentUrls.find(
          l => l.id === logo.selectedLogo?.id
        );
        if (uploadedVersion) {
          selectedLogoWithPermanentUrl = uploadedVersion;
        }
      }

      const { error } = await supabase
        .from('saved_logos')
        .upsert({
          id: logo.id,
          user_id: userId,
          company_name: logo.companyName,
          industry: logo.industry,
          style: logo.style,
          color_scheme: logo.colorScheme,
          description: logo.description || '',
          keywords: logo.keywords || [],
          generated_logos: generatedLogosWithPermanentUrls,
          selected_logo: selectedLogoWithPermanentUrl,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database save error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving logo:', error);
      throw error;
    }
  }

  async loadLogos(userId: string): Promise<LogoConfig[]> {
    try {
      const { data, error } = await supabase
        .from('saved_logos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database load error:', error);
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        companyName: row.company_name,
        industry: row.industry,
        style: row.style,
        colorScheme: row.color_scheme,
        description: row.description || '',
        keywords: row.keywords || [],
        generatedLogos: row.generated_logos || [],
        selectedLogo: row.selected_logo || null,
        createdAt: new Date(row.created_at)
      }));
    } catch (error) {
      console.error('Error loading logos:', error);
      return [];
    }
  }

  async deleteLogo(logoId: string, userId: string): Promise<void> {
    try {
      const { data: logo } = await supabase
        .from('saved_logos')
        .select('generated_logos')
        .eq('id', logoId)
        .eq('user_id', userId)
        .maybeSingle();

      if (logo && logo.generated_logos) {
        for (const generatedLogo of logo.generated_logos) {
          if (generatedLogo.imageUrl) {
            try {
              await storageService.deleteLogoImage(generatedLogo.imageUrl);
            } catch (error) {
              console.error('Error deleting image from storage:', error);
            }
          }
        }
      }

      const { error } = await supabase
        .from('saved_logos')
        .delete()
        .eq('id', logoId)
        .eq('user_id', userId);

      if (error) {
        console.error('Database delete error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      throw error;
    }
  }
}

export const logoService = LogoService.getInstance();
