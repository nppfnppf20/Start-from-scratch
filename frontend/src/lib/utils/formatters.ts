    /**
     * Formats file size in bytes to a human-readable string (KB, MB, GB, etc.).
     * @param bytes - The file size in bytes.
     * @param decimals - The number of decimal places to include.
     * @returns A formatted string representing the file size.
     */
    export function formatBytes(bytes: number | undefined | null, decimals = 2): string {
        if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes'; // Handle undefined/null

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        // Ensure index is within bounds, fallback to Bytes if calculation is off (e.g., negative bytes)
        const unit = sizes[i] || sizes[0]; 
        const value = i >= 0 ? parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) : bytes;

        return `${value} ${unit}`;
    }

    // You can add other formatting utility functions here later