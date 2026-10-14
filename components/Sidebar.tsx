import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { LogOut, X } from 'lucide-react-native';
import SelectorGrupos from './SelectorGrupos';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useUserMembership } from '@/hooks/useUserMembership';
import { personalMenuItems, groupMenuItems } from '@/constants/menuItems';

interface SidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  organizacionActual: string;
  onOrganizacionChange: (id: string) => void;
  esPersonal: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  currentSection, 
  onSectionChange, 
  organizacionActual, 
  onOrganizacionChange,
  esPersonal,
  visible = true,
  onClose 
}: SidebarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { personalOrg, groupOrgs, loading: orgsLoading } = useUserOrganizations();
  const { membership } = useUserMembership(organizacionActual);
  
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  
  const userName = profile?.full_name || profile?.email || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userRole = membership?.role || 'member';
  
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    director: 'Director',
    member: 'Miembro',
  };
  
  const menuItems = esPersonal ? personalMenuItems : groupMenuItems;
  
  const handleRefresh = () => {
    onOrganizacionChange(organizacionActual);
  };
  
  // Si es móvil y no está visible, no renderizar
  if (isMobile && !visible) {
    return null;
  }
  
  // Si no hay organización personal (caso extremo), mostrar mensaje
  if (!personalOrg && !orgsLoading) {
    return (
      <View 
        className={`${isDark ? 'bg-gray-900' : 'bg-white'} flex-shrink-0`}
        style={{ width: isMobile ? screenWidth : 280, height: isMobile ? '100%' : undefined }}
      >
        <View className={`p-6 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Configurando tu espacio...
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View 
      className={`${isDark ? 'bg-gray-900' : 'bg-white'} ${isMobile ? 'absolute inset-0 z-50' : 'flex-shrink-0'}`}
      style={{ width: isMobile ? screenWidth : 280 }}
    >
      {/* Botón cerrar en móvil */}
      {isMobile && onClose && (
        <Pressable
          onPress={onClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        >
          <X size={20} color={isDark ? '#fff' : '#000'} />
        </Pressable>
      )}
      
      {/* Selector de organización */}
      <SelectorGrupos 
        personalOrg={personalOrg}
        groupOrgs={groupOrgs}
        organizacionActual={organizacionActual}
        onOrganizacionChange={onOrganizacionChange}
        onRefresh={handleRefresh}
        loading={orgsLoading}
      />

      {/* Menú de navegación */}
      <ScrollView className="flex-1 px-3 py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          
          return (
            <Pressable
              key={item.id}
              onPress={() => {
                onSectionChange(item.id);
                if (isMobile && onClose) onClose();
              }}
              className={`flex-row items-center px-4 py-3 rounded-xl mb-1 ${
                isActive 
                  ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                  : isDark 
                    ? 'bg-transparent active:bg-gray-800' 
                    : 'bg-transparent active:bg-gray-100'
              }`}
            >
              <Icon 
                size={20} 
                color={isActive ? '#6366f1' : (isDark ? '#9ca3af' : '#6b7280')} 
              />
              <Text 
                className={`ml-3 font-medium ${
                  isActive 
                    ? 'text-indigo-600' 
                    : isDark 
                      ? 'text-gray-400' 
                      : 'text-gray-600'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Perfil del usuario */}
      <View className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <View className="flex-row items-center mb-3">
          <View className="w-9 h-9 rounded-full bg-indigo-500 items-center justify-center mr-3">
            <Text className="text-white font-semibold text-sm">{userInitials}</Text>
          </View>
          <View className="flex-1">
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
              {userName}
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {roleLabels[userRole] || 'Miembro'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={signOut}
          className="flex-row items-center justify-center py-2 rounded-lg bg-red-50 active:bg-red-100 dark:bg-red-900/20"
        >
          <LogOut size={16} color="#ef4444" />
          <Text className="ml-2 text-red-600 font-medium text-sm">Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}
