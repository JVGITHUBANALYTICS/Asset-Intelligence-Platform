export default function Footer() {
  return (
    <footer className="h-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 text-sm text-gray-500 dark:text-gray-400">
      <p>&copy; {new Date().getFullYear()} Asset Intelligence Platform. All rights reserved.</p>
      <p className="hidden sm:block">Powered by AI/ML Health Analytics</p>
    </footer>
  );
}
