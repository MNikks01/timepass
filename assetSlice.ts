import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { uploadFile } from './assets.api';
import { generateId } from '../utils/helpers';

export interface UploadProgress {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

interface AssetsState {
    uploadProgress: UploadProgress[];
    isUploading: boolean;
}

const initialState: AssetsState = {
    uploadProgress: [],
    isUploading: false,
};

const assetsSlice = createSlice({
    name: 'assets',
    initialState,
    reducers: {
        addFilesToUpload: (state, action: PayloadAction<File[]>) => {
            const newFiles = action.payload.map(file => ({
                id: generateId(),
                file,
                progress: 0,
                status: 'pending' as const,
            }));

            state.uploadProgress = [...state.uploadProgress, ...newFiles];
        },
        removeFileFromUpload: (state, action: PayloadAction<string>) => {
            state.uploadProgress = state.uploadProgress.filter(
                item => item.id !== action.payload
            );
        },
        clearAllFiles: (state) => {
            state.uploadProgress = [];
        },
        updateFileProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
            const item = state.uploadProgress.find(item => item.id === action.payload.id);
            if (item) {
                item.progress = action.payload.progress;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Upload file pending
            .addCase(uploadFile.pending, (state, action) => {
                const { id } = action.meta.arg;
                const item = state.uploadProgress.find(item => item.id === id);
                if (item) {
                    item.status = 'uploading';
                }
                state.isUploading = true;
            })
            // Upload file fulfilled
            .addCase(uploadFile.fulfilled, (state, action) => {
                const { fileName } = action.payload;
                const item = state.uploadProgress.find(item => item.file.name === fileName);
                if (item) {
                    item.status = 'completed';
                    item.progress = 100;
                }
                state.isUploading = state.uploadProgress.some(item => item.status === 'uploading');
            })
            // Upload file rejected
            .addCase(uploadFile.rejected, (state, action) => {
                const { fileName, error } = action.payload as { fileName: string; error: string };
                const item = state.uploadProgress.find(item => item.file.name === fileName);
                if (item) {
                    item.status = 'error';
                    item.error = error;
                }
                state.isUploading = state.uploadProgress.some(item => item.status === 'uploading');
            });
    },
});

export const {
    addFilesToUpload,
    removeFileFromUpload,
    clearAllFiles,
    updateFileProgress
} = assetsSlice.actions;

export default assetsSlice.reducer;