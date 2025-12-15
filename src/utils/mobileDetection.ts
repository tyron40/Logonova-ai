export const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

export const canUseWebShare = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

export const shareImage = async (imageUrl: string, title: string): Promise<boolean> => {
  if (!canUseWebShare()) {
    return false;
  }

  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const file = new File([blob], `${title}.png`, { type: 'image/png' });

    await navigator.share({
      title: `${title} Logo`,
      text: `Check out my ${title} logo!`,
      files: [file],
    });

    return true;
  } catch (error) {
    console.log('Share failed or was cancelled:', error);
    return false;
  }
};

export const downloadImageMobile = (imageUrl: string): void => {
  window.open(imageUrl, '_blank');
};
