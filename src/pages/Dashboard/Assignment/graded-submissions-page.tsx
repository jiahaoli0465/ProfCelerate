import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  FileText,
  Download,
  Trash2,
  MoreVertical,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { transformToCamelCase } from '@/lib/caseConversion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { deleteSubmissionBatch } from '@/lib/deleteOperations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';

interface GradingResult {
  question: string;
  mistakes: string[];
  score: number;
  feedback: string;
}

interface GradedSubmission {
  id: string;
  fileName: string;
  totalScore: number;
  createdAt: string;
  results: GradingResult[];
  overallFeedback: string;
  submissionId: string;
  totalPoints?: number;
  fileContent: string;
}

interface SubmissionResult {
  id: string;
  file_name: string;
  file_content: string;
  grading_results: {
    totalScore: number;
    results: GradingResult[];
    overallFeedback: string;
  };
  created_at: string;
  submission_id: string;
}

const downloadFile = (submission: GradedSubmission) => {
  try {
    // Verify that the content is a valid base64 data URL
    if (!submission.fileContent.startsWith('data:')) {
      throw new Error('Invalid file content format');
    }

    // Extract the MIME type and base64 data
    const [header, base64Data] = submission.fileContent.split(',');
    if (!base64Data) {
      throw new Error('Invalid base64 data format');
    }

    const mimeType =
      header.split(':')[1]?.split(';')[0] || 'application/octet-stream';

    // Convert base64 to blob
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (e) {
      console.error('Error processing base64 data:', e);
      throw new Error('Failed to process file data');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('Failed to download file. Please try again.');
  }
};

export const GradedSubmissionsPage: React.FC = () => {
  const { classId, assignmentId, submissionId } = useParams<{
    classId: string;
    assignmentId: string;
    submissionId: string;
  }>();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<GradedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<GradedSubmission | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showDeleteBatchAlert, setShowDeleteBatchAlert] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;

    const query = searchQuery.toLowerCase().trim();
    return submissions.filter((submission) =>
      submission.fileName.toLowerCase().includes(query)
    );
  }, [submissions, searchQuery]);

  useEffect(() => {
    if (submissionId) {
      fetchGradedSubmissions();
    }
  }, [submissionId]);

  const fetchSubmissionPoints = async (submissionId: string) => {
    try {
      const { data: submission, error } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('id', submissionId)
        .single();

      if (error) throw error;

      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .select('points')
        .eq('id', submission.assignment_id)
        .single();

      if (assignmentError) throw assignmentError;

      return assignment.points;
    } catch (error) {
      console.error('Error fetching submission points:', error);
      return null;
    }
  };

  const fetchGradedSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submission_results')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedSubmissions = await Promise.all(
        (data as SubmissionResult[]).map(async (submission) => {
          // First convert the entire submission to camelCase
          const camelCaseSubmission = transformToCamelCase(
            submission
          ) as unknown as {
            id: string;
            fileName: string;
            fileContent: string;
            gradingResults: {
              totalScore: number;
              results: GradingResult[];
              overallFeedback: string;
            };
            createdAt: string;
            submissionId: string;
          };

          const totalPoints = await fetchSubmissionPoints(
            camelCaseSubmission.submissionId
          );

          // Now use the camelCase properties consistently
          return {
            id: camelCaseSubmission.id,
            fileName: camelCaseSubmission.fileName,
            totalScore: camelCaseSubmission.gradingResults.totalScore,
            createdAt: camelCaseSubmission.createdAt,
            results: camelCaseSubmission.gradingResults.results,
            overallFeedback: camelCaseSubmission.gradingResults.overallFeedback,
            submissionId: camelCaseSubmission.submissionId,
            gradedResults: camelCaseSubmission.gradingResults,
            totalPoints,
            fileContent: camelCaseSubmission.fileContent,
            isBase64: camelCaseSubmission.fileContent.startsWith('data:'),
          };
        })
      );

      setSubmissions(transformedSubmissions);
      if (transformedSubmissions.length > 0) {
        setSelectedSubmission(transformedSubmissions[0]);
      }
    } catch (error) {
      console.error('Error fetching graded submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (
    score: number,
    totalPoints: number | undefined
  ) => {
    if (!totalPoints) return score;
    return Math.round((score / totalPoints) * 100);
  };

  const handleBack = () => {
    navigate(`/dashboard/classes/${classId}/assignments/${assignmentId}`);
  };

  const handleDeleteSubmissionResult = async (resultId: string) => {
    try {
      const { error } = await supabase
        .from('submission_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      setSubmissions(submissions.filter((sub) => sub.id !== resultId));
      if (selectedSubmission?.id === resultId) {
        setSelectedSubmission(
          submissions.find((sub) => sub.id !== resultId) || null
        );
      }
      setShowDeleteAlert(false);
      setSubmissionToDelete(null);
      toast.success('Submission result deleted successfully');
    } catch (error: any) {
      console.error('Error deleting submission result:', error);
      toast.error(error.message || 'Failed to delete submission result');
    }
  };

  const handleDeleteEntireBatch = async () => {
    if (!submissionId) return;

    try {
      await deleteSubmissionBatch(submissionId);
      setShowDeleteBatchAlert(false);
      toast.success('Submission batch deleted successfully');
      navigate(`/dashboard/classes/${classId}/assignments/${assignmentId}`);
    } catch (error: any) {
      console.error('Error deleting submission batch:', error);
      toast.error(error.message || 'Failed to delete submission batch');
    }
  };

  const getScoreVariant = (
    score: number
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (score >= 90) return 'default'; // A: Green (default)
    if (score >= 80) return 'secondary'; // B: Blue/Purple (secondary)
    if (score >= 70) return 'outline'; // C: Gray (outline)
    if (score >= 60) return 'secondary'; // D: Blue/Purple (secondary)
    return 'destructive'; // F: Red (destructive)
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    if (score >= 70) return ''; // Use default outline style
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    return ''; // Use default destructive style
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">No graded submissions found.</p>
          <Button onClick={handleBack} className="mt-4">
            Back to Assignment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
      <PageHeader
        breadcrumbItems={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Class', href: `/dashboard/classes/${classId}` },
          {
            label: 'Assignment',
            href: `/dashboard/classes/${classId}/assignments/${assignmentId}`,
          },
          { label: 'Submissions', href: '#', isCurrent: true },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              className="cursor-pointer"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Assignment
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteBatchAlert(true)}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Results
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="bg-card rounded-lg shadow overflow-hidden flex-1 flex flex-col">
        {loading ? (
          <div className="space-y-4 flex-grow">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 flex-grow">
            <p className="text-gray-500">No graded submissions found.</p>
            <Button variant="outline" className="mt-4" onClick={handleBack}>
              Back to Assignment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden">
            {/* Left side - Submissions List with its own scrolling */}
            <div className="lg:col-span-4 flex flex-col overflow-hidden">
              <Card className="flex-grow flex flex-col overflow-hidden">
                <CardHeader className="py-3 px-4 border-b sticky top-0 bg-white z-10 flex-shrink-0">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Select a file to view details
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="cursor-pointer text-xs"
                      >
                        {filteredSubmissions.length}/{submissions.length}
                      </Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by filename..."
                        className="pl-8 h-8 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 cursor-pointer"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <div className="overflow-y-auto flex-grow">
                  {filteredSubmissions.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No files match your search
                    </div>
                  ) : (
                    filteredSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`border-b last:border-b-0 p-4 cursor-pointer transition-colors ${
                          selectedSubmission?.id === submission.id
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            <div className="font-medium truncate">
                              {submission.fileName}
                            </div>
                          </div>
                          <Badge
                            variant={getScoreVariant(
                              submission.totalPoints
                                ? calculatePercentage(
                                    submission.totalScore,
                                    submission.totalPoints
                                  )
                                : submission.totalScore
                            )}
                            className={`cursor-pointer px-2.5 py-1 flex-shrink-0 ml-2 whitespace-nowrap ${getScoreColor(
                              submission.totalPoints
                                ? calculatePercentage(
                                    submission.totalScore,
                                    submission.totalPoints
                                  )
                                : submission.totalScore
                            )}`}
                          >
                            {submission.totalPoints
                              ? `${submission.totalScore} / ${submission.totalPoints}`
                              : `${submission.totalScore}`}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Right side - Selected Submission Details with its own scrolling */}
            <div className="lg:col-span-8 flex flex-col overflow-hidden">
              {selectedSubmission ? (
                <Card className="flex-grow flex flex-col overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sticky top-0 bg-white z-10 border-b flex-shrink-0">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedSubmission.fileName}
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-1">
                        Graded on{' '}
                        {new Date(
                          selectedSubmission.createdAt
                        ).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`text-lg px-3 py-1 cursor-pointer ${getScoreColor(
                          selectedSubmission.totalPoints
                            ? calculatePercentage(
                                selectedSubmission.totalScore,
                                selectedSubmission.totalPoints
                              )
                            : selectedSubmission.totalScore
                        )}`}
                        variant={getScoreVariant(
                          selectedSubmission.totalPoints
                            ? calculatePercentage(
                                selectedSubmission.totalScore,
                                selectedSubmission.totalPoints
                              )
                            : selectedSubmission.totalScore
                        )}
                      >
                        {selectedSubmission.totalPoints
                          ? `${selectedSubmission.totalScore} / ${
                              selectedSubmission.totalPoints
                            } (${calculatePercentage(
                              selectedSubmission.totalScore,
                              selectedSubmission.totalPoints
                            )}%)`
                          : `${selectedSubmission.totalScore}%`}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => downloadFile(selectedSubmission)}
                            className="cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSubmissionToDelete(selectedSubmission.id);
                              setShowDeleteAlert(true);
                            }}
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Result
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="overflow-auto flex-grow p-0">
                    <div className="p-6 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          Overall Feedback
                        </h3>
                        <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-line">
                          {selectedSubmission.overallFeedback}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Detailed Results
                        </h3>
                        <div className="space-y-4">
                          {selectedSubmission.results.map((result, index) => (
                            <div
                              key={index}
                              className="border rounded-lg p-4 bg-white"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">
                                  {result.question}
                                </h4>
                                <Badge
                                  variant={getScoreVariant(result.score)}
                                  className={`cursor-pointer ${getScoreColor(
                                    80
                                  )}`}
                                >
                                  {result.score}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2 whitespace-pre-line">
                                {result.feedback}
                              </p>
                              {result.mistakes.length > 0 && (
                                <div className="mt-2">
                                  <h5 className="text-sm font-medium text-red-600 mb-1">
                                    Mistakes Found:
                                  </h5>
                                  <ul className="list-disc list-inside text-sm text-red-600">
                                    {result.mistakes.map((mistake, i) => (
                                      <li key={i}>{mistake}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex-grow flex items-center justify-center border rounded-lg p-8">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium">
                      Select a submission
                    </h3>
                    <p className="mt-1 text-gray-500">
                      Choose a submission from the list to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Single Result Alert Dialog */}
        <AlertDialog
          open={showDeleteAlert}
          onOpenChange={(open) => {
            setShowDeleteAlert(open);
            if (!open) setSubmissionToDelete(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Result?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this grading result. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={() => {
                  if (submissionToDelete) {
                    handleDeleteSubmissionResult(submissionToDelete);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Entire Batch Alert Dialog */}
        <AlertDialog
          open={showDeleteBatchAlert}
          onOpenChange={setShowDeleteBatchAlert}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Results?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all grading results for this
                submission. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={handleDeleteEntireBatch}
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
