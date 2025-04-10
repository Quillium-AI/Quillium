import React from 'react';
import { useTheme } from 'next-themes';

interface QuickActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
  textColor: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  subtitle,
  bgColor,
  textColor
}) => {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`p-4 rounded-xl border ${
        theme === 'dark' 
          ? 'border-gray-700 bg-gray-800' 
          : 'border-gray-200 bg-white'
      } hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full ${
          theme === 'dark' ? 'bg-opacity-20' : ''
        } ${bgColor} flex items-center justify-center ${textColor}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
        {subtitle}
      </div>
    </div>
  );
};

export default QuickActionCard;