// Add this to your progress display section
{
  uploadProgress.map((item) => (
    <div key={item.id} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{item.file.name}</span>
        <div className="flex items-center space-x-2">
          {item.status === "completed" && (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          {item.status === "error" && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-gray-500">
            {Math.round(item.progress)}%
          </span>
        </div>
      </div>
      {/* ... rest remains the same */}
    </div>
  ));
}

// changes

// ... existing imports
import { useAppDispatch } from "../../store/hooks";
import {
  removeFileFromUpload,
  clearAllFiles,
} from "../../store/slices/assetsSlice";

// Inside the component:
const dispatch = useAppDispatch();

// Update the removeFile function:
const removeFile = (id: string) => {
  dispatch(removeFileFromUpload(id));
};

// Update the clearFiles function:
const clearFiles = () => {
  dispatch(clearAllFiles());
};

// Update the JSX to use id instead of index:
{
  selectedFiles.map((file, index) => {
    // You'll need to get the id from your Redux state or generate it consistently
    const item = uploadProgress.find((item) => item.file.name === file.name);
    const id = item?.id || `temp-${index}`;

    return (
      <div
        key={id}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        {/* ... rest of the code */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeFile(id)}
          className="p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  });
}
