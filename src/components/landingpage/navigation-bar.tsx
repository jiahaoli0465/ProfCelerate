import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { buttonVariants } from "../ui/button";
import { User, Menu, Code } from "lucide-react";
import { Link } from "react-router-dom";

export const NavigationBar = () => {
  return (
    <header className="sticky border-b-[1px] top-0 z-40 w-full bg-white dark:border-b-slate-700 dark:bg-background">
      <NavigationMenu className="mx-auto">
        <NavigationMenuList className="container h-14 px-4 w-screen flex justify-between ">
          <NavigationMenuItem className="font-bold flex">
            <a href="/" className="ml-2 font-bold text-xl flex">
              <Code className="mr-2 h-6 w-6" />
              ProfCelerate
            </a>
          </NavigationMenuItem>

          {/* desktop */}
          <div className="hidden md:flex gap-2">
            <a href="#features" className={`text-lg ${buttonVariants({ variant: "ghost" })}`}>
              Features
            </a>
            <a href="#testimonials" className={`text-lg ${buttonVariants({ variant: "ghost" })}`}>
              Customers
            </a>
            <a href="#pricing" className={`text-lg ${buttonVariants({ variant: "ghost" })}`}>
              Pricing
            </a>
            <Link to="/dashboard" className={`text-lg ${buttonVariants({ variant: "ghost" })}`}>
              Dashboard
            </Link>
          </div>

          <div className="hidden md:flex gap-2">
            <Link to="/login" className={`text-large ${buttonVariants({ variant: "secondary" })}`}>
              <User />
              Login
            </Link>
          </div>


          {/* mobile */}
          <span className="flex md:hidden">
            <div className="px-2">
              <Menu className="flex md:hidden h-5 w-5">
                <span className="sr-only">Menu Icon</span>
              </Menu>
            </div>
          </span>


        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
};

          {/* <div className="hidden md:flex gap-2">
            <a href="https://github.com" target="_blank" className={`border ${buttonVariants({ variant: "secondary" })}`}>
              <Github className="mr-2 h-5 w-5" />
              Github
            </a>
            <button className="p-2">
              <Sun className="h-5 w-5" />
            </button>
          </div> */}
// import {
//   NavigationMenu,
//   NavigationMenuContent,
//   // NavigationMenuIndicator,
//   NavigationMenuItem,
//   NavigationMenuLink,
//   NavigationMenuList,
//   NavigationMenuTrigger,
//   // NavigationMenuViewport,
// } from "@/components/ui/navigation-menu"


// import {Home} from 'lucide-react';

// export default function NavigationBar() {
//   return (
//     <div className='flex absolute left-3 top-3'>
//       <Home size={30} />
//       <div>
//         <NavigationMenu>
//           <NavigationMenuList>
//             <NavigationMenuItem>
//               <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
//               <NavigationMenuContent>
//                 <NavigationMenuLink>Link</NavigationMenuLink>
//               </NavigationMenuContent>
//             </NavigationMenuItem>
//             <NavigationMenuItem>
//               <NavigationMenuTrigger>Item Two</NavigationMenuTrigger>
//               <NavigationMenuContent>
//                 <NavigationMenuLink>Link</NavigationMenuLink>
//               </NavigationMenuContent>
//             </NavigationMenuItem>
//           </NavigationMenuList>
//         </NavigationMenu>
//       </div>
//     </div>
//   );
// }
