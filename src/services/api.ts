import axios from 'axios';
import { supabase } from '@/lib/supabase';


const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface GradingResult {
  fileName: string;
  results: Array<{
    question: string;
    mistakes: string[];
    score: number;
    feedback: string;
  }>;
  totalScore: number;
  overallFeedback: string;
}

export const api = {
  async gradeSubmission(
    files: File[],
    gradingCriteria: string,
    submissionId: string,
    totalPointsAvailable: number
  ): Promise<GradingResult[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('gradingCriteria', gradingCriteria);
    formData.append('submissionId', submissionId);
    formData.append('totalPointsAvailable', totalPointsAvailable.toString());

    try {
      console.log('Sending grading request with:', {
        files: files.map((f) => f.name),
        gradingCriteria,
        submissionId,
        totalPointsAvailable,
      });

      const response = await axios.post(`${API_BASE_URL}/api/grade`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        console.error('Server returned error:', response.data);
        throw new Error(response.data.message || 'Grading failed');
      }

      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Error grading submission:', error);
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
        throw new Error(
          error.response.data.message ||
            error.response.data.error ||
            'Grading failed'
        );
      }
      throw error;
    }
  },
};
