import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { transformToCamelCase } from '@/lib/caseConversion';

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
}

interface GradedSubmissionsProps {
  submissionId: string;
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
}

export const GradedSubmissions: React.FC<GradedSubmissionsProps> = ({
  submissionId,
}) => {
  const [submissions, setSubmissions] = useState<GradedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<GradedSubmission | null>(null);

  useEffect(() => {
    fetchGradedSubmissions();
  }, [submissionId]);

  const fetchGradedSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submission_results')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedSubmissions = (data as SubmissionResult[]).map(
        (submission) => {
          const camelCaseSubmission = transformToCamelCase(
            submission
          ) as SubmissionResult;
          return {
            id: camelCaseSubmission.id,
            fileName: camelCaseSubmission.file_name,
            totalScore: camelCaseSubmission.grading_results.totalScore,
            createdAt: camelCaseSubmission.created_at,
            results: camelCaseSubmission.grading_results.results,
            overallFeedback:
              camelCaseSubmission.grading_results.overallFeedback,
          };
        }
      );

      setSubmissions(transformedSubmissions);
    } catch (error) {
      console.error('Error fetching graded submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
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
      <div className="text-center py-8">
        <p className="text-gray-500">No graded submissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Graded Submissions</h2>
        <Badge variant="secondary">
          {submissions.length}{' '}
          {submissions.length === 1 ? 'submission' : 'submissions'}
        </Badge>
      </div>

      <div className="grid gap-4">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-lg">
                    {submission.fileName}
                  </CardTitle>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge
                    variant={
                      submission.totalScore >= 70 ? 'default' : 'destructive'
                    }
                  >
                    Score: {submission.totalScore}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSelectedSubmission(
                        selectedSubmission?.id === submission.id
                          ? null
                          : submission
                      )
                    }
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${
                        selectedSubmission?.id === submission.id
                          ? 'rotate-90'
                          : ''
                      }`}
                    />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {selectedSubmission?.id === submission.id && (
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Overall Feedback</h3>
                    <p className="text-gray-600">
                      {submission.overallFeedback}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Detailed Results</h3>
                    <div className="space-y-4">
                      {submission.results.map((result, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{result.question}</h4>
                            <Badge
                              variant={
                                result.score >= 70 ? 'default' : 'destructive'
                              }
                            >
                              {result.score}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-2">
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
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
