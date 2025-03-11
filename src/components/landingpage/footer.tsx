import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Facebook, Twitter, Instagram, Linkedin, ArrowRight, Mail } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">ProfCelerate</h3>
            <p className="text-slate-400">Creating the modern grading framework to save you time and money.</p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="rounded-full hover:text-white hover:bg-slate-800">
                <Facebook size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-white hover:bg-slate-800">
                <Twitter size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-white hover:bg-slate-800">
                <Instagram size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:text-white hover:bg-slate-800">
                <Linkedin size={20} />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Products</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Customer Support</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stay Updated</h3>
            <p className="text-slate-400">Subscribe to our newsletter for the latest updates and offers.</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-slate-800 border-slate-700 focus:border-slate-600"
              />
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                <ArrowRight size={16} />
              </Button>
            </div>
            <div className="flex items-center text-slate-400">
              <Mail size={16} className="mr-2" />
              <span>contact@company.com</span>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            &copy; {currentYear} ProfCelerate. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6 text-sm text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};
