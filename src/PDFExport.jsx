import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  X,
  Download,
  Printer,
  Eye,
  FileText,
  Landmark,
  Target,
  Users,
  Quote,
  CalendarDays,
  Info,
  CheckCircle2,
} from "lucide-react";

export const PDFExport = ({ student, onClose }) => {
  const contentRef = useRef(null);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    setIsGenerating(true);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`${student.studentName || "Historical-Journal"}-Portfolio.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!contentRef.current) return;

    const printWindow = window.open("", "_blank");
    const printContent = contentRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${student.studentName} - Historical Journal</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Georgia', serif; color: #1e293b; line-height: 1.6; }
            @page { margin: 15mm; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
            ${getStyles()}
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getStyles = () => `
    h1, h2, h3 { font-weight: bold; }
    h1 { font-size: 32px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px; }
    h3 { font-size: 14px; color: #64748b; margin-top: 16px; margin-bottom: 8px; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .meta-info { color: #94a3b8; font-size: 12px; margin-bottom: 20px; }
    .quote-box { background: #f1f5f9; padding: 16px; border-left: 4px solid #0ea5e9; margin: 12px 0; font-style: italic; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 12px 0; }
    .grid-item { page-break-inside: avoid; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin: 8px 0; }
    .timeline-item { margin: 12px 0; padding-left: 20px; border-left: 2px solid #cbd5e1; }
    .source-badge { display: inline-block; background: #dbeafe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-right: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: bold; }
  `;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-800">
                Export to PDF
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {student.studentName} • {student.bookTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div
            ref={contentRef}
            className="bg-white p-12 rounded-2xl shadow-lg max-w-4xl mx-auto space-y-12 text-slate-900 font-serif"
          >
            {/* Title Page */}
            <div className="text-center border-b-2 border-slate-200 pb-12">
              <p className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">
                Historical Fiction Analysis
              </p>
              <h1 className="text-4xl font-black mb-4 italic">
                {student.bookTitle}
              </h1>
              <p className="text-xl text-slate-600 mb-8">by {student.author}</p>
              <div className="flex justify-center gap-8 text-sm text-slate-600">
                <div>
                  <p className="font-bold text-slate-800">Student</p>
                  <p>{student.studentName}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-800">Classroom</p>
                  <p>{student.classroom}</p>
                </div>
              </div>
            </div>

            {/* I. THE ARGUMENT (THESIS) */}
            {student.mainTheme && (
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-300">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h2 className="text-2xl font-black uppercase tracking-wide">
                    I. The Argument (Thesis)
                  </h2>
                </div>
                <div className="quote-box text-xl italic text-slate-800">
                  "{student.mainTheme}"
                </div>
              </section>
            )}

            {/* II. HISTORICAL CONTEXT & SIGNIFICANCE */}
            {(student.setting || student.historicalAccuracy) && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-wide border-b-2 border-slate-300 pb-2">
                  II. Historical Context & Setting
                </h2>
                <div className="grid grid-cols-2 gap-8">
                  {student.setting && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold uppercase text-slate-600 tracking-wider">
                        Setting
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {student.setting}
                      </p>
                    </div>
                  )}
                  {student.historicalAccuracy && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold uppercase text-slate-600 tracking-wider">
                        Historical Accuracy
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-700">
                        {student.historicalAccuracy}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* III. KEY CHARACTERS */}
            {student.characters?.filter((c) => c.name).length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-wide border-b-2 border-slate-300 pb-2">
                  III. Key Characters
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {student.characters
                    .filter((c) => c.name)
                    .map((character, idx) => (
                      <div key={idx} className="card">
                        <h3 className="font-bold text-lg text-slate-800 mb-2">
                          {character.name}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                          {character.role}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {character.description}
                        </p>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* IV. CHRONOLOGICAL TIMELINE */}
            {student.plotPoints?.filter((p) => p.event).length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-wide border-b-2 border-slate-300 pb-2">
                  IV. Chronological Timeline
                </h2>
                <div className="space-y-4">
                  {student.plotPoints
                    .filter((p) => p.event)
                    .map((point, idx) => (
                      <div key={idx} className="timeline-item">
                        <p className="font-bold text-blue-600 text-sm mb-1">
                          {point.chapter || "~"}
                        </p>
                        <p className="text-sm text-slate-700">{point.event}</p>
                        {point.emotionalImpact && (
                          <p className="text-xs text-slate-500 italic mt-2">
                            Impact: {point.emotionalImpact}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* V. HISTORICAL ACCURACY DETAILS */}
            {student.periodDetails?.filter((p) => p.detail).length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-wide border-b-2 border-slate-300 pb-2">
                  V. Historical Accuracy Analysis
                </h2>
                <div className="space-y-6">
                  {student.periodDetails
                    .filter((p) => p.detail)
                    .map((item, idx) => (
                      <div key={idx} className="card space-y-3">
                        <h3 className="font-bold text-slate-800">
                          {item.detail}
                        </h3>
                        {item.page && (
                          <p className="text-xs text-slate-500">
                            <span className="font-bold">Page:</span> {item.page}
                          </p>
                        )}
                        {item.actualHistory && (
                          <div className="bg-blue-50 p-3 rounded border-l-2 border-blue-600">
                            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                              Historical Context
                            </p>
                            <p className="text-sm text-blue-800">
                              {item.actualHistory}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Document Info */}
            <div className="text-center border-t-2 border-slate-200 pt-8 text-xs text-slate-500">
              <p>Generated on {new Date().toLocaleDateString()}</p>
              <p>Historical Fiction Research Journal Portfolio</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-lg bg-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-300 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDFExport;
