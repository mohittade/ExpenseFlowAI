import { Card, CardBody } from './ui/Card';
import { Button } from './ui/Button';
import { FileText, Download } from 'lucide-react';
import { downloadReport } from '../api/client';

interface PDFDownloadProps {
  pdfPath: string | null;
  runId: string;
}

export const PDFDownload = ({ pdfPath, runId }: PDFDownloadProps) => {
  if (!pdfPath) return null;

  const handleDownload = async () => {
    try {
      const blob = await downloadReport(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_report_${runId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <Card className="mb-6">
      <CardBody className="flex items-center justify-between p-6 bg-primary-50 border border-primary-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-primary-900">Report Generated</p>
            <p className="text-sm text-primary-700">Your expense report PDF is ready for download.</p>
          </div>
        </div>
        <Button variant="primary" onClick={handleDownload} size="lg">
          <Download className="w-5 h-5 mr-2" />
          Download PDF
        </Button>
      </CardBody>
    </Card>
  );
};