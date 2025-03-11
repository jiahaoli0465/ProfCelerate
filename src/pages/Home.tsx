// src/pages/Home.tsx
import React from 'react';
import { NavigationBar } from '@/components/landingpage/navigation-bar';
import { Features } from '@/components/landingpage/features';
import { Demo } from '@/components/landingpage/demo';
import { Questions } from '@/components/landingpage/questions';
import { Footer } from '@/components/landingpage/footer';


const Home: React.FC = () => {
  return (
    <div>
      <NavigationBar />
      <Features />
      {/* <Demo /> */}
      <Questions />
      <Footer />
    </div>
  );
};

export default Home;
