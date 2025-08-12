
'use client';

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-6">
            <h3 className="text-xl font-['Pacifico'] text-black mb-4">QuickCourt</h3>
          </div>
          
          <div className="flex justify-center space-x-6 mb-6">
            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-facebook-fill text-2xl"></i>
              </div>
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-twitter-x-fill text-2xl"></i>
              </div>
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-instagram-fill text-2xl"></i>
              </div>
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-linkedin-fill text-2xl"></i>
              </div>
            </a>
            <a href="#" className="text-gray-600 hover:text-black transition-colors cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="ri-youtube-fill text-2xl"></i>
              </div>
            </a>
          </div>
          
          <p className="text-gray-500 text-sm">
            © 2024 QuickCourt. Book your perfect sports venue.
          </p>
        </div>
      </div>
    </footer>
  );
}
