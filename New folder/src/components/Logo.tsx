
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={className || ''}>
      <h1 className="text-5xl font-bold text-white interactive-text-glow text-center">
        شركة السحابة
      </h1>
    </div>
  );
};

export default Logo;