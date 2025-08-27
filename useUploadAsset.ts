import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

interface UploadOptions {
    files: File[];
    onProgress?: (fileName: string, progress: number) => void;
}

export const useUploadAssets = () => {
    return useMutation({
        mutationFn: async ({ files, onProgress }: UploadOptions) => {
            for (const file of files) {
                try {
                    // Step 1: Get presigned URL
                    const res = await fetch("http://localhost:5000/api/v1/storage/presign", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ fileName: file.name }),
                    });

                    if (!res.ok) {
                        throw new Error(`Failed to get presigned URL for ${file.name}`);
                    }

                    const { url, key } = await res.json();

                    // Step 2: Upload via XHR
                    await new Promise<void>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", url, true);
                        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

                        xhr.upload.onprogress = (event) => {
                            if (event.lengthComputable && onProgress) {
                                const percent = (event.loaded / event.total) * 100;
                                onProgress(file.name, percent);
                            }
                        };

                        xhr.onload = async () => {
                            if (xhr.status === 200) {
                                // Step 3: Confirm with backend
                                try {
                                    const confirmRes = await fetch("http://localhost:5000/api/v1/storage/confirm", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            key,
                                            fileName: file.name,
                                            originalName: file.name,
                                            mimeType: file.type,
                                            size: file.size,
                                            tags: [],
                                            category: "image", // You might want to detect this dynamically
                                        }),
                                    });

                                    if (!confirmRes.ok) {
                                        throw new Error(`Failed to confirm upload for ${file.name}`);
                                    }
                                } catch (err) {
                                    console.error(`Error confirming ${file.name}`, err);
                                    reject(err);
                                    return;
                                }

                                resolve();
                            } else {
                                reject(new Error(`Upload failed for ${file.name}`));
                            }
                        };

                        xhr.onerror = () => reject(new Error(`Network error during upload of ${file.name}`));

                        xhr.send(file);
                    });

                } catch (err) {
                    console.error(`Error uploading ${file.name}:`, err);
                    throw err;
                }
            }
        },
    });
};