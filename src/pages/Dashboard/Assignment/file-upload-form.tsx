import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  UploadCloud,
  XCircle,
  RefreshCw,
  Info,
  AlertCircle,
  FileJson,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FileUploadFormProps {
  acceptedFileTypes: string[];
  onClose: () => void;
  onSubmit: (files: File[], batchName: string) => void;
  gradingCriteria?: string;
  isQuizJson?: boolean;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({
  acceptedFileTypes = [],
  onClose,
  onSubmit,
  gradingCriteria,
  isQuizJson = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchName, setBatchName] = useState<string>('');
  const [processingSubmission, setProcessingSubmission] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'files' | 'json'>(
    isQuizJson ? 'json' : 'files'
  );
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [processedFiles, setProcessedFiles] = useState<File[]>([]);
  const [processingJson, setProcessingJson] = useState<boolean>(false);

  const validateFileType = (file: File): boolean => {
    if (uploadType === 'json') {
      return file.type === 'application/json' || file.name.endsWith('.json');
    }

    if (acceptedFileTypes.includes('audio/*')) {
      return file.type.startsWith('audio/');
    }
    if (acceptedFileTypes.includes('application/pdf')) {
      return file.type === 'application/pdf';
    }
    return false;
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);

      if (uploadType === 'json') {
        const jsonFiles = newFiles.filter(
          (file) =>
            file.type === 'application/json' || file.name.endsWith('.json')
        );

        if (jsonFiles.length > 0) {
          handleJsonFileUpload(jsonFiles[0]);
        } else {
          setError('Please upload a JSON file');
        }
        return;
      }

      const validFiles = newFiles.filter(validateFileType);
      const invalidFiles = newFiles.filter((file) => !validateFileType(file));

      if (invalidFiles.length > 0) {
        setError(
          `Some files were not added because they are not supported. Supported types: ${acceptedFileTypes.join(
            ', '
          )}`
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(validateFileType);
      const invalidFiles = newFiles.filter((file) => !validateFileType(file));

      if (invalidFiles.length > 0) {
        setError(
          `Some files were not added because they are not supported. Supported types: ${acceptedFileTypes.join(
            ', '
          )}`
        );
      }

      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const handleJsonFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleJsonFileUpload(file);
    }
  };

  const handleJsonFileUpload = (file: File): void => {
    if (!file || !file.name.endsWith('.json')) {
      setError('Please upload a valid JSON file');
      return;
    }

    setProcessingJson(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = e.target?.result as string;
        let jsonData = JSON.parse(jsonContent);

        // Handle case where data might be wrapped in an extra array
        if (
          Array.isArray(jsonData) &&
          jsonData.length === 1 &&
          Array.isArray(jsonData[0])
        ) {
          jsonData = jsonData[0];
        }

        if (!Array.isArray(jsonData)) {
          throw new Error(
            'Invalid JSON format. Expected an array of student data.'
          );
        }

        // Track name occurrences to handle duplicates
        const nameOccurrences: Record<string, number> = {};

        // Convert JSON objects to text files
        const files = jsonData.map((item, index) => {
          // Extract first name and last name for file naming only
          const lastName = item.lastname || '';
          const firstName = item.firstname || '';
          const studentName = `${firstName || ''} ${lastName || ''}`.trim();

          // Collect all fields dynamically with no filtering
          const fieldLines: string[] = [];

          // Add student name as the first line if available
          if (studentName) {
            fieldLines.push(`Student: ${studentName}`);
          }

          // Add all fields from the JSON object directly
          Object.keys(item).forEach((key) => {
            // Skip firstname and lastname as they're already in the Student line
            if (key !== 'firstname' && key !== 'lastname') {
              fieldLines.push(`${key}: ${item[key] || ''}`);
            }
          });

          // Join all lines into a single string
          const contentString = fieldLines.join('\n');

          // Create a File object
          const blob = new Blob([contentString], { type: 'text/plain' });

          // Generate filename in LastnameFirstname.txt format
          // Handle duplicates by adding attempt number
          let filename = '';
          if (lastName && firstName) {
            const nameKey = `${lastName}${firstName}`.toLowerCase();

            // Check if this name has occurred before
            if (nameKey in nameOccurrences) {
              nameOccurrences[nameKey]++;

              // First occurrence stays as LastnameFirstname
              // Second becomes LastnameFirstnameAttempt2
              // And so on
              if (nameOccurrences[nameKey] === 1) {
                filename = `${lastName}${firstName}.txt`;
              } else {
                filename = `${lastName}${firstName}Attempt${nameOccurrences[nameKey]}.txt`;
              }
            } else {
              // First time seeing this name
              nameOccurrences[nameKey] = 1;
              filename = `${lastName}${firstName}.txt`;
            }
          } else if (lastName) {
            filename = `${lastName}${index + 1}.txt`;
          } else if (firstName) {
            filename = `${firstName}${index + 1}.txt`;
          } else {
            filename = `student_${index + 1}.txt`;
          }

          return new File([blob], filename, { type: 'text/plain' });
        });

        setProcessedFiles(files);
        toast.success(`Processed ${files.length} student responses from JSON`);

        // If this is a quiz-json assignment, automatically set the batch name if not already set
        if (isQuizJson && !batchName) {
          const defaultBatchName = `Quiz Responses - ${new Date().toLocaleDateString()}`;
          setBatchName(defaultBatchName);
        }
      } catch (error) {
        console.error('Error processing JSON:', error);
        setError('Failed to process the JSON file. Please check the format.');
      } finally {
        setProcessingJson(false);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessAndSubmit = () => {
    if (processedFiles.length > 0) {
      handleSubmit();
    } else if (jsonFile) {
      // If we have a JSON file but it hasn't been processed yet, wait for processing to complete
      toast.info('Please wait for JSON processing to complete');
    } else {
      toast.error('Please upload a JSON file first');
    }
  };

  const removeFile = (index: number): void => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
    setError(null);
  };

  const handleSubmit = (): void => {
    if (!gradingCriteria?.trim()) {
      toast.error('Please set grading criteria before uploading files');
      return;
    }

    if (uploadType === 'files' && selectedFiles.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }

    if (uploadType === 'json' && processedFiles.length === 0) {
      toast.error('Please upload and process a JSON file');
      return;
    }

    setProcessingSubmission(true);
    setError(null);

    // Use the files based on the upload type
    const filesToSubmit =
      uploadType === 'json' ? processedFiles : selectedFiles;

    // Simulate API call delay
    setTimeout(() => {
      onSubmit(filesToSubmit, batchName);
      setProcessingSubmission(false);
    }, 1000);
  };

  const handleSelectFiles = () => {
    fileInputRef.current?.click();
  };

  const handleSelectJsonFile = () => {
    jsonFileInputRef.current?.click();
  };

  const handleTabChange = (value: string) => {
    setUploadType(value as 'files' | 'json');
    setError(null);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload Student Submissions</DialogTitle>
          <DialogDescription>
            Upload student submissions for AI-powered automatic grading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-name">Batch Name</Label>
            <Input
              id="batch-name"
              placeholder="E.g., Section A Submissions"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>

          <Tabs
            defaultValue={isQuizJson ? 'json' : 'files'}
            onValueChange={handleTabChange}
          >
            {!isQuizJson && (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="files">Individual Files</TabsTrigger>
                <TabsTrigger value="json">Quiz JSON</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="files">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center">
                  <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Drag and drop student submissions here, or click to select
                    files
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Accepted file types: {acceptedFileTypes.join(', ')}
                  </p>
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    accept={acceptedFileTypes.join(',')}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={handleSelectFiles}
                  >
                    Select Files
                  </Button>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="border rounded-lg overflow-hidden mt-4">
                  <div className="bg-gray-50 px-4 py-2 text-sm font-medium">
                    Selected Files ({selectedFiles.length})
                  </div>
                  <div className="divide-y max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <XCircle className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="json">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center">
                  <FileJson className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-2">
                    Upload a JSON file containing quiz responses
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Each JSON object will be converted to a separate text file
                  </p>
                  <Input
                    ref={jsonFileInputRef}
                    id="json-upload"
                    type="file"
                    className="hidden"
                    onChange={handleJsonFileChange}
                    accept=".json,application/json"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={handleSelectJsonFile}
                    disabled={processingJson}
                  >
                    {processingJson ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Select JSON File'
                    )}
                  </Button>
                </div>
              </div>

              {jsonFile && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FileJson className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{jsonFile.name}</p>
                      <p className="text-xs text-blue-700">
                        {processedFiles.length > 0
                          ? `Processed ${processedFiles.length} student responses`
                          : 'Processing...'}
                      </p>
                    </div>
                    {processedFiles.length > 0 && isQuizJson && (
                      <Button
                        size="sm"
                        className="text-xs"
                        onClick={handleProcessAndSubmit}
                      >
                        Upload & Grade
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {processedFiles.length > 0 && (
                <div className="border rounded-lg overflow-hidden mt-4">
                  <div className="bg-gray-50 px-4 py-2 text-sm font-medium">
                    Processed Files ({processedFiles.length})
                  </div>
                  <div className="divide-y max-h-40 overflow-y-auto">
                    {processedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">
                  {uploadType === 'json'
                    ? 'JSON files should contain an array of student response objects.'
                    : 'For best results, ensure student files follow a consistent naming format.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processingSubmission}
          >
            Cancel
          </Button>
          <Button
            disabled={
              (uploadType === 'files' && selectedFiles.length === 0) ||
              (uploadType === 'json' && processedFiles.length === 0) ||
              processingSubmission
            }
            onClick={handleSubmit}
          >
            {processingSubmission ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Upload & Start Grading'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
