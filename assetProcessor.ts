// ... existing imports ...
import audioProcessor from '../utils/audioProcessor';

// ... existing code ...

const processAudio = async (filePath: string, assetId: string, originalName: string): Promise<Record<string, string>> => {
    const bucketName = process.env.MINIO_BUCKET || 'assets';
    const baseName = path.parse(originalName).name;
    const versions: Record<string, string> = {};

    try {
        // Generate waveform image
        const waveformPath = await audioProcessor.generateWaveform(filePath, assetId);
        const waveformKey = `waveforms/${assetId}/${baseName}.png`;
        await minioClient.fPutObject(bucketName, waveformKey, waveformPath, {
            'Content-Type': 'image/png',
            'x-amz-meta-asset-id': assetId,
        });
        versions.waveform = waveformKey;

        // Clean up temporary waveform file
        await audioProcessor.cleanupTempFiles([waveformPath]);

        // Generate spectrogram (optional)
        try {
            const spectrogramPath = await audioProcessor.generateSpectrogram(filePath, assetId);
            const spectrogramKey = `spectrograms/${assetId}/${baseName}.png`;
            await minioClient.fPutObject(bucketName, spectrogramKey, spectrogramPath, {
                'Content-Type': 'image/png',
                'x-amz-meta-asset-id': assetId,
            });
            versions.spectrogram = spectrogramKey;

            // Clean up temporary spectrogram file
            await audioProcessor.cleanupTempFiles([spectrogramPath]);
        } catch (error) {
            console.warn('Could not generate spectrogram:', error);
        }

        // Create audio preview (optional)
        try {
            const previewPath = await audioProcessor.createAudioPreview(filePath, assetId, 30);
            const previewKey = `previews/${assetId}/${baseName}.mp3`;
            await minioClient.fPutObject(bucketName, previewKey, previewPath, {
                'Content-Type': 'audio/mpeg',
                'x-amz-meta-asset-id': assetId,
            });
            versions.preview = previewKey;

            // Clean up temporary preview file
            await audioProcessor.cleanupTempFiles([previewPath]);
        } catch (error) {
            console.warn('Could not create audio preview:', error);
        }

    } catch (error) {
        console.warn('Could not generate audio visualizations:', error);

        // Try alternative waveform generation
        try {
            const waveformPath = await audioProcessor.generateWaveformAlternative(filePath, assetId);
            const waveformKey = `waveforms/${assetId}/${baseName}.png`;
            await minioClient.fPutObject(bucketName, waveformKey, waveformPath, {
                'Content-Type': 'image/png',
                'x-amz-meta-asset-id': assetId,
            });
            versions.waveform = waveformKey;

            // Clean up temporary waveform file
            await audioProcessor.cleanupTempFiles([waveformPath]);
        } catch (fallbackError) {
            console.warn('Could not generate waveform with alternative method:', fallbackError);
        }
    }

    return versions;
};

// ... existing code ...