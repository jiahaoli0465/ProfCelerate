import React, { useState, useEffect, JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, FileUp, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  transformToCamelCase,
  transformToSnakeCase,
} from '@/lib/caseConversion';

// Import components
import { AssignmentDetails } from './assignment-details';
import { SubmissionSection } from './submission-section';
import { FileUploadForm } from './file-upload-form';
import { Assignment } from '@/types/assignment';
import { EditAssignmentDialog } from '@/components/autograder/edit-assignment-dialog';

export interface SubmissionBatch {
  id: string;
  name: string;
  uploadedAt: string;
  status: 'grading' | 'completed' | 'failed';
  fileCount: number;
}

interface SubmissionData {
  id: string;
  batchName?: string;
  createdAt: string;
  status: 'grading' | 'completed' | 'failed';
  fileCount?: number;
}

const AssignmentPage: React.FC = () => {
  const { classId, assignmentId } = useParams<{
    classId: string;
    assignmentId: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionBatch[]>([]);
  const [activeTab, setActiveTab] = useState<string>('details');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);

  const fetchAssignmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Assignment not found');

      console.log('Raw assignment data from Supabase:', data);
      // Transform snake_case to camelCase
      const transformedAssignment = transformToCamelCase(data) as Assignment;
      console.log('Transformed assignment data:', transformedAssignment);

      // Validate required fields
      if (
        !transformedAssignment.createdAt ||
        !transformedAssignment.updatedAt
      ) {
        console.error(
          'Missing date fields in transformed assignment:',
          transformedAssignment
        );
        // Set default values if missing
        transformedAssignment.createdAt = new Date().toISOString();
        transformedAssignment.updatedAt = new Date().toISOString();
      }

      setAssignment(transformedAssignment);

      // Fetch submissions for this assignment
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // Transform submissions data to match SubmissionBatch interface
      const transformedSubmissions: SubmissionBatch[] = (
        submissionsData || []
      ).map((submission) => {
        const camelCaseSubmission = transformToCamelCase(
          submission
        ) as SubmissionData;
        return {
          id: camelCaseSubmission.id,
          name:
            camelCaseSubmission.batchName || `Batch ${camelCaseSubmission.id}`,
          uploadedAt: camelCaseSubmission.createdAt,
          status: camelCaseSubmission.status,
          fileCount: camelCaseSubmission.fileCount || 0,
        };
      });

      setSubmissions(transformedSubmissions);
    } catch (error: any) {
      console.error('Error fetching assignment data:', error);
      toast.error(error.message || 'Failed to load assignment data');
      if (error.message === 'Assignment not found') {
        navigate(`/dashboard/classes/${classId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentData();
  }, [assignmentId, classId, navigate]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchAssignmentData();
    setRefreshing(false);
  };

  const handleBack = (): void => {
    navigate(`/dashboard/classes/${classId}`);
  };

  const handleSubmitFiles = async (
    files: File[],
    batchName: string
  ): Promise<void> => {
    try {
      // Transform data to snake_case before sending to Supabase
      const submissionData = transformToSnakeCase({
        assignment_id: assignmentId,
        batch_name: batchName,
        file_count: files.length,
        status: 'grading',
      });

      // Create submission record in database
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Transform the response to camelCase
      const transformedSubmission = transformToCamelCase(
        submission
      ) as SubmissionData;

      // Add new batch to the submissions list
      const newBatch: SubmissionBatch = {
        id: transformedSubmission.id,
        name:
          transformedSubmission.batchName ||
          `Batch ${transformedSubmission.id}`,
        uploadedAt: transformedSubmission.createdAt,
        status: transformedSubmission.status,
        fileCount: transformedSubmission.fileCount || 0,
      };

      setSubmissions([newBatch, ...submissions]);
      setShowUploadForm(false);
      toast.success('Files uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Failed to upload files');
    }
  };

  const handleAssignmentUpdated = (updatedAssignment: Assignment) => {
    // Transform the updated assignment data to camelCase
    const transformedAssignment = transformToCamelCase(
      updatedAssignment
    ) as Assignment;
    console.log('Updated assignment before transform:', updatedAssignment);
    console.log('Updated assignment after transform:', transformedAssignment);
    setAssignment(transformedAssignment);
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

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium">Assignment not found</h3>
          <Button className="mt-4" onClick={handleBack}>
            Back to Class
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/dashboard/classes/${classId}`}>
              Class
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="#">{assignment.title}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Class
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* Assignment header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{assignment.title}</h2>
              </div>
              <CardDescription>{assignment.description}</CardDescription>
            </div>
            <div>
              <Button
                className="flex items-center gap-2"
                onClick={() => setShowEditDialog(true)}
              >
                <FileUp className="h-4 w-4" />
                Edit Assignment
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs for Assignment details and Submissions */}
      <Tabs
        defaultValue="details"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="details">Assignment Details</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissions ({submissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <AssignmentDetails
            assignment={assignment}
            onAssignmentUpdated={handleAssignmentUpdated}
          />
        </TabsContent>

        <TabsContent value="submissions">
          <SubmissionSection
            submissions={submissions}
            onUpload={() => setShowUploadForm(true)}
          />
        </TabsContent>
      </Tabs>

      {/* File Upload Modal */}
      {showUploadForm && (
        <FileUploadForm
          acceptedFileTypes={
            assignment.type === 'voice' ? ['audio/*'] : ['application/pdf']
          }
          onClose={() => setShowUploadForm(false)}
          onSubmit={handleSubmitFiles}
        />
      )}

      {/* Edit Assignment Dialog */}
      {assignment && (
        <EditAssignmentDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          assignment={assignment}
          onAssignmentUpdated={handleAssignmentUpdated}
        />
      )}
    </div>
  );
};

export default AssignmentPage;
