import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Promisify fs functions
const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

/**
 * Generates a waveform image from an audio file
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @returns Path to the generated waveform image
 */
export const generateWaveform = async (audioPath: string, assetId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Create temporary directory if it doesn't exist
        const tempDir = '/tmp/waveforms';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}_waveform.png`);

        console.log(`Generating waveform for ${audioPath} -> ${outputPath}`);

        // Use FFmpeg to generate waveform
        ffmpeg(audioPath)
            .complexFilter([
                // Convert to mono and apply compression for better visualization
                'aformat=channel_layouts=mono',
                'compand=attacks=0.02:decays=0.1:points=-80/-80|-30/-12|0/0',
                // Generate waveform with specified dimensions and color
                'showwavespic=s=1200x120:colors=#007bff'
            ])
            .frames(1) // Generate a single frame
            .output(outputPath)
            .on('start', (commandLine) => {
                console.log('FFmpeg command:', commandLine);
            })
            .on('end', () => {
                console.log('Waveform generation completed');
                // Verify the file was created
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Waveform file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error generating waveform:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Alternative waveform generation method using showwaves filter
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @returns Path to the generated waveform image
 */
export const generateWaveformAlternative = async (audioPath: string, assetId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tempDir = '/tmp/waveforms';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}_waveform_alt.png`);

        console.log(`Generating alternative waveform for ${audioPath}`);

        // Alternative approach using showwaves filter
        ffmpeg(audioPath)
            .outputOptions([
                '-filter_complex',
                '[0:a]aformat=channel_layouts=mono,compand=attacks=0.02:decays=0.1:points=-80/-80|-30/-12|0/0,showwaves=s=1200x120:mode=line:colors=#007bff[wave]',
                '-map', '[wave]',
                '-frames:v', '1'
            ])
            .output(outputPath)
            .on('end', () => {
                console.log('Alternative waveform generation completed');
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Alternative waveform file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error generating alternative waveform:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Generates a spectrogram for audio files
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @returns Path to the generated spectrogram image
 */
export const generateSpectrogram = async (audioPath: string, assetId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tempDir = '/tmp/spectrograms';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}_spectrogram.png`);

        console.log(`Generating spectrogram for ${audioPath}`);

        ffmpeg(audioPath)
            .outputOptions([
                '-lavfi',
                'showspectrumpic=s=1200x600:color=fire:scale=log'
            ])
            .output(outputPath)
            .on('end', () => {
                console.log('Spectrogram generation completed');
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Spectrogram file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error generating spectrogram:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Extracts audio metadata using FFprobe
 * @param audioPath Path to the audio file
 * @returns Audio metadata
 */
export const getAudioMetadata = async (audioPath: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata);
            }
        });
    });
};

/**
 * Converts audio to different formats if needed
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @param format Target format (mp3, ogg, etc.)
 * @returns Path to the converted audio file
 */
export const convertAudioFormat = async (
    audioPath: string,
    assetId: string,
    format: string = 'mp3'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tempDir = '/tmp/converted';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}.${format}`);

        console.log(`Converting audio to ${format} format`);

        ffmpeg(audioPath)
            .output(outputPath)
            .audioCodec(format === 'mp3' ? 'libmp3lame' : 'libvorbis')
            .audioBitrate('128k')
            .on('end', () => {
                console.log(`Audio conversion to ${format} completed`);
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Converted audio file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error converting audio:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Extracts a segment of audio for preview
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @param duration Duration of the preview in seconds (default: 30)
 * @returns Path to the preview audio file
 */
export const createAudioPreview = async (
    audioPath: string,
    assetId: string,
    duration: number = 30
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tempDir = '/tmp/previews';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}_preview.mp3`);

        console.log(`Creating ${duration}s audio preview`);

        ffmpeg(audioPath)
            .output(outputPath)
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .duration(duration)
            .on('end', () => {
                console.log('Audio preview creation completed');
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Audio preview file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error creating audio preview:', err);
                reject(err);
            })
            .run();
    });
};

/**
 * Normalizes audio volume
 * @param audioPath Path to the audio file
 * @param assetId Unique identifier for the asset
 * @returns Path to the normalized audio file
 */
export const normalizeAudio = async (audioPath: string, assetId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const tempDir = '/tmp/normalized';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputPath = path.join(tempDir, `${assetId}_normalized.mp3`);

        console.log('Normalizing audio volume');

        ffmpeg(audioPath)
            .output(outputPath)
            .audioFilters('loudnorm')
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .on('end', () => {
                console.log('Audio normalization completed');
                if (fs.existsSync(outputPath)) {
                    resolve(outputPath);
                } else {
                    reject(new Error('Normalized audio file was not created'));
                }
            })
            .on('error', (err) => {
                console.error('Error normalizing audio:', err);
                reject(err);
            })
            .run();
    });
};

// Utility function to clean up temporary files
export const cleanupTempFiles = async (filePaths: string[]): Promise<void> => {
    for (const filePath of filePaths) {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up temporary file: ${filePath}`);
            } catch (error) {
                console.warn(`Could not delete temporary file ${filePath}:`, error);
            }
        }
    }
};

// Utility function to get audio duration
export const getAudioDuration = async (audioPath: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration || 0);
            }
        });
    });
};

export default {
    generateWaveform,
    generateWaveformAlternative,
    generateSpectrogram,
    getAudioMetadata,
    convertAudioFormat,
    createAudioPreview,
    normalizeAudio,
    cleanupTempFiles,
    getAudioDuration
};