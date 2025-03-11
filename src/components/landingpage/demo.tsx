import React from 'react';
import { ArrowDown } from "lucide-react";

interface YouTubeEmbedProps {
  videoUrl?: string;
}

// Simple YouTube embed component
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ 
  videoUrl = "https://www.youtube.com/watch?v=e2PXORl18Fc" 
}) => {
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };
  
  const videoId = getYouTubeVideoId(videoUrl);
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
  
  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-md">
      <div className="aspect-video w-full">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    </div>
  );
};

export const Demo: React.FC = () => {
  return (
    <div className="flex flex-col py-16 gap-8 ">
      <div className="flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl md:text-6xl font-semibold mb-6 tracking-normal">
          See AI Grading in Action
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-8">
          Watch how ProfCelerate automatically grades assignments in seconds,
          saving you hours of manual work
        </p>
        <div>
          <ArrowDown size={48} className="animate-bounce" />
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <YouTubeEmbed videoUrl="https://www.youtube.com/watch?v=e2PXORl18Fc" />
      </div>
      
      <div className="text-center px-4">
        <p className="text-lg text-slate-700 max-w-3xl mx-auto">
          Our intelligent grading system handles multiple formats, provides detailed feedback, and allows you to set the standard.
        </p>
      </div>
    </div>
  );
};

export default Demo;