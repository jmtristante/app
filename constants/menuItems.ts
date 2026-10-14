import { Home, Calendar, Music2, Users, DollarSign, MessageSquare, Package, LogOut, X, UserCircle, Bell, Cloud, Settings } from 'lucide-react-native';

// Menú para espacio personal del usuario
export const personalMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Vista consolidada de todo' },
  { id: 'mis-actuaciones', label: 'Mis actuaciones', icon: Calendar, description: 'Actuaciones personales y de grupos' },
  { id: 'mis-ensayos', label: 'Mis ensayos', icon: Calendar, description: 'Ensayos personales y de grupos' },
  { id: 'mi-repertorio', label: 'Mi repertorio', icon: Music2, description: 'Repertorio personal' },
  { id: 'almacenamiento', label: 'Almacenamiento', icon: Cloud, description: 'Configurar almacenamiento en la nube' },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell, description: 'Avisos de todas las organizaciones' },
  { id: 'perfil', label: 'Mi perfil', icon: UserCircle, description: 'Datos personales' },
];

// Menú para organizaciones (grupos)
export const groupMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'ensayos', label: 'Ensayos', icon: Calendar },
  { id: 'actuaciones', label: 'Actuaciones', icon: Calendar },
  { id: 'musicos', label: 'Músicos', icon: Users },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'repertorio', label: 'Repertorio', icon: Music2 },
  { id: 'economia', label: 'Economía', icon: DollarSign },
  { id: 'comunicacion', label: 'Comunicación', icon: MessageSquare },
  { id: 'equipo', label: 'Equipo', icon: Package },
];

export type MenuItem = typeof personalMenuItems[number];
