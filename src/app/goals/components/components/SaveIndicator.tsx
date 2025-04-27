import React from "react";

interface SaveIndicatorProps {
  isSaving: boolean;
  hasPendingChanges: boolean;
}

const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  isSaving,
  hasPendingChanges,
}) => {
  if (!isSaving && !hasPendingChanges) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2">
      {isSaving ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-blue-950 rounded-full border-t-transparent"></div>
          <span className="text-sm text-gray-600">Saving changes...</span>
        </>
      ) : hasPendingChanges ? (
        <span className="text-sm text-amber-600">Unsaved changes</span>
      ) : null}
    </div>
  );
};

export default SaveIndicator;
