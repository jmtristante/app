import { View, Pressable, Dimensions } from 'react-native';
import { useState, useCallback } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import { useFocusEffect } from 'expo-router';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import PersonalDashboard from '@/components/PersonalDashboard';
import EnsayosScreen from '@/screens/EnsayosScreen';
import ActuacionesScreen from '@/screens/ActuacionesScreen';
import MusicosScreen from '@/screens/MusicosScreen';
import ClientesScreen from '@/screens/ClientesScreen';
import RepertorioScreen from '@/screens/RepertorioScreen';
import EconomiaScreen from '@/screens/EconomiaScreen';
import ComunicacionScreen from '@/screens/ComunicacionScreen';
import EquipoScreen from '@/screens/EquipoScreen';
import MisActuacionesScreen from '@/screens/MisActuacionesScreen';
import MisEnsayosScreen from '@/screens/MisEnsayosScreen';
import MiRepertorioScreen from '@/screens/MiRepertorioScreen';
import ConfigurarAlmacenamientoScreen from '@/screens/ConfigurarAlmacenamientoScreen';
import NotificacionesScreen from '@/screens/NotificacionesScreen';
import PerfilScreen from '@/screens/PerfilScreen';
import { Menu } from 'lucide-react-native';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useAuth } from '@/contexts/AuthContext';

export default function MainScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { personalOrg, groupOrgs, loading: orgsLoading, isPersonal } = useUserOrganizations();
  const { user } = useAuth();
  
  const [organizacionActual, setOrganizacionActual] = useState<string>('');
  
  useFocusEffect(
    useCallback(() => {
      if (personalOrg && !organizacionActual) {
        setOrganizacionActual(personalOrg.id);
      }
    }, [personalOrg])
  );

  const handleOrganizacionChange = (id: string) => {
    setOrganizacionActual(id);
    setCurrentSection('dashboard');
  };
  
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const esPersonal = isPersonal(organizacionActual);
  
  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setSidebarVisible(false);
  };
  
  const renderContent = () => {
    // Pantallas personales
    if (esPersonal) {
      switch (currentSection) {
        case 'dashboard':
          return <PersonalDashboard userId={user?.id || null} />;
        case 'mis-actuaciones':
          return <MisActuacionesScreen />;
        case 'mis-ensayos':
          return <MisEnsayosScreen />;
        case 'mi-repertorio':
          return <MiRepertorioScreen organizacionId={organizacionActual} />;
        case 'almacenamiento':
          return <ConfigurarAlmacenamientoScreen organizacionId={organizacionActual} />;
        case 'notificaciones':
          return <NotificacionesScreen />;
        case 'perfil':
          return <PerfilScreen />;
        default:
          return <PersonalDashboard userId={user?.id || null} />;
      }
    }
    
    // Pantallas de organización
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard organizacionId={organizacionActual} />;
      case 'ensayos':
        return <EnsayosScreen organizacionId={organizacionActual} />;
      case 'actuaciones':
        return <ActuacionesScreen organizacionId={organizacionActual} />;
      case 'musicos':
        return <MusicosScreen organizacionId={organizacionActual} />;
      case 'clientes':
        return <ClientesScreen organizacionId={organizacionActual} />;
      case 'repertorio':
        return <RepertorioScreen organizacionId={organizacionActual} />;
      case 'economia':
        return <EconomiaScreen organizacionId={organizacionActual} />;
      case 'comunicacion':
        return <ComunicacionScreen organizacionId={organizacionActual} />;
      case 'equipo':
        return <EquipoScreen organizacionId={organizacionActual} />;
      default:
        return <Dashboard organizacionId={organizacionActual} />;
    }
  };
  
  return (
    <View className={`flex-1 flex-row ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        organizacionActual={organizacionActual}
        onOrganizacionChange={handleOrganizacionChange}
        esPersonal={esPersonal}
        visible={!isMobile || sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
      
      {/* Contenido principal con flex-1 para ocupar el espacio restante */}
      <View className="flex-1 min-w-0">
        {isMobile && (
          <View className={`px-4 py-3 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <Pressable
              onPress={() => setSidebarVisible(true)}
              className={`p-2 rounded-lg ${isDark ? 'active:bg-gray-800' : 'active:bg-gray-100'}`}
            >
              <Menu size={24} color={isDark ? '#fff' : '#000'} />
            </Pressable>
          </View>
        )}
        
        {renderContent()}
      </View>
    </View>
  );
}
