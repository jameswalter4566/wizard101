import { supabase } from '../integrations/supabase/client';

interface ImageConfig {
  bucketName?: string;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

export class ImageLoader {
  private static cache = new Map<string, string>();

  /**
   * Load image from Supabase storage with automatic optimization
   */
  static async loadFromSupabase(
    path: string, 
    config: ImageConfig = {}
  ): Promise<string> {
    const { bucketName = 'game-assets', transform } = config;
    const cacheKey = `${bucketName}:${path}:${JSON.stringify(transform)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Get public URL with transformations
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path, {
          transform: transform ? {
            width: transform.width,
            height: transform.height,
            quality: transform.quality || 80,
          } : undefined
        });

      if (data?.publicUrl) {
        this.cache.set(cacheKey, data.publicUrl);
        return data.publicUrl;
      }

      throw new Error('Failed to get public URL');
    } catch (error) {
      console.error('Error loading image from Supabase:', error);
      return '';
    }
  }

  /**
   * Preload image for faster display
   */
  static preload(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload: ${url}`));
      img.src = url;
    });
  }

  /**
   * Generate blur data URL for placeholder
   */
  static async generateBlurPlaceholder(url: string): Promise<string> {
    // This would typically be done server-side
    // For now, return a generic blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'; // truncated
  }
}