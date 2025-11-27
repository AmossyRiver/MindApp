import { getConfig, initializeStorage } from '@/lib/storage/storage';
import { verifyPIN } from '@/lib/crypto/encryption';

export async function isPINSet(): Promise<boolean> {
    const config = await getConfig();
    return config !== null;
}

export async function setupPIN(pin: string): Promise<void> {
    if (pin.length < 4) {
        throw new Error('PIN must be at least 4 digits');
    }

    await initializeStorage(pin);
}

export async function validatePIN(pin: string): Promise<boolean> {
    const config = await getConfig();

    if (!config) return false;

    return verifyPIN(pin, config.pinHash, config.salt);
}

export function validatePINFormat(pin: string): boolean {
    return /^\d{4,6}$/.test(pin);
}
