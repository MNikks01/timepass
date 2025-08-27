import { createAsyncThunk } from '@reduxjs/toolkit';

// Types
export interface PresignResponse {
    url: string;
    key: string;
}

export interface ConfirmUploadPayload {
    key: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
    tags: string[];
    category: string;
}

// API calls
export const getPresignedUrl = async (fileName: string): Promise<PresignResponse> => {
    const response = await fetch("http://localhost:5000/api/v1/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
        throw new Error(`Failed to get presigned URL for ${fileName}`);
    }

    return response.json();
};

export const confirmUpload = async (payload: ConfirmUploadPayload): Promise<void> => {
    const response = await fetch("http://localhost:5000/api/v1/storage/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Failed to confirm upload for ${payload.fileName}`);
    }
};

// Async thunk for uploading a file
export const uploadFile = createAsyncThunk(
    'assets/uploadFile',
    async (
        { file, onProgress }: { file: File; onProgress?: (progress: number) => void },
        { rejectWithValue }
    ) => {
        try {
            // Step 1: Get presigned URL
            const { url, key } = await getPresignedUrl(file.name);

            // Step 2: Upload via XHR
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", url, true);
                xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percent = (event.loaded / event.total) * 100;
                        onProgress(percent);
                    }
                };

                xhr.onload = async () => {
                    if (xhr.status === 200) {
                        // Step 3: Confirm with backend
                        try {
                            await confirmUpload({
                                key,
                                fileName: file.name,
                                originalName: file.name,
                                mimeType: file.type,
                                size: file.size,
                                tags: [],
                                category: file.type.split('/')[0] || 'other',
                            });
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    } else {
                        reject(new Error(`Upload failed for ${file.name}`));
                    }
                };

                xhr.onerror = () => reject(new Error(`Network error during upload of ${file.name}`));
                xhr.send(file);
            });

            return { fileName: file.name };
        } catch (error: any) {
            return rejectWithValue({
                fileName: file.name,
                error: error.message || 'Upload failed'
            });
        }
    }
);