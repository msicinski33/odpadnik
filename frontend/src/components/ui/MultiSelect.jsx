import React, { useRef, useState } from "react";

export default function MultiSelect({ options, value, onChange, placeholder = "Wybierz...", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggleOption = (option) => {
    if (value.includes(option.value)) {
      onChange(value.filter(v => v !== option.value));
    } else {
      onChange([...value, option.value]);
    }
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={ref} className={`relative ${className}`} tabIndex={0}>
      <div
        className="border rounded px-3 py-2 bg-white min-h-[38px] flex flex-wrap gap-1 items-center cursor-pointer focus:ring-2 focus:ring-blue-400"
        onClick={() => setOpen((v) => !v)}
        style={{ minHeight: 38 }}
      >
        {value.length === 0 && (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {options.filter(opt => value.includes(opt.value)).map(opt => (
              <span key={opt.value} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs flex items-center">
                {opt.label}
                <button
                  className="ml-1 text-blue-600 hover:text-red-500 focus:outline-none"
                  onClick={e => { e.stopPropagation(); onChange(value.filter(v => v !== opt.value)); }}
                  tabIndex={-1}
                  aria-label={`Usuń ${opt.label}`}
                >×</button>
              </span>
            ))}
            <button
              className="ml-2 text-xs text-gray-500 hover:text-red-500"
              onClick={clearAll}
              tabIndex={-1}
              aria-label="Wyczyść wszystko"
            >Wyczyść</button>
          </div>
        )}
        <span className="ml-auto text-gray-400 text-xs">▼</span>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
          {options.length === 0 && (
            <div className="p-2 text-gray-400 text-sm">Brak opcji</div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center ${value.includes(opt.value) ? "bg-blue-100" : ""}`}
              onClick={e => { e.stopPropagation(); toggleOption(opt); }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                readOnly
                className="mr-2"
              />
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 