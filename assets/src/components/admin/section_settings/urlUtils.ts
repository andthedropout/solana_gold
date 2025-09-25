export const normalizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.startsWith('http://') || 
      trimmed.startsWith('https://') || 
      trimmed.startsWith('mailto:') || 
      trimmed.startsWith('tel:')) {
    return trimmed;
  }
  
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  
  if (trimmed.includes('.') || trimmed.startsWith('www.')) {
    return `https://${trimmed}`;
  }
  
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const isExternalUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  const normalized = normalizeUrl(url);
  return normalized.startsWith('http://') || 
         normalized.startsWith('https://') || 
         normalized.startsWith('mailto:') || 
         normalized.startsWith('tel:');
}; 