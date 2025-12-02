'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPINSet } from '@/lib/pin/pin';
import { getAllEntries } from '@/lib/storage/storage';
import { prepareExportData, shareViaDevice, downloadAsFile } from '@/lib/share/share';
import { JournalEntry } from '@/types/journal';

export default function SharePage() {
    const router = useRouter();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [supportsNativeShare, setSupportsNativeShare] = useState(false);

    useEffect(() => {
        async function initialize() {
            try {
                const pin = sessionStorage.getItem('userPin');
                if (!pin) {
                    const isSet = await isPINSet();
                    if (!isSet) {
                        router.push('/setup');
                    } else {
                        router.push('/login');
                    }
                    return;
                }

                const loadedEntries = await getAllEntries(pin);
                setEntries(loadedEntries);

                // Check if native sharing is supported
                setSupportsNativeShare(typeof navigator.share !== 'undefined');
            } catch (err) {
                console.error('Error loading entries:', err);
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, [router]);

    async function handleNativeShare() {
        setSharing(true);
        try {
            const exportData = await prepareExportData(entries);
            const success = await shareViaDevice(exportData);

            if (!success) {
                // Fallback to download
                downloadAsFile(exportData);
            }
        } catch (err) {
            console.error('Share failed:', err);
            alert('Failed to share. Try downloading instead.');
        } finally {
            setSharing(false);
        }
    }

    async function handleDownload() {
        setSharing(true);
        try {
            const exportData = await prepareExportData(entries);
            downloadAsFile(exportData);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Failed to download.');
        } finally {
            setSharing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-800">
                        ← Back
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">Share Data</h1>
                    <div className="w-16"></div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                    <div className="text-center mb-6">
                        <div className="text-6xl mb-4">📤</div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Export Your Journal</h2>
                        <p className="text-gray-600">
                            Share your encrypted journal data with a mental health professional
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>🔒 Your data is encrypted.</strong> Recipients will need your PIN to decrypt
                            the data using a separate viewer app.
                        </p>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total Entries</span>
                            <span className="font-bold text-gray-800">{entries.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700">Date Range</span>
                            <span className="font-bold text-gray-800">
                {entries.length > 0
                    ? `${entries[entries.length - 1].date} - ${entries[0].date}`
                    : 'N/A'}
              </span>
                        </div>
                    </div>

                    {entries.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 mb-4">No entries to export yet</p>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all"
                            >
                                Create First Entry
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {supportsNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    disabled={sharing}
                                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {sharing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Preparing...
                                        </>
                                    ) : (
                                        <>
                                            <span>📤</span>
                                            Share via Device
                                        </>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={handleDownload}
                                disabled={sharing}
                                className="w-full bg-gray-700 hover:bg-gray-800 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {sharing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        Download as File
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> Never share your PIN through the same channel as your
                        data. Use a separate, secure method to share your PIN with your healthcare provider.
                    </p>
                </div>
            </main>
        </div>
    );
}
