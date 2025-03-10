import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, FileText, Upload, Pencil } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  transformToSnakeCase,
  transformToCamelCase,
} from '@/lib/caseConversion';

interface AssignmentDetailsProps {
  assignment: Assignment;
  onAssignmentUpdated?: (assignment: Assignment) => void;
}

// Format dates
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) {
    return 'Not available';
  }
  console.log('dateString', dateString);
  try {
    // Parse the ISO date string and handle timezone offset
    const date = new Date(dateString.replace('+00:00', 'Z'));
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'Invalid date';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error, 'Date string:', dateString);
    return 'Invalid date';
  }
};

interface EditGradingCriteriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  onAssignmentUpdated: (assignment: Assignment) => void;
}

const EditGradingCriteriaDialog: React.FC<EditGradingCriteriaDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  onAssignmentUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [gradingCriteria, setGradingCriteria] = useState(
    assignment.gradingCriteria
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const transformedData = transformToSnakeCase({
        grading_criteria: gradingCriteria,
        updated_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from('assignments')
        .update(transformedData)
        .eq('id', assignment.id)
        .select()
        .single();

      if (error) throw error;

      const transformedResponse = transformToCamelCase(data) as Assignment;
      onAssignmentUpdated(transformedResponse);
      onOpenChange(false);
      toast.success('Grading criteria updated successfully');
    } catch (error: any) {
      console.error('Error updating grading criteria:', error);
      toast.error(error.message || 'Failed to update grading criteria');
    } finally {
      setLoading(false);
    }
  };

  const exampleCriteria = `Rubric Guidelines (Total: ${assignment.points} points)

Content Understanding [40%]
• Complete (4pts): Demonstrates thorough understanding, accurate analysis
• Partial (2-3pts): Shows basic comprehension, some gaps present
• Limited (0-1pts): Major misconceptions or incomplete response

Organization [30%]
• Strong (3pts): Clear structure, logical flow, well-connected ideas
• Developing (2pts): Basic organization, some unclear transitions
• Needs Work (0-1pts): Unclear structure, difficult to follow

Evidence/Support [30%]
• Thorough (3pts): Strong examples, relevant details
• Basic (2pts): Some supporting evidence, needs development
• Limited (0-1pts): Lacks sufficient support

Tips:
- Break total points into clear categories
- Define specific criteria per level
- Allow for partial credit
- Include concrete examples`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Grading Criteria</DialogTitle>
            <DialogDescription>
              Create a detailed rubric with point values for each aspect of the
              assignment. Total points should add up to {assignment.points}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradingCriteria">Grading Criteria</Label>
                <Textarea
                  id="gradingCriteria"
                  value={gradingCriteria}
                  onChange={(e) => setGradingCriteria(e.target.value)}
                  placeholder="Describe how the assignment will be graded..."
                  required
                  className="min-h-[400px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Example Format</Label>
                <div className="border rounded-md p-4 bg-muted/50 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[400px]">
                  {exampleCriteria}
                </div>
                <div className="text-sm text-muted-foreground mt-2 space-y-2">
                  <p className="font-medium">Best Practices:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    <li>Use clear point breakdowns for each category</li>
                    <li>Define specific requirements for each score level</li>
                    <li>Include examples of what constitutes quality work</li>
                    <li>Consider partial credit scenarios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Criteria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const AssignmentDetails: React.FC<AssignmentDetailsProps> = ({
  assignment,
  onAssignmentUpdated,
}) => {
  const [showEditGradingCriteria, setShowEditGradingCriteria] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Assignment Details</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditGradingCriteria(true)}
              className="flex items-center gap-2 text-sm"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Criteria
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-full">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-gray-500">
                  {formatDate(assignment.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-full">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Points</p>
                <p className="text-sm text-gray-500">
                  {assignment.points} points possible
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-gray-500">
                  {formatDate(assignment.updatedAt)}
                </p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Grading Criteria</h3>
            <div className="prose max-w-none">
              <p>{assignment.gradingCriteria}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">File Requirements</h3>
            <div className="flex items-start gap-2">
              <Upload className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">
                  {assignment.type === 'voice' ? 'Audio' : 'PDF'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {onAssignmentUpdated && (
        <EditGradingCriteriaDialog
          open={showEditGradingCriteria}
          onOpenChange={setShowEditGradingCriteria}
          assignment={assignment}
          onAssignmentUpdated={onAssignmentUpdated}
        />
      )}
    </>
  );
};
