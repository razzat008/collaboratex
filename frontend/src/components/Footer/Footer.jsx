import { useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();

  if(location.pathname === "/editorpage") return null;

    return (
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          {/* Top Section */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-bold">Collaboratex</h2>
              <p className="text-sm">© {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <nav className="flex space-x-4">
              <a href="#" className="hover:text-gray-400">About</a>
              <a href="#" className="hover:text-gray-400">Privacy</a>
              <a href="#" className="hover:text-gray-400">Contact</a>
            </nav>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;