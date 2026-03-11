import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/UI/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button>
              <Home size={16} />
              Go to Dashboard
            </Button>
          </Link>
          <Link to={-1 as unknown as string} onClick={(e) => { e.preventDefault(); window.history.back(); }}>
            <Button variant="secondary">
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
