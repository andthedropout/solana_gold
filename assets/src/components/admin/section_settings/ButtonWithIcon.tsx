import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ButtonContent } from './buttonSchemas';
import { getIconComponent } from './iconUtils';
import { normalizeUrl, isExternalUrl } from './urlUtils';

interface ButtonWithIconProps {
  cta: ButtonContent;
  className?: string;
}

export const ButtonWithIcon: React.FC<ButtonWithIconProps> = ({ cta, className }) => {
  // Don't render if button is not visible
  if (!cta.visible) {
    return null;
  }

  const renderButtonContent = () => {
    const IconComponent = getIconComponent(cta.icon);
    const icon = IconComponent ? <IconComponent className="h-4 w-4" /> : null;
    const isIconOnly = cta.size === 'icon';
    
    if (isIconOnly) {
      return icon;
    }
    
    if (cta.iconPosition === 'left') {
      return (
        <>
          {icon}
          {cta.text}
        </>
      );
    }
    
    return (
      <>
        {cta.text}
        {icon}
      </>
    );
  };

  const buttonClassName = `${cta.size === 'icon' ? '' : 'px-8'} ${className || ''}`;

  return (
    <Button 
      size={cta.size as any}
      variant={cta.variant as any}
      className={buttonClassName}
      asChild
    >
      {isExternalUrl(cta.url) ? (
        <a href={normalizeUrl(cta.url)} target="_blank" rel="noopener noreferrer">
          {renderButtonContent()}
        </a>
      ) : (
        <Link to={normalizeUrl(cta.url)}>
          {renderButtonContent()}
        </Link>
      )}
    </Button>
  );
}; 