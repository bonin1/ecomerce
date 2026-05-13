'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { exportProfileData } from '@/app/API/profile/exportData';
import './export.scss';

const ExportDataPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formats, setFormats] = useState({
        json: true,
        pdf: false,
        csv: false
    });

    const handleFormatChange = (format: keyof typeof formats) => {
        setFormats(prev => ({
            ...prev,
            [format]: !prev[format]
        }));
    };

    const handleExport = async () => {
        if (!formats.json && !formats.pdf && !formats.csv) {
            setError('Please select at least one export format');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const selectedFormats = Object.entries(formats)
                .filter(([_, selected]) => selected)
                .map(([format]) => format);

            await exportProfileData(selectedFormats);
            router.push('/profile');
        } catch (err: any) {
            setError(err.message || 'Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="export-data-container">
            <div className="page-header">
                <h2>Export Your Data</h2>
                <p className="text-muted">Download a copy of your personal data</p>
            </div>

            {error && (
                <div className="alert alert-danger mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            <div className="content-panel">
                <div className="export-options mb-4">
                    <h5>Select Export Formats</h5>
                    <p className="text-muted mb-3">
                        Choose one or more formats for your data export
                    </p>

                    <div className="format-options">
                        <div className="format-card">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="jsonFormat"
                                    checked={formats.json}
                                    onChange={() => handleFormatChange('json')}
                                />
                                <label className="form-check-label" htmlFor="jsonFormat">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-filetype-json format-icon"></i>
                                        <div>
                                            <strong>JSON</strong>
                                            <p className="mb-0 text-muted small">Machine-readable format</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="format-card">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="pdfFormat"
                                    checked={formats.pdf}
                                    onChange={() => handleFormatChange('pdf')}
                                />
                                <label className="form-check-label" htmlFor="pdfFormat">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-filetype-pdf format-icon"></i>
                                        <div>
                                            <strong>PDF</strong>
                                            <p className="mb-0 text-muted small">Printable document</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="format-card">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="csvFormat"
                                    checked={formats.csv}
                                    onChange={() => handleFormatChange('csv')}
                                />
                                <label className="form-check-label" htmlFor="csvFormat">
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-filetype-csv format-icon"></i>
                                        <div>
                                            <strong>CSV</strong>
                                            <p className="mb-0 text-muted small">Spreadsheet format</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="export-info mb-4">
                    <div className="alert alert-info">
                        <h5 className="alert-heading">What data will be exported?</h5>
                        <ul className="mb-0">
                            <li>Your profile information (name, email, etc.)</li>
                            <li>Account activity history</li>
                            <li>Order history and saved items</li>
                            <li>Your saved preferences and settings</li>
                        </ul>
                    </div>
                </div>

                <div className="d-flex justify-content-between">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => router.push('/profile')}
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Profile
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-download me-2"></i>
                                Export Data
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportDataPage;
