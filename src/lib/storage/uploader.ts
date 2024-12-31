import {promises as fs} from 'fs';
import {join} from 'path';
import {GetTimestamp} from "../helper/common";

type UploadedFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};

// Use the LOCAL_STORAGE_PATH from .env for local storage destination
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || 'files/images';

// Function to normalize the path to use forward slashes
const normalizePath = (filePath: string) => {
    return filePath.replace(/\\+/g, '/');
};

// Handle upload to GCS or Local based on .env setting
export const UploadFile = async (file: UploadedFile): Promise<string> => {
    const storageType = process.env.STORAGE || 'local';

    if (storageType.toLowerCase() === 'local') {
        return await UploadToLocal(file);
    } else {
        return await UploadToLocal(file);
    }
};

// Upload to Local Storage
export const UploadToLocal = async (file: UploadedFile): Promise<string> => {
    const timestamp = await GetTimestamp();
    const newFilename = `${timestamp}_${file.originalname}`;

    const destinationPath = join(LOCAL_STORAGE_PATH, newFilename);

    // Ensure the destination directory exists
    await fs.mkdir(LOCAL_STORAGE_PATH, {recursive: true});

    // Normalize the path to use forward slashes
    const normalizedPath = normalizePath(destinationPath);

    // Write file to the destination path
    await fs.writeFile(normalizedPath, file.buffer);

    return normalizedPath;
};

// Get file from Local Storage
export const GetFileFromLocal = async (filename: string): Promise<Buffer | null> => {
    try {
        const filePath = join(LOCAL_STORAGE_PATH, filename);
        const normalizedPath = normalizePath(filePath);

        // Check if the file exists and read its content
        return await fs.readFile(normalizedPath);
    } catch (error) {
        console.error(`Error reading file from local storage: ${error}`);
        return null;
    }
};
