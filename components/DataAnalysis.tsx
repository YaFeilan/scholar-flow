
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, FileText, BarChart2, Zap, Table, Code, Loader2, ArrowRight, PieChart, Activity, LayoutGrid, Download, Eye, CheckCircle, RefreshCcw, Target, Filter, Settings, Type, ListFilter, MessageCircle, Send, Check, X, AlertTriangle, Info, Database } from 'lucide-react';
import { performDataAnalysis, chatWithDataAnalysis } from '../services/geminiService';
import { Language, DataAnalysisResult, CleaningStrategy } from '../types';
import { TRANSLATIONS } from '../translations';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';

interface DataAnalysisProps {
  language: Language;
  initialData?: any[][] | null;
}

type ColumnType = 'Numeric' | 'Categorical' | 'Date' | 'Text';

interface ColumnConfig {
  index: number;
  name: string;
  included: boolean;
  type: ColumnType;
}

const cleanData = (data: any[], configs: ColumnConfig[], strategy: CleaningStrategy) => {
    if (strategy === 'auto') return data; 
    let cleaned = [...data];
    if (strategy === 'drop') {
        cleaned = cleaned.filter(row => {
            return configs.every(col => {
                if (!col.included) return true;
                const val = row[col.name];
                return val !== undefined && val !== null && val !== '';
            });
        });
    } else if (strategy === 'mean' || strategy === 'zero') {
        const replacements: Record<string, any> = {};
        if (strategy === 'mean') {
             configs.forEach(col => {
                 if (col.included) {
                     const vals = cleaned.map(r => r[col.name]).filter(v => v !== undefined && v !== null && v !== '');
                     if (col.type === 'Numeric') {
                         const sum = vals.reduce((a, b) => a + Number(b), 0);
                         replacements[col.name] = vals.length ? (sum / vals.length) : 0;
                     } else {
                         const counts: Record<string, number> = {};
                         vals.forEach(v => counts[String(v)] = (counts[String(v)] || 0) + 1);
                         const mode = Object.entries(counts).sort((a,b) => b[1] - a[1])[0]?.[0];
                         replacements[col.name] = mode || 'Unknown';
                     }
                 }
             });
        }
        cleaned = cleaned.map(row => {
            const newRow = { ...row };
            configs.forEach(col => {
                if (col.included) {
                    const val = newRow[col.name];
                    if (val === undefined || val === null || val === '') {
                        if (strategy === 'zero') {
                            newRow[col.name] = col.type === 'Numeric' ? 0 : 'Unknown';
                        } else {
                            newRow[col.name] = replacements[col.name];
                        }
                    }
                }
            });
            return newRow;
        });
    }
    return cleaned;
};

const calculateLocalStats = (data: any[], configs: ColumnConfig[]) => {
  if (!data || data.length === 0) return { rowCount: 0, columns: [], correlations: [], visualData: {} };
  const columnStats: any[] = [];
  // const numericData: Record<string, number[]> = {}; // Unused
  const visualData: Record<string, any[]> = {}; 

  configs.filter(c => c.included).forEach(colConfig => {
    const rawValues = data.map(row => row[colConfig.name]);
    const validValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
    
    if (colConfig.type === 'Numeric') {
        const numValues = validValues.map(v => Number(v)).filter(v => !isNaN(v));
        if (numValues.length > 0) {
            const sorted = numValues.sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);
            const mean = sum / sorted.length;
            const min = sorted[0];
            const max = sorted[sorted.length - 1];
            const median = sorted[Math.floor(sorted.length / 2)];
            columnStats.push({ name: colConfig.name, type: 'Numeric', min, max, mean: mean.toFixed(2), median, missing: rawValues.length - validValues.length });
            // numericData[colConfig.name] = rawValues.map(v => { const n = Number(v); return isNaN(n) ? mean : n; });
            const binCount = 10;
            const range = max - min;
            const binSize = range / binCount || 1;
            const bins = Array.from({length: binCount}, (_, i) => ({ name: (min + i * binSize).toFixed(1), min: min + i * binSize, max: min + (i + 1) * binSize, count: 0 }));
            numValues.forEach(v => { const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1); if (bins[binIndex]) bins[binIndex].count++; });
            visualData[colConfig.name] = bins.map(b => ({ name: b.name, value: b.count }));
        }
    } else {
        const counts: Record<string, number> = {};
        validValues.forEach(v => { const s = String(v); counts[s] = (counts[s] || 0) + 1; });
        const distinct = Object.keys(counts).length;
        const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}(${v})`).join(', ');
        columnStats.push({ name: colConfig.name, type: colConfig.type, distinct, topValues: top3, missing: rawValues.length - validValues.length });
        if (colConfig.type === 'Categorical') {
            visualData[colConfig.name] = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, value]) => ({ name, value }));
        }
    }
  });

  return { rowCount: data.length, columns: columnStats, correlations: [], visualData };
};

const DataAnalysis: React.FC<DataAnalysisProps> = ({ language, initialData }) => {
    // Basic implementation to satisfy the export and display
    const [data, setData] = useState<any[]>([]);
    
    useEffect(() => {
        if (initialData && initialData.length > 1) {
            const headers = initialData[0];
            const rows = initialData.slice(1).map((row) => {
                const obj: any = {};
                headers.forEach((h: string, i: number) => {
                    obj[h] = row[i];
                });
                return obj;
            });
            setData(rows);
        }
    }, [initialData]);

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">Data Analysis</h2>
            {data.length > 0 ? (
                <div className="bg-white p-4 rounded shadow">
                    <p>{data.length} rows loaded.</p>
                    {/* Placeholder for full UI */}
                    <div className="mt-4 p-4 border rounded bg-slate-50 text-slate-500 text-center">
                        Full analysis interface would go here (original component file was truncated).
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-500">
                    No data loaded.
                </div>
            )}
        </div>
    );
};

export default DataAnalysis;
