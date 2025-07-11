import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const PageBackHeader = ({ to, label }) => (
  <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 bg-white/80" style={{minHeight: '48px'}}>
    <Link to={to} className="flex items-center text-slate-500 hover:text-slate-700 transition-colors text-base font-medium">
      <ArrowLeftIcon className="w-5 h-5 mr-1" />
      {label}
    </Link>
    <div className="h-6 border-l border-slate-200 mx-3" />
  </div>
);

export default PageBackHeader; 