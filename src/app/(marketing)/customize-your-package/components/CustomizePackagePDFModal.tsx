'use client';

import { useState, useRef } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { CustomizePackagePreview } from './CustomizePackagePreview';
import type { PackageOption, PersonCounts, AddonDeal, AddonHotelService, AddonPrivateTransfer } from '../types';
import './CustomizePackagePDFModal.css';

interface CustomizePackagePDFModalProps {
  onClose: () => void;
  package: PackageOption;
  persons: PersonCounts;
  isSoloTraveller: boolean;
  selectedDeals: AddonDeal[];
  selectedServices: AddonHotelService[];
  selectedTransfers: AddonPrivateTransfer[];
}

export function CustomizePackagePDFModal({
  onClose,
  package: pkg,
  persons,
  isSoloTraveller,
  selectedDeals,
  selectedServices,
  selectedTransfers,
}: CustomizePackagePDFModalProps) {
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (downloading || !previewRef.current) return;

    try {
      setDownloading(true);
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: [5, 5, 5, 5],
        filename: `package-${pkg.package_id || 'custom'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      await html2pdf().set(opt).from(previewRef.current).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="customize-pdf-overlay" onClick={onClose}>
      <div className="customize-pdf-container" onClick={(e) => e.stopPropagation()}>
        <div className="customize-pdf-header">
          <h2 className="customize-pdf-title">{pkg.package_name}</h2>
          <div className="customize-pdf-header-actions">
            <button
              type="button"
              className={`customize-pdf-download-btn ${downloading ? 'downloading' : ''}`}
              onClick={handleDownload}
              disabled={downloading}
              title={downloading ? 'Generating PDF...' : 'Download PDF'}
            >
              {downloading ? (
                <>
                  <Loader2 size={18} className="customize-pdf-download-spinner" />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download PDF
                </>
              )}
            </button>
            <button
              type="button"
              className="customize-pdf-close-btn"
              onClick={onClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="customize-pdf-content">
          <div className="customize-pdf-preview-wrapper" ref={previewRef}>
            <CustomizePackagePreview
              package={pkg}
              persons={persons}
              isSoloTraveller={isSoloTraveller}
              selectedDeals={selectedDeals}
              selectedServices={selectedServices}
              selectedTransfers={selectedTransfers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
