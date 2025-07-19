'use client';

import { useState, useRef, useEffect, FC } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface CustomDropdownProps {
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const CustomDropdown: FC<CustomDropdownProps> = ({ options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9b3ff] flex items-center justify-between text-left"
      >
        <span className="text-slate-800">{selectedLabel}</span>
        <FiChevronDown className={`ml-2 h-5 w-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-slate-200">
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className="w-full text-left block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;