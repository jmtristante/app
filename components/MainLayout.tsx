import { View } from 'react-native';
import { useState } from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import EnsayosScreen from '@/screens/EnsayosScreen';
import ActuacionesScreen from '@/screens/ActuacionesScreen';
import MusicosScreen from '@/screens/MusicosScreen';
import ClientesScreen from '@/screens/ClientesScreen';
import RepertorioScreen from '@/screens/RepertorioScreen';
import EconomiaScreen from '@/screens/EconomiaScreen';
import ComunicacionScreen from '@/screens/ComunicacionScreen';
import EquipoScreen from '@/screens/EquipoScreen';

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [grupoActual, setGrupoActual] = useState('1');
  
  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'ensayos':
        return <EnsayosScreen />;
      case 'actuaciones':
        return <ActuacionesScreen />;
      case 'musicos':
        return <MusicosScreen />;
      case 'clientes':
        return <ClientesScreen />;
      case 'repertorio':
        return <RepertorioScreen />;
      case 'economia':
        return <EconomiaScreen />;
      case 'comunicacion':
        return <ComunicacionScreen />;
      case 'equipo':
        return <EquipoScreen />;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <View className={`flex-1 flex-row ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Sidebar 
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        grupoActual={grupoActual}
        onGrupoChange={setGrupoActual}
      />
      <View className="flex-1">
        {renderContent()}
      </View>
    </View>
  );
}
