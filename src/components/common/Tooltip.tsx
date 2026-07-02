import React, { useState } from 'react';
import './Tooltip.css';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  children,
}) => {
  const [active, setActive] = useState(false);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {children}
      {active && (
        <div className={`tooltip-tip tooltip-${position} glass`}>
          {content}
        </div>
      )}
    </div>
  );
};
export default Tooltip;
