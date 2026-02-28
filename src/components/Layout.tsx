import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './bottomnav';

interface LayoutProps {
  children: ReactNode;
}



const Layout = ({ children }: LayoutProps) => {

  return (
    <div className="bg-[#141414] text-white min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Header/>
      {/* Body Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar/>
        {/* Main Content */}
        <main style={{ height: 'calc(100vh - 56px)' }} className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      <BottomNav/>
    </div>
  );
};

export default Layout;
