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
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 min-h-[44px] bg-white/50 border border-black/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d9b3ff] flex items-center justify-between text-left transition-colors"
      >
        <span className="text-slate-800 text-sm sm:text-base truncate mr-2">{selectedLabel}</span>
        <FiChevronDown className={`flex-shrink-0 h-5 w-5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto">
          <div className="py-1">
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left block px-4 py-3 sm:py-2 text-sm text-slate-700 hover:bg-[#d9b3ff]/20 active:bg-[#d9b3ff]/40 transition-colors ${
                  option.value === selectedValue ? 'bg-[#d9b3ff]/30 font-semibold text-[#5c2799]' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
