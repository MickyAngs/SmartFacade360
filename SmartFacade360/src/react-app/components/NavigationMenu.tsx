import { Home, Camera, X, User, Settings, LogOut, LogIn, ChevronRight, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';

export default function NavigationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const location = useLocation();
  const { user, redirectToLogin, logout, isPending } = useAuth();

  const menuItems = [
    { path: '/', label: 'Diseñador', icon: Home },
    { path: '/ar-studio', label: 'AR Studio', icon: Camera },
    { path: '/dashboard/test-uuid', label: 'Command Center (TRL 5)', icon: Activity }
  ];

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setShowAccountSettings(false);
  };

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-3 z-50 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow-md transition-all duration-300 group"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <div className="space-y-1.5">
            <div className="w-6 h-0.5 bg-gray-700"></div>
            <div className="w-6 h-0.5 bg-gray-700"></div>
            <div className="w-6 h-0.5 bg-gray-700"></div>
          </div>
        )}
      </button>

      {/* Menu Overlay */}
      {isOpen && (
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => {
            setIsOpen(false);
            setShowAccountSettings(false);
          }}
        />
      )}

      {/* Menu Panel */}
      <div
        className={`absolute top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-black shadow-2xl z-40 transition-transform duration-300 overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{ width: '300px' }}
      >
        <div className="p-6 space-y-6 min-h-full flex flex-col">
          {/* Logo/Header */}
          <div className="text-center pt-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Camera className="w-8 h-8 text-blue-500" />
              <h2 className="text-xl font-bold text-white">SmartFacade360</h2>
            </div>
            <p className="text-sm text-gray-400">Sistema de Diseño 3D</p>
          </div>

          {/* User Profile Section */}
          {!showAccountSettings && (
            <>
              {user ? (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center space-x-3 mb-3">
                    {user.google_user_data.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt={user.google_user_data.name || 'Usuario'}
                        className="w-12 h-12 rounded-full border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">
                        {user.google_user_data.name || 'Usuario'}
                      </p>
                      <p className="text-gray-400 text-sm truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAccountSettings(true)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <span className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>Configuración y Ajustes</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    redirectToLogin();
                    setIsOpen(false);
                  }}
                  disabled={isPending}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  <LogIn className="w-5 h-5" />
                  <span>{isPending ? 'Cargando...' : 'Ingresar / Registrarse'}</span>
                </button>
              )}

              {/* Navigation Items */}
              <nav className="space-y-2">
                <p className="text-gray-500 text-xs font-semibold uppercase mb-2">Navegación</p>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer Info */}
              <div className="mt-auto">
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-800/30">
                  <p className="text-xs text-gray-400 text-center">
                    Diseño de fachadas con IA y Realidad Aumentada
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Account Settings View */}
          {showAccountSettings && user && (
            <div className="space-y-4">
              {/* Back Button */}
              <button
                onClick={() => setShowAccountSettings(false)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 transform rotate-180" />
                <span className="text-sm">Volver</span>
              </button>

              {/* Header */}
              <div className="text-center">
                <Settings className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-white">Configuración y Ajustes</h3>
              </div>

              {/* User Profile */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-3">Perfil de Usuario</h4>

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-400 text-sm">Nombre de Usuario:</p>
                    <p className="text-white font-medium">{user.google_user_data.name || 'No disponible'}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Correo Electrónico:</p>
                    <p className="text-white font-medium break-all">{user.email}</p>
                  </div>

                  {user.google_user_data.picture && (
                    <div className="flex justify-center pt-2">
                      <img
                        src={user.google_user_data.picture}
                        alt="Perfil"
                        className="w-20 h-20 rounded-full border-2 border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* App Information */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-3">Información de la App</h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Versión:</span>
                    <span className="text-white font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última actualización:</span>
                    <span className="text-white font-medium">Noviembre 2025</span>
                  </div>
                </div>
              </div>

              {/* Support Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-3">Soporte</h4>

                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                    Centro de Ayuda
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                    Reportar un Problema
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
                    Términos y Condiciones
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium mt-6"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
