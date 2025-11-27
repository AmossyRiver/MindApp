export type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export interface JournalEntry {
    id: string;
    mood: Mood;
    comment: string;
    date: string; // ISO string (YYYY-MM-DD)
    time: string; // HH:mm format
    weather: WeatherData;
    timestamp: number;
}

export interface WeatherData {
    description: string;
    temperature: number;
    icon?: string;
}

export interface EncryptedEntry {
    id: string;
    encryptedData: ArrayBuffer;
    iv: Uint8Array;
    salt: Uint8Array;
    createdAt: Date;
}

export interface StorageConfig {
    pinHash: string;
    salt: Uint8Array;
    backupEnabled: boolean;
}

// Legacy alias for backward compatibility (if needed)
export type MentalHealthEntry = JournalEntry;
