import React, { useEffect, useState, useRef } from 'react';
import type { InvestigationReport, SystemConfig } from '../../types';
import { FileText, Trash2, ArrowRight, FolderOpen, Folder, ChevronLeft, Plus, FolderClosed, Download, FileJson, ChevronDown } from 'lucide-react';
import { TaskSetupModal } from '../ui/TaskSetupModal';
import { useCaseStore } from '../../store/caseStore';
import { BackgroundMatrixRain } from '../ui/BackgroundMatrixRain';
import { exportCaseAsJson, exportCaseAsHtml, exportCaseAsMarkdown } from '../../utils/exportUtils';

interface ArchivesProps {
  onSelectReport: (report: InvestigationReport) => void;
  onStartNewCase: (topic: string, config: SystemConfig) => void;
}

export const Archives: React.FC<ArchivesProps> = ({ onSelectReport, onStartNewCase }) => {
  const { archives, cases, setArchives, setCases } = useCaseStore();
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    const activeCaseId = localStorage.getItem('sherlock_active_case_id');
    if (activeCaseId && activeCaseId !== 'ALL') {
      return activeCaseId;
    }
    return null;
  });
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCaseReports = (caseId: string) => {
    return archives.filter(r => r.caseId === caseId);
  };

  const getUnassignedReports = () => {
    return archives.filter(r => !r.caseId);
  };

  const handleDeleteReport = (e: React.MouseEvent, id?: string) => {
    e.stopPropagation();
    if (!id) return;

    const updated = archives.filter(r => r.id !== id);
    setArchives(updated);
  };

  const handleDeleteCase = (e: React.MouseEvent, caseId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure? This will delete the case folder but keep reports as unassigned.")) return;

    // Delete case object
    const updatedCases = cases.filter(c => c.id !== caseId);
    setCases(updatedCases);

    // Unassign reports
    const updatedReports = archives.map(r => r.caseId === caseId ? { ...r, caseId: undefined } : r);
    setArchives(updatedReports);

    if (selectedCaseId === caseId) {
      setSelectedCaseId(null);
      localStorage.removeItem('sherlock_active_case_id');
    }
  };

  const handleCaseSelect = (id: string) => {
    if (id === 'ALL') {
      setSelectedCaseId(null);
      localStorage.removeItem('sherlock_active_case_id');
    } else {
      setSelectedCaseId(id);
      localStorage.setItem('sherlock_active_case_id', id);
    }
    setCurrentPage(1); // Reset pagination on filter change
  };

  // --- RENDER HELPERS ---

  const renderCaseGrid = () => {
    if (cases.length === 0 && getUnassignedReports().length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
          <div className="bg-zinc-900/50 p-8 border border-dashed border-zinc-800 flex flex-col items-center max-w-md text-center">
            <FolderOpen className="w-16 h-16 text-zinc-700 mb-6" />
            <h3 className="text-xl font-bold text-zinc-400 font-mono mb-2 uppercase tracking-tight">Archives Empty</h3>
            <p className="text-zinc-500 text-sm font-mono mb-8 leading-relaxed">
              No active operations or digital fossils found. Initialize a new investigation to begin data collection.
            </p>
            <button
              onClick={() => setIsNewCaseModalOpen(true)}
              className="px-6 py-2 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.2)]"
            >
              Start New Operation
            </button>
          </div>
        </div>
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCases = cases.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(cases.length / itemsPerPage);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {/* Active Cases */}
          {paginatedCases.map((c) => {
            const fileCount = archives.filter(r => r.caseId === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => handleCaseSelect(c.id)}
                className="bg-osint-panel/80 backdrop-blur-sm p-6 border border-zinc-800 hover:border-osint-primary cursor-pointer group transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Folder className="w-24 h-24 text-white" />
                </div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="bg-zinc-900 p-3 text-white border border-zinc-700">
                    <FolderClosed className="w-8 h-8" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-1 border uppercase ${c.status === 'ACTIVE' ? 'border-osint-primary/50 text-osint-primary bg-osint-primary/10' : 'border-zinc-700 text-zinc-500'}`}>
                    {c.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-zinc-300 truncate relative z-10 font-mono">
                  {c.title}
                </h3>
                <p className="text-zinc-600 text-sm font-mono mb-4">{c.dateOpened}</p>

                <div className="flex items-center justify-between text-sm text-zinc-500 border-t border-zinc-800 pt-4 relative z-10 font-mono uppercase">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    {fileCount} {fileCount === 1 ? 'File' : 'Files'}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); exportCaseAsHtml(c, getCaseReports(c.id)); }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Export formatted printable dossier (HTML)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportCaseAsJson(c, getCaseReports(c.id)); }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Export raw case data for backup (JSON)"
                    >
                      <FileJson className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); exportCaseAsMarkdown(c, getCaseReports(c.id)); }}
                      className="p-1 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Export case as Markdown (.md)"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCase(e, c.id)}
                      className="p-1 hover:text-osint-danger transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Unassigned Reports Folder (Virtual) */}
          {getUnassignedReports().length > 0 && (
            <div
              onClick={() => handleCaseSelect('unassigned')}
              className="bg-zinc-900/30 backdrop-blur-sm p-6 border border-zinc-800 border-dashed hover:border-zinc-500 cursor-pointer group transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-zinc-900 p-3 text-zinc-500">
                  <FolderOpen className="w-8 h-8" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-zinc-400 mb-1 group-hover:text-white font-mono uppercase">Unassigned</h3>
              <p className="text-zinc-600 text-sm font-mono mb-4">Miscellaneous Intel</p>
              <div className="flex items-center text-sm text-zinc-500 border-t border-zinc-800 pt-4 font-mono uppercase">
                <FileText className="w-4 h-4 mr-2" />
                {getUnassignedReports().length} Files
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 pt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
              >
                Prev
              </button>
              <span className="text-xs font-mono text-zinc-500 uppercase">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReportList = (caseId: string) => {
    const isUnassigned = caseId === 'unassigned';
    const _currentCase = cases.find(c => c.id === caseId);
    const caseReports = isUnassigned ? getUnassignedReports() : getCaseReports(caseId);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedReports = caseReports.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(caseReports.length / itemsPerPage);

    return (
      <div className="animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {caseReports.length === 0 ? (
            <div className="col-span-full py-20 bg-zinc-900/20 border border-dashed border-zinc-800 flex flex-col items-center justify-center animate-in fade-in">
              <FileText className="w-12 h-12 text-zinc-800 mb-4" />
              <div className="text-zinc-600 italic font-mono uppercase text-xs tracking-widest">NO_REPORTS_FILED_IN_DATABASE</div>
            </div>
          ) : (
            paginatedReports.map((report, idx) => (
              <div
                key={report.id || idx}
                onClick={() => onSelectReport(report)}
                className="bg-zinc-900/70 backdrop-blur-sm p-6 border border-zinc-800 hover:border-osint-primary cursor-pointer group flex items-center justify-between transition-all hover:bg-zinc-900"
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-black p-3 text-white border border-zinc-800 group-hover:border-zinc-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-200 group-hover:text-white transition-colors font-mono">{report.topic}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 font-mono mt-1 uppercase">
                      <span>{report.dateStr || 'Unknown Date'}</span>
                      {report.parentTopic && (
                        <span className="flex items-center text-zinc-400">
                          <ArrowRight className="w-3 h-3 mr-1" /> Linked: {report.parentTopic}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={(e) => handleDeleteReport(e, report.id)}
                    className="text-zinc-600 hover:text-red-500 p-2 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Report"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 pt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
            >
              Prev
            </button>
            <span className="text-xs font-mono text-zinc-500 uppercase">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-zinc-800 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 font-mono text-xs uppercase"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black min-h-screen relative">
      <BackgroundMatrixRain />

      {/* Sticky Header */}
      <div className="sticky top-0 z-30 h-20 px-6 bg-black/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-6">
          {/* Case Selector */}
          <div className="relative group hidden md:block">
            <ChevronLeft className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none rotate-270" style={{ transform: 'translateY(-50%) rotate(-90deg)' }} />
            <select
              value={selectedCaseId || 'ALL'}
              onChange={(e) => handleCaseSelect(e.target.value)}
              className="bg-black border border-zinc-700 text-zinc-300 text-xs font-mono py-1.5 pl-3 pr-8 rounded-none outline-none appearance-none cursor-pointer hover:border-osint-primary min-w-[200px] max-w-[300px] truncate"
            >
              <option value="ALL">VIEW ALL CASES</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>CASE: {c.title.replace('Operation: ', '')}</option>
              ))}
              {getUnassignedReports().length > 0 && <option value="unassigned">UNASSIGNED FILES</option>}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Export Dropdown - only show when case is selected */}
          {selectedCaseId && selectedCaseId !== 'unassigned' && (() => {
            const currentCase = cases.find(c => c.id === selectedCaseId);
            return currentCase ? (
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs font-bold uppercase hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span className="hidden lg:inline">Export</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 shadow-xl z-50 min-w-[200px]">
                    <button
                      onClick={() => {
                        exportCaseAsHtml(currentCase, getCaseReports(currentCase.id));
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center border-b border-zinc-800"
                      title="Exports a formatted printable dossier"
                    >
                      <Download className="w-4 h-4 mr-3 text-zinc-500" />
                      <div>
                        <div className="font-bold">HTML Dossier</div>
                        <div className="text-[10px] text-zinc-500">Formatted printable report</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        exportCaseAsJson(currentCase, getCaseReports(currentCase.id));
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center"
                      title="Exports raw case data for backup/integration"
                    >
                      <FileJson className="w-4 h-4 mr-3 text-zinc-500" />
                      <div>
                        <div className="font-bold">JSON Data</div>
                        <div className="text-[10px] text-zinc-500">Raw data for backup</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : null;
          })()}
          <button onClick={() => setIsNewCaseModalOpen(true)} className="flex items-center px-3 py-1.5 bg-osint-primary text-black font-mono text-xs font-bold uppercase hover:bg-white transition-colors">
            <Plus className="w-4 h-4 mr-1" /> <span className="hidden lg:inline">New Case</span>
          </button>
        </div>
      </div>

      {/* Start New Case Modal */}
      {isNewCaseModalOpen && (
        <TaskSetupModal
          initialTopic=""
          onCancel={() => setIsNewCaseModalOpen(false)}
          onStart={(topic, config) => {
            onStartNewCase(topic, config);
            setIsNewCaseModalOpen(false);
          }}
        />
      )}

      <div className="relative z-10 p-6 w-full h-full overflow-y-auto">
        {selectedCaseId ? renderReportList(selectedCaseId) : renderCaseGrid()}
      </div>
    </div>
  );
};
