import { useNavigate } from 'react-router-dom';
import { Sun, Moon, CheckCircle2, ClipboardCheck, Wrench, FlaskConical, FileText, MapPin } from 'lucide-react';
import RegisterForm from '../components/Auth/RegisterForm';
import { useTheme } from '../hooks/useTheme';
import { APP_NAME } from '../utils/constants';

export default function Register() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left panel - platform capabilities */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 relative overflow-hidden">
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glowing orbs */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-56 h-56 bg-orange-500/10 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white w-full">
          {/* Logo & Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              &#9889; {APP_NAME}
            </h1>
            <p className="text-amber-300/60 text-sm font-medium tracking-wider uppercase mt-2">
              Electric Utility Asset Management
            </p>
          </div>

          <p className="text-lg text-gray-300 leading-relaxed max-w-lg">
            Get full visibility into your utility asset fleet with integrated monitoring,
            inspection tracking, and regulatory reporting tools.
          </p>

          {/* Platform capabilities list */}
          <div className="mt-10 space-y-4">
            {[
              {
                icon: ClipboardCheck,
                title: 'Inspection Management',
                desc: 'Track and manage field inspection results with condition scoring',
              },
              {
                icon: FlaskConical,
                title: 'DGA Test Tracking',
                desc: 'Dissolved gas analysis with IEEE C57.104 diagnostic interpretation',
              },
              {
                icon: Wrench,
                title: 'Maintenance History',
                desc: 'Complete work order management for preventive and repair activities',
              },
              {
                icon: FileText,
                title: 'Regulatory Reporting',
                desc: 'Generate PUC filings, compliance reports, and capital plan documents',
              },
              {
                icon: MapPin,
                title: 'Asset Geolocation',
                desc: 'Interactive maps with asset locations, health overlays, and clustering',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <item.icon size={16} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="mt-10 pt-8 border-t border-white/10 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Built on IEEE C57, NERC, and PA PUC regulatory standards for T&D asset management
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex justify-end mb-8">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Mobile-only branding */}
          <div className="lg:hidden mb-6">
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              &#9889; {APP_NAME}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create an account</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Register to access the Asset Intelligence Platform
            </p>
          </div>

          <RegisterForm onSuccess={() => navigate('/')} />
        </div>
      </div>
    </div>
  );
}
