import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Accordion.css';

interface AccordionItem {
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
}) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const handleToggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes((prev) => (prev.includes(index) ? [] : [index]));
    }
  };

  return (
    <div className="accordion">
      {items.map((item, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <div key={idx} className={`accordion-item ${isOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="accordion-trigger"
              onClick={() => handleToggle(idx)}
              aria-expanded={isOpen}
            >
              <span className="accordion-title">{item.title}</span>
              <ChevronDown size={18} className="accordion-icon" />
            </button>
            <div className="accordion-content-wrapper">
              <div className="accordion-content">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default Accordion;
