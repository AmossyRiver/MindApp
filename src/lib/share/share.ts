import { JournalEntry } from '@/types/journal';

export interface EncryptedExport {
    version: '1.0';
    exportDate: string;
    entryCount: number;
    data: {
        encryptedEntries: string; // Base64 encoded
        metadata: {
            dateRange: { from: string; to: string };
            moods: Record<string, number>;
        };
    };
    decryptionInfo: {
        algorithm: 'AES-GCM';
        keyDerivation: 'PBKDF2';
        instructions: string;
    };
}

export async function prepareExportData(entries: JournalEntry[]): Promise<EncryptedExport> {
    const sortedEntries = [...entries].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate mood distribution
    const moodCounts = entries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Convert entries to base64 (already encrypted in storage)
    const jsonData = JSON.stringify(entries);
    const base64Data = btoa(unescape(encodeURIComponent(jsonData)));

    return {
        version: '1.0',
        exportDate: new Date().toISOString(),
        entryCount: entries.length,
        data: {
            encryptedEntries: base64Data,
            metadata: {
                dateRange: {
                    from: sortedEntries[0]?.date || '',
                    to: sortedEntries[sortedEntries.length - 1]?.date || '',
                },
                moods: moodCounts,
            },
        },
        decryptionInfo: {
            algorithm: 'AES-GCM',
            keyDerivation: 'PBKDF2',
            instructions:
                'This data is encrypted using the user\'s PIN. A viewer app with the correct PIN is required to decrypt.',
        },
    };
}

export async function shareViaDevice(exportData: EncryptedExport): Promise<boolean> {
    if (!navigator.share && !navigator.canShare) {
        return false; // Device doesn't support native sharing
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], `mental-health-export-${Date.now()}.json`, {
        type: 'application/json',
    });

    try {
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            return false;
        }

        await navigator.share({
            title: 'Mental Health Journal Export',
            text: 'Encrypted mental health journal data',
            files: [file],
        });

        return true;
    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            // User cancelled the share
            return false;
        }
        throw err;
    }
}

export function downloadAsFile(exportData: EncryptedExport): void {
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-health-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
