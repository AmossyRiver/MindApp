import { openDB, IDBPDatabase } from 'idb';
import type { JournalEntry, StorageConfig } from '@/types/journal';
import { encryptEntry, decryptEntry, generateSalt, hashPIN } from '@/lib/crypto/encryption';

const DB_NAME = 'mental-health-pwa';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const CONFIG_STORE = 'config';

let dbInstance: IDBPDatabase | null = null;

function serializeUint8Array(arr: Uint8Array): number[] {
    return Array.from(arr);
}

function deserializeUint8Array(arr: number[]): Uint8Array {
    return new Uint8Array(arr);
}

async function getDB(): Promise<IDBPDatabase> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
                const entriesStore = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' });
                entriesStore.createIndex('timestamp', 'timestamp');
            }
            if (!db.objectStoreNames.contains(CONFIG_STORE)) {
                db.createObjectStore(CONFIG_STORE);
            }
        },
    });

    return dbInstance;
}

export async function saveEntry(entry: JournalEntry, pin: string): Promise<void> {
    console.log('💾 Saving entry...');
    const db = await getDB();
    const config = await getConfig();

    if (!config) throw new Error('PIN not configured');

    const { encryptedData, iv } = await encryptEntry(entry, pin, config.salt);

    const encryptedEntry = {
        id: entry.id,
        encryptedData: serializeUint8Array(new Uint8Array(encryptedData)),
        iv: serializeUint8Array(iv),
        salt: serializeUint8Array(config.salt),
        timestamp: entry.timestamp
    };

    await db.put(ENTRIES_STORE, encryptedEntry);
    console.log('✅ Entry saved');
}

export async function getAllEntries(pin: string): Promise<JournalEntry[]> {
    console.log('📖 Loading entries...');
    const db = await getDB();
    const config = await getConfig();

    if (!config) throw new Error('PIN not configured');

    const encryptedEntries = await db.getAllFromIndex(ENTRIES_STORE, 'timestamp');

    const decryptedEntries = await Promise.all(
        encryptedEntries.reverse().map(async (entry: any) => {
            const encryptedData = new Uint8Array(entry.encryptedData).buffer;
            const iv = deserializeUint8Array(entry.iv);
            const decrypted = await decryptEntry(encryptedData, iv, pin, config.salt);
            return decrypted as JournalEntry;
        })
    );

    console.log(`✅ Loaded ${decryptedEntries.length} entries`);
    return decryptedEntries;
}

export async function deleteEntry(entryId: string): Promise<void> {
    console.log('🗑️ Deleting entry:', entryId);
    const db = await getDB();
    await db.delete(ENTRIES_STORE, entryId);
    console.log('✅ Entry deleted');
}

export async function getConfig(): Promise<StorageConfig | null> {
    const db = await getDB();
    const storedConfig = await db.get(CONFIG_STORE, 'config');

    if (!storedConfig) return null;

    return {
        pinHash: storedConfig.pinHash,
        salt: deserializeUint8Array(storedConfig.salt),
        backupEnabled: storedConfig.backupEnabled
    };
}

export async function saveConfig(config: StorageConfig): Promise<void> {
    const db = await getDB();
    const serializableConfig = {
        pinHash: config.pinHash,
        salt: serializeUint8Array(config.salt),
        backupEnabled: config.backupEnabled
    };
    await db.put(CONFIG_STORE, serializableConfig, 'config');
}

export async function initializeStorage(pin: string): Promise<void> {
    const salt = generateSalt();
    const pinHash = await hashPIN(pin, salt);

    const config: StorageConfig = {
        pinHash,
        salt,
        backupEnabled: false
    };

    await saveConfig(config);
}

export async function clearAllData(): Promise<void> {
    const db = await getDB();
    await db.clear(ENTRIES_STORE);
    await db.clear(CONFIG_STORE);
    console.log('✅ All data cleared from IndexedDB');
}
