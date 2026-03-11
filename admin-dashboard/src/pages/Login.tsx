import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Shield, BarChart3, Activity, Database } from 'lucide-react';
import LoginForm from '../components/Auth/LoginForm';
import { useTheme } from '../hooks/useTheme';
import { APP_NAME } from '../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Left panel - platform showcase */}
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
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-orange-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-2/3 left-1/2 w-40 h-40 bg-yellow-400/10 rounded-full blur-[60px]" />

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
            Comprehensive health monitoring, risk assessment, and predictive analytics for
            electric utility transmission and distribution assets.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              {
                icon: Activity,
                title: 'Health Monitoring',
                desc: 'Real-time health scores for 1,000+ T&D assets across all voltage classes',
              },
              {
                icon: Shield,
                title: 'Risk Assessment',
                desc: 'IEEE-compliant risk scoring with predictive failure analysis',
              },
              {
                icon: BarChart3,
                title: 'Reliability Indices',
                desc: 'SAIDI, SAIFI, CAIDI tracking per IEEE 1366 standards',
              },
              {
                icon: Database,
                title: 'DGA Analytics',
                desc: 'Dissolved gas analysis with Duval Triangle diagnostics per IEEE C57.104',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 hover:bg-white/[0.07] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center mb-3">
                  <feature.icon size={16} className="text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-xs text-gray-500 leading-relaxed">
              Built on IEEE C57, NERC reliability, and state PUC regulatory standards
              for transmission and distribution asset management.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Theme toggle */}
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Sign in to access the Asset Intelligence Platform
            </p>
          </div>

          <LoginForm onSuccess={() => navigate('/')} />

          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
            Authorized utility personnel only.
          </p>
        </div>
      </div>
    </div>
  );
}
