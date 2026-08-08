import { jsPDF } from "jspdf";

interface PDFOptions {
  days: number;
  includeMetrics: boolean;
  includeSymptoms: boolean;
}

export const generatePDF = async (options: PDFOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        doc.setFillColor(15, 23, 42);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(22);
        doc.text("Symptom Scribe Health Report", 15, 25);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 33);
        doc.text(`Report Period: Last ${options.days} Days`, 15, 39);
        
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.5);
        doc.line(15, 45, 195, 45);
        
        let currentY = 55;
        if (options.includeSymptoms) {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(14);
          doc.text("1. Symptom Diary History", 15, currentY);
          
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          currentY += 10;
          doc.text("- Migraine / Head Pressure (Level: Moderate) - Logged Aug 05", 18, currentY);
          currentY += 6;
          doc.text("- Acid Reflux / Indigestion (Level: Mild) - Logged Aug 01", 18, currentY);
          currentY += 15;
        }

        if (options.includeMetrics) {
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(14);
          doc.text("2. Vital Signs Summary", 15, currentY);
          
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(10);
          currentY += 10;
          doc.text("- Average Blood Pressure: 119/78 mmHg (Optimal)", 18, currentY);
          currentY += 6;
          doc.text("- Average Sleep Duration: 7.4 Hours (Circadian Healthy)", 18, currentY);
        }

        doc.save(`Symptom-Scribe-Health-Report-${options.days}-Days.pdf`);
        resolve(true);
      } catch (err) {
        console.error("PDF generation failed:", err);
        resolve(false);
      }
    }, 1500);
  });
};