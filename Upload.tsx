import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addFilesToUpload, clearAllFiles } from "../store/slices/assetsSlice";
import { uploadFile } from "../store/api/assets.api";
import type { UploadProgress } from "../types";
import UploadZone from "../components/upload/UploadZone";

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { uploadProgress, isUploading } = useAppSelector(
    (state) => state.assets
  );

  const handleUpload = async (files: File[]) => {
    // Add files to Redux store
    dispatch(addFilesToUpload(files));

    // Start uploading each file
    files.forEach((file) => {
      // Find the item in the uploadProgress array by file name
      const item = uploadProgress.find((item) => item.file.name === file.name);
      if (item) {
        dispatch(
          uploadFile({
            file,
            id: item.id,
            onProgress: (progress) => {
              // You might need to create a separate action for progress updates
              // or handle this differently
            },
          })
        );
      }
    });
  };

  // Effect to navigate when all uploads are complete
  useEffect(() => {
    if (
      uploadProgress.length > 0 &&
      !isUploading &&
      uploadProgress.every(
        (item) => item.status === "completed" || item.status === "error"
      )
    ) {
      // Clear after a delay and redirect
      const timer = setTimeout(() => {
        dispatch(clearAllFiles());
        navigate("/gallery");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [uploadProgress, isUploading, navigate, dispatch]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Assets</h1>
        <p className="text-gray-600 mt-2">
          Add new files to your asset library. Supported formats: Images,
          Videos, Documents, and Audio files.
        </p>
      </div>

      <UploadZone
        onUpload={handleUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};

export default Upload;
