'use client';

import { useState } from 'react';
import { JournalEntry, Mood } from '@/types/journal';
import { decryptEntry } from '@/lib/crypto/encryption';

interface EncryptedExport {
    version: string;
    exportDate: string;
    entryCount: number;
    data: {
        encryptedEntries: string;
        metadata: {
            dateRange: { from: string; to: string };
            moods: Record<string, number>;
        };
    };
    decryptionInfo: {
        algorithm: string;
        keyDerivation: string;
        instructions: string;
    };
}

const MOOD_EMOJI: Record<Mood, string> = {
    great: '😄',
    good: '🙂',
    okay: '😐',
    bad: '😟',
    terrible: '😢',
};

const MOOD_COLOR: Record<Mood, string> = {
    great: 'bg-green-100 border-green-300',
    good: 'bg-blue-100 border-blue-300',
    okay: 'bg-yellow-100 border-yellow-300',
    bad: 'bg-orange-100 border-orange-300',
    terrible: 'bg-red-100 border-red-300',
};

export default function ViewerPage() {
    const [file, setFile] = useState<File | null>(null);
    const [exportData, setExportData] = useState<EncryptedExport | null>(null);
    const [pin, setPin] = useState('');
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const uploadedFile = e.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setError('');
        setEntries([]);
        setPin('');

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const jsonData = JSON.parse(event.target?.result as string);

                if (!jsonData.version || !jsonData.data?.encryptedEntries) {
                    throw new Error('Invalid export file format');
                }

                setExportData(jsonData);
            } catch (err) {
                setError('Invalid JSON file. Please upload a valid mental health export.');
                setFile(null);
            }
        };

        reader.readAsText(uploadedFile);
    }

    async function handleDecrypt() {
        if (!exportData || !pin) {
            setError('Please enter the PIN');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Decode base64 entries
            const base64Data = exportData.data.encryptedEntries;
            const jsonString = decodeURIComponent(escape(atob(base64Data)));
            const decryptedEntries = JSON.parse(jsonString) as JournalEntry[];

            // Sort by timestamp (newest first)
            const sortedEntries = decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);

            setEntries(sortedEntries);
        } catch (err) {
            console.error('Decryption error:', err);
            setError('Failed to decrypt. Check your PIN or file integrity.');
        } finally {
            setLoading(false);
        }
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        }
    }

    function handleReset() {
        setFile(null);
        setExportData(null);
        setPin('');
        setEntries([]);
        setError('');
        setSelectedEntry(null);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <a
                        href="/"
                        className="text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
                    >
                        <span className="text-xl">🏠</span>
                        <span className="font-semibold">Home</span>
                    </a>
                    <h1 className="text-2xl font-bold text-gray-800">🔓 Data Viewer</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </header>


            <main className="max-w-4xl mx-auto px-4 py-6">
                {!exportData ? (
                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">📂</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Export File</h2>
                            <p className="text-gray-600">
                                Upload a mental health journal export file to view encrypted entries
                            </p>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                            >
                                Choose JSON File
                            </label>
                            {file && (
                                <div className="mt-4 text-sm text-gray-600">
                                    Selected: <span className="font-semibold">{file.name}</span>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm text-blue-800">
                                <strong>ℹ️ Note:</strong> You&apos;ll need the PIN that was used to encrypt this data.
                            </p>
                        </div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-md p-8">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">🔐</div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enter Decryption PIN</h2>
                            <p className="text-gray-600">
                                Enter the PIN to decrypt and view the journal entries
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-800">Export Date:</p>
                                    <p className="font-semibold text-gray-600">
                                        {new Date(exportData.exportDate).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-800">Entry Count:</p>
                                    <p className="font-semibold text-gray-600">{exportData.entryCount}</p>
                                </div>
                                <div>
                                    <p className="text-gray-800">Date Range:</p>
                                    <p className="font-semibold text-gray-600">
                                        {new Date(exportData.data.metadata.dateRange.from).toLocaleDateString()} -{' '}
                                        {new Date(exportData.data.metadata.dateRange.to).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-800">Algorithm:</p>
                                    <p className="font-semibold text-gray-600">{exportData.decryptionInfo.algorithm}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-950 mb-2">PIN</label>
                                <input
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 4-6 digit PIN"
                                    maxLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={handleDecrypt}
                                    disabled={pin.length < 4 || loading}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {loading ? 'Decrypting...' : 'Decrypt & View'}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        ✅ Successfully Decrypted
                                    </h2>
                                    <p className="text-gray-600 mt-1">{entries.length} entries loaded</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition-all"
                                >
                                    Load New File
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {entries.map((entry) => (
                                <div
                                    key={entry.id}
                                    onClick={() => setSelectedEntry(entry)}
                                    className={`bg-white rounded-xl shadow-sm p-4 border-l-4 cursor-pointer hover:shadow-md transition-all ${
                                        MOOD_COLOR[entry.mood]
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="text-4xl">{MOOD_EMOJI[entry.mood]}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800 capitalize">
                            {entry.mood}
                          </span>
                                                    <span className="text-gray-400">•</span>
                                                    <span className="text-sm text-gray-600">{formatDate(entry.date)}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{entry.comment}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">{entry.time}</p>
                                            <p className="text-sm text-gray-500">
                                                {entry.weather.description}, {entry.weather.temperature}°C
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {selectedEntry && (
                <div
                    onClick={() => setSelectedEntry(null)}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border-l-8 ${
                            MOOD_COLOR[selectedEntry.mood]
                        }`}
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-6xl">{MOOD_EMOJI[selectedEntry.mood]}</div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-800 capitalize">
                                        {selectedEntry.mood}
                                    </h3>
                                    <p className="text-gray-600">
                                        {formatDate(selectedEntry.date)} at {selectedEntry.time}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <span className="text-2xl">🌤️</span>
                                    <span className="font-semibold">{selectedEntry.weather.description}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>{selectedEntry.weather.temperature}°C</span>
                                </div>
                            </div>

                            {selectedEntry.comment && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">Comment:</h4>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {selectedEntry.comment}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedEntry(null)}
                                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-semibold transition-all"
                            >
                                Close
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
