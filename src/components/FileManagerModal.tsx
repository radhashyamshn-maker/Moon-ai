import React, { useState } from 'react';
import { PhoneFileItem, ThemeConfig } from '../types';
import {
  FolderOpen,
  Search,
  X,
  FileText,
  Image as ImageIcon,
  Music,
  Download,
  HardDrive,
  Eye,
  Sparkles,
  Share2,
  Trash2,
  Star,
  ExternalLink,
  Plus,
  CheckCircle2,
  FileCode,
  File,
} from 'lucide-react';

interface FileManagerModalProps {
  files: PhoneFileItem[];
  theme: ThemeConfig;
  onOpenFile: (file: PhoneFileItem) => void;
  onAnalyzeWithAi: (file: PhoneFileItem) => void;
  onShareFile: (file: PhoneFileItem) => void;
  onDeleteFile?: (fileId: string) => void;
  onAddFile?: (file: Partial<PhoneFileItem>) => void;
  onClose: () => void;
}

export const INITIAL_PHONE_FILES: PhoneFileItem[] = [
  {
    id: 'f_aadhaar',
    name: 'Aadhaar_Card_Verified.pdf',
    category: 'documents',
    extension: 'pdf',
    sizeBytes: 1468000,
    sizeFormatted: '1.4 MB',
    lastModified: 'Yesterday, 4:15 PM',
    path: '/storage/emulated/0/Documents/Government/Aadhaar_Card_Verified.pdf',
    textContent: 'Government of India - Unique Identification Authority. Identity Document verified with biometrics.',
    tags: ['ID', 'Official', 'Confidential'],
    starred: true,
  },
  {
    id: 'f_salary',
    name: 'Salary_Slip_August2026.pdf',
    category: 'documents',
    extension: 'pdf',
    sizeBytes: 430080,
    sizeFormatted: '420 KB',
    lastModified: 'Aug 31, 2026',
    path: '/storage/emulated/0/Download/Salary_Slip_August2026.pdf',
    textContent: 'Pay Slip for Month: August 2026. Net Compensation Credited: INR 1,48,500. Deductions: Tax, PF.',
    tags: ['Finance', 'Payroll'],
    starred: true,
  },
  {
    id: 'f_pitch',
    name: 'Moon_AI_Executive_Architecture.pptx',
    category: 'documents',
    extension: 'pptx',
    sizeBytes: 13421772,
    sizeFormatted: '12.8 MB',
    lastModified: 'Sep 18, 2026',
    path: '/storage/emulated/0/Work/Presentations/Moon_AI_Executive_Architecture.pptx',
    textContent: 'Architecture Overview: Real-time Gemini 2.0 Flash Live API, Full 3D Anime Avatar, OS Permissions, Telephony.',
    tags: ['Work', 'Presentation'],
  },
  {
    id: 'f_shimla',
    name: 'Shimla_Family_Vacation_2026.jpg',
    category: 'images',
    extension: 'jpg',
    sizeBytes: 4404019,
    sizeFormatted: '4.2 MB',
    lastModified: 'Sep 10, 2026',
    path: '/storage/emulated/0/DCIM/Camera/Shimla_Family_Vacation_2026.jpg',
    tags: ['Family', 'Holiday', 'Photos'],
    starred: true,
  },
  {
    id: 'f_voicenote',
    name: 'Voice_Note_Product_Roadmap.m4a',
    category: 'audio',
    extension: 'm4a',
    sizeBytes: 3774873,
    sizeFormatted: '3.6 MB',
    lastModified: 'Sep 19, 2026, 11:20 AM',
    path: '/storage/emulated/0/Recordings/Voice_Note_Product_Roadmap.m4a',
    textContent: 'Audio memo: "Need to make sure accessibility permissions and background activity stay alive without battery throttling."',
    tags: ['Memo', 'Audio'],
  },
  {
    id: 'f_apk',
    name: 'Moon_Assistant_v2.4_Release.apk',
    category: 'downloads',
    extension: 'apk',
    sizeBytes: 29884416,
    sizeFormatted: '28.5 MB',
    lastModified: 'Today, 2:40 PM',
    path: '/storage/emulated/0/Download/Moon_Assistant_v2.4_Release.apk',
    tags: ['Android', 'App Package'],
  },
  {
    id: 'f_receipt',
    name: 'Bank_Statement_HDFC_Q2.pdf',
    category: 'documents',
    extension: 'pdf',
    sizeBytes: 671088,
    sizeFormatted: '655 KB',
    lastModified: 'Sep 12, 2026',
    path: '/storage/emulated/0/Download/Bank_Statement_HDFC_Q2.pdf',
    textContent: 'HDFC Bank Account Statement. Account ending in 8912. Statement period: June 2026 - August 2026.',
    tags: ['Banking', 'Tax'],
  },
  {
    id: 'f_soundtrack',
    name: 'TungTung_Lofi_Beat.mp3',
    category: 'audio',
    extension: 'mp3',
    sizeBytes: 5452595,
    sizeFormatted: '5.2 MB',
    lastModified: 'Aug 24, 2026',
    path: '/storage/emulated/0/Music/TungTung_Lofi_Beat.mp3',
    tags: ['Music', 'Beats'],
  },
  {
    id: 'f_agreement',
    name: 'Signed_Vendor_Agreement.pdf',
    category: 'documents',
    extension: 'pdf',
    sizeBytes: 933888,
    sizeFormatted: '912 KB',
    lastModified: 'Sep 15, 2026',
    path: '/storage/emulated/0/Documents/Signed_Vendor_Agreement.pdf',
    textContent: 'Confidential Service Agreement executed between parties with digital signature hash verified.',
    tags: ['Legal', 'Contract'],
  },
];

export const FileManagerModal: React.FC<FileManagerModalProps> = ({
  files,
  theme,
  onOpenFile,
  onAnalyzeWithAi,
  onShareFile,
  onDeleteFile,
  onAddFile,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewingFile, setPreviewingFile] = useState<PhoneFileItem | null>(null);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState<'documents' | 'images' | 'audio' | 'downloads'>('documents');
  const [newFileContent, setNewFileContent] = useState('');

  const categories = [
    { id: 'all', label: 'All Files (सभी)', count: files.length },
    { id: 'documents', label: 'Documents (दस्तावेज़)', count: files.filter((f) => f.category === 'documents').length },
    { id: 'images', label: 'Images (फ़ोटो)', count: files.filter((f) => f.category === 'images').length },
    { id: 'audio', label: 'Audio (ऑडियो)', count: files.filter((f) => f.category === 'audio').length },
    { id: 'downloads', label: 'Downloads (डाउनलोड)', count: files.filter((f) => f.category === 'downloads').length },
  ];

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(search.toLowerCase()) ||
      file.path.toLowerCase().includes(search.toLowerCase()) ||
      file.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || file.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (category: string, ext: string) => {
    switch (category) {
      case 'documents':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'images':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-400" />;
      case 'downloads':
        return <Download className="w-5 h-5 text-emerald-400" />;
      default:
        return <File className="w-5 h-5 text-white/60" />;
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    if (onAddFile) {
      const ext = newFileName.includes('.') ? newFileName.split('.').pop() || 'txt' : 'txt';
      onAddFile({
        id: `f_${Date.now()}`,
        name: newFileName.trim(),
        category: newFileCategory,
        extension: ext,
        sizeBytes: 1024 * 50,
        sizeFormatted: '50 KB',
        lastModified: 'Just now',
        path: `/storage/emulated/0/${newFileCategory === 'downloads' ? 'Download' : 'Documents'}/${newFileName.trim()}`,
        textContent: newFileContent.trim() || 'User created document file via Moon AI File Manager.',
        tags: ['Custom', 'User'],
      });
    }

    setNewFileName('');
    setNewFileContent('');
    setShowNewFileDialog(false);
  };

  return (
    <div
      id="file-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none font-mono"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[#111116] border rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col overflow-hidden text-white relative"
        style={{
          borderColor: theme.border,
          boxShadow: `0 20px 60px rgba(0,0,0,0.85), 0 0 25px ${theme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-md"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                borderColor: 'rgba(245, 158, 11, 0.4)',
              }}
            >
              <FolderOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-wide">
                  Phone Files & Storage Explorer
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  फाइल एक्सेस
                </span>
              </div>
              <p className="text-[11px] text-white/50">
                फोन की फाइल्स ढूँढने, खोलने और AI से पढ़ने के लिए (Deep storage search & opener)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowNewFileDialog(true)}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Add or import file"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-bold">New File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Device Storage Status Bar */}
        <div className="my-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Internal Storage</span>
              <span className="text-[11px] text-white/50">(/storage/emulated/0)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">
              42.6 GB used of 128 GB (85.4 GB Free)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex">
            <div className="h-full bg-cyan-500" style={{ width: '18%' }} title="Apps & System: 18%" />
            <div className="h-full bg-amber-500" style={{ width: '8%' }} title="Documents: 8%" />
            <div className="h-full bg-pink-500" style={{ width: '5%' }} title="Media: 5%" />
            <div className="h-full bg-emerald-500" style={{ width: '4%' }} title="Downloads: 4%" />
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2 pb-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search files (e.g. Aadhaar, invoice, salary, audio, photo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-amber-500/60"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                    : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/70">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-2 custom-scrollbar">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.06] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* File Info */}
              <div
                className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => setPreviewingFile(file)}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {getFileIcon(file.category, file.extension)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {file.name}
                    </span>
                    {file.starred && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono mt-0.5 flex-wrap">
                    <span>{file.sizeFormatted}</span>
                    <span>•</span>
                    <span>{file.lastModified}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px] text-white/30">{file.path}</span>
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {file.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/60 border border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onOpenFile(file)}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Open file on device"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Open (खोलें)</span>
                </button>

                <button
                  onClick={() => onAnalyzeWithAi(file)}
                  className="px-2.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-xs flex items-center gap-1 transition-all cursor-pointer"
                  title="Ask Moon AI to summarize or extract data from file"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">AI Read</span>
                </button>

                <button
                  onClick={() => onShareFile(file)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Share file"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                {onDeleteFile && (
                  <button
                    onClick={() => onDeleteFile(file.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                    title="Delete file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="text-center py-12 text-white/40 text-xs space-y-2">
              <FolderOpen className="w-8 h-8 mx-auto text-white/20" />
              <p>No files matching "{search}" in {selectedCategory}</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('all');
                }}
                className="text-amber-400 hover:underline text-[11px] cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40 shrink-0">
          <span>{files.length} Files indexed • Scanned in /storage</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Voice File Search Ready
          </span>
        </div>
      </div>

      {/* File Preview Modal */}
      {previewingFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
          <div className="bg-[#14141c] border border-white/20 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(previewingFile.category, previewingFile.extension)}
                <span className="text-sm font-bold text-white truncate">
                  {previewingFile.name}
                </span>
              </div>
              <button
                onClick={() => setPreviewingFile(null)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-white/70">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 font-mono space-y-1 text-[11px]">
                <p><span className="text-white/40">Path:</span> {previewingFile.path}</p>
                <p><span className="text-white/40">Size:</span> {previewingFile.sizeFormatted} ({previewingFile.sizeBytes} bytes)</p>
                <p><span className="text-white/40">Modified:</span> {previewingFile.lastModified}</p>
                <p><span className="text-white/40">Type:</span> {previewingFile.category.toUpperCase()} ({previewingFile.extension})</p>
              </div>

              {previewingFile.textContent && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                    Text Content Preview:
                  </div>
                  <p className="italic">"{previewingFile.textContent}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => {
                  onAnalyzeWithAi(previewingFile);
                  setPreviewingFile(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze with Moon
              </button>
              <button
                onClick={() => {
                  onOpenFile(previewingFile);
                  setPreviewingFile(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Creation Simulator Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
          <form
            onSubmit={handleCreateFile}
            className="bg-[#14141c] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Create New File / Import</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewFileDialog(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-white/60 block mb-1">File Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Project_Notes.txt or Receipt.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">Category:</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as any)}
                  className="w-full bg-[#1e1e26] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="documents">Documents (दस्तावेज़)</option>
                  <option value="images">Images (फ़ोटो)</option>
                  <option value="audio">Audio (ऑडियो)</option>
                  <option value="downloads">Downloads (डाउनलोड)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-white/60 block mb-1">File Content / Memo:</label>
                <textarea
                  rows={3}
                  placeholder="Notes, transcript, or document content..."
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowNewFileDialog(false)}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
              >
                Create File
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
