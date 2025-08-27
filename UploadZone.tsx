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
