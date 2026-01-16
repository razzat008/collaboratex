
import React from 'react';
import { FileText } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-base' },
    md: { box: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { box: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-2xl' }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizes[size].box} bg-blue-600 rounded flex items-center justify-center`}>
        <FileText className={`text-white ${sizes[size].icon}`} />
      </div>
      <span className={`font-bold tracking-tight text-slate-900 ${sizes[size].text}`}>Collaboratex</span>
    </div>
  );
};

export default BrandLogo;
