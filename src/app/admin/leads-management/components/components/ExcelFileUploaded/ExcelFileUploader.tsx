import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import ColumnMappingModal from "./components/ColumnMappingModal";
import useImportLeadsData from "../../../hooks/useImportLeadsData";

interface ExcelFileUploaderProps {
  onUploadSuccess: (data: any[]) => void;
  onUploadError: (error: string) => void;
}

const ExcelFileUploader: React.FC<ExcelFileUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);

  // Use the import hook for handling API operations
  const { importLeads, isImporting } = useImportLeadsData({
    onSuccess: (data: any[]) => {
      onUploadSuccess(data);
    },
    onError: (message: string) => {
      onUploadError(message);
    },
  });

  // Process the uploaded Excel file
  const processExcelFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setFileName(file.name);

      try {
        const data = await readExcelFile(file);

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Invalid data format in Excel file");
        }

        const headers = Object.keys(data[0]);
        setSourceHeaders(headers);
        setSampleData(data.slice(0, 5)); // First 5 rows for preview
        setRawData(data);
        setShowMappingModal(true);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        onUploadError(
          error instanceof Error
            ? error.message
            : "Unknown error processing file"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [onUploadError]
  );

  // Read Excel file and convert to JSON
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  // Handle user's column mapping confirmation
  const handleMappingConfirm = async (mappings: Record<string, string>) => {
    // Transform data based on mappings
    const transformedData = rawData.map((row, index) => {
      const newRow: Record<string, any> = {
        id: index + 1,
        uploadedAt: new Date().toISOString(),
      };

      Object.entries(mappings).forEach(([sourceField, targetField]) => {
        if (targetField) {
          newRow[targetField] =
            row[sourceField] !== undefined ? row[sourceField] : null;
        }
      });

      return newRow;
    });

    setShowMappingModal(false);
    await importLeads(transformedData);
  };

  // Handle file drop event
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (
          file.type ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.type === "application/vnd.ms-excel" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        ) {
          processExcelFile(file);
        } else {
          onUploadError("Please upload a valid Excel file (.xlsx or .xls)");
        }
      }
    },
    [processExcelFile, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
  });

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Upload Contacts Excel File
        </h3>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
        >
          <input {...getInputProps()} />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm text-gray-600">Processing {fileName}...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>

              {isDragActive ? (
                <p className="text-blue-600 font-medium">
                  Drop the Excel file here
                </p>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-1">
                    Drag & drop an Excel file here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: .xlsx, .xls (Max 5MB)
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {isImporting && (
          <div className="mt-4 flex items-center justify-center text-blue-600">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-2"></div>
            <span>Importing data...</span>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <span className="font-semibold">Note:</span> Map your Excel columns
            to the system
          </p>
        </div>
      </div>

      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        sourceHeaders={sourceHeaders}
        sampleData={sampleData}
        onConfirm={handleMappingConfirm}
      />
    </>
  );
};

export default ExcelFileUploader;
