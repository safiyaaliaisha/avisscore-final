import React from 'react';
import { ProductSummary } from '../types';

interface SummarizerProps {
  summary: ProductSummary;
  productImage?: string;
}

export const Summarizer: React.FC<SummarizerProps> = ({ summary }) => {
  return null; // Logic is now handled directly in the App.tsx detail view for deeper layout integration
};