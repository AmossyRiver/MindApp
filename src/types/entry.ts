export interface MentalHealthEntry {
    id: string;
    mood: string; // emoji or mood identifier
    comment: string;
    weather: WeatherData;
    timestamp: Date;
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
