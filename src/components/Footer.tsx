import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Copyright and Company Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-bold text-lg">My Site</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Building amazing experiences for the web.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              &copy; {new Date().getFullYear()} My Site. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-bold text-lg">Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                Contact
              </Link>
            </nav>
          </div>

          {/* Social Media Placeholders */}
          <div className="flex flex-col space-y-4">
            <h3 className="font-bold text-lg">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Twitter">
                <span className="font-bold text-xs">TW</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Facebook">
                <span className="font-bold text-xs">FB</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" aria-label="Instagram">
                <span className="font-bold text-xs">IG</span>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors" aria-label="LinkedIn">
                <span className="font-bold text-xs">LI</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
