import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadAssets } from '../hooks/useAssets';
import type { UploadProgress } from '../types';
import { generateId } from '../utils/helpers';
import UploadZone from '../components/upload/UploadZone';

const Upload: React.FC = () => {
    const navigate = useNavigate();
    const uploadMutation = useUploadAssets();
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

    const handleUpload = async (files: File[]) => {
        // Initialize progress for all files
        const progressItems: UploadProgress[] = files.map(file => ({
            id: generateId(),
            file,
            progress: 0,
            status: 'pending'
        }));

        setUploadProgress(progressItems);

        try {
            // Start upload
            setUploadProgress(prev =>
                prev.map(item => ({ ...item, status: 'uploading' as const }))
            );

            // Use the new upload functionality
            await uploadMutation.mutateAsync(
                { files, onProgress: updateFileProgress },
                {
                    onSuccess: () => {
                        // Mark all as completed
                        setUploadProgress(prev =>
                            prev.map(item => ({ ...item, status: 'completed' as const, progress: 100 }))
                        );

                        // Clear after a delay and redirect
                        setTimeout(() => {
                            setUploadProgress([]);
                            navigate('/gallery');
                        }, 2000);
                    },
                    onError: (error) => {
                        // Mark all as failed
                        setUploadProgress(prev =>
                            prev.map(item => ({
                                ...item,
                                status: 'error' as const,
                                error: 'Upload failed'
                            }))
                        );
                    }
                }
            );
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const updateFileProgress = (fileName: string, progress: number) => {
        setUploadProgress(prev =>
            prev.map(item =>
                item.file.name === fileName
                    ? { ...item, progress }
                    : item
            )
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Upload Assets</h1>
                <p className="text-gray-600 mt-2">
                    Add new files to your asset library. Supported formats: Images, Videos, Documents, and Audio files.
                </p>
            </div>

            <UploadZone
                onUpload={handleUpload}
                isUploading={uploadMutation.isPending}
                uploadProgress={uploadProgress}
            />
        </div>
    );
};

export default Upload;