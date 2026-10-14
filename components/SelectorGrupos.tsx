import { useState } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { ChevronDown, Plus, Home, Users } from 'lucide-react-native';
import { Organization } from '@/hooks/useUserOrganizations';
import CreateOrganizationModal from './CreateOrganizationModal';

interface SelectorGruposProps {
  personalOrg: Organization | null;
  groupOrgs: Organization[];
  organizacionActual: string;
  onOrganizacionChange: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export default function SelectorGrupos({ 
  personalOrg,
  groupOrgs, 
  organizacionActual, 
  onOrganizacionChange,
  onRefresh,
  loading = false 
}: SelectorGruposProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  
  const organizacionSeleccionada = personalOrg?.id === organizacionActual 
    ? personalOrg 
    : groupOrgs.find(o => o.id === organizacionActual) || personalOrg;
  
  const handleOrganizacionCreated = () => {
    onRefresh();
  };
  
  if (loading) {
    return (
      <View className={`p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }
  
  const OrgItem = ({ org, isPersonal = false }: { org: Organization; isPersonal?: boolean }) => (
    <Pressable
      key={org.id}
      onPress={() => {
        onOrganizacionChange(org.id);
        setSelectorVisible(false);
      }}
      className={`flex-row items-center py-3 px-3 rounded-lg mb-1 ${
        org.id === organizacionActual 
          ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50' 
          : isDark ? 'active:bg-gray-700' : 'active:bg-gray-100'
      }`}
    >
      <View 
        className="w-8 h-8 rounded-lg items-center justify-center mr-3" 
        style={{ backgroundColor: org.primary_color }}
      >
        {isPersonal ? (
          <Home size={16} color="white" />
        ) : (
          <Text className="text-white font-bold text-sm">
            {org.name.charAt(0)}
          </Text>
        )}
      </View>
      <View className="flex-1">
        <Text 
          className={`font-medium ${
            org.id === organizacionActual 
              ? 'text-indigo-600' 
              : isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {org.name}
        </Text>
        {isPersonal && (
          <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Tu espacio personal
          </Text>
        )}
      </View>
    </Pressable>
  );
  
  return (
    <View className={`p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <Pressable 
        className={`flex-row items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-50 active:bg-gray-100'}`}
        onPress={() => setSelectorVisible(true)}
      >
        <View className="flex-row items-center flex-1">
          <View 
            className="w-9 h-9 rounded-lg items-center justify-center mr-3" 
            style={{ backgroundColor: organizacionSeleccionada?.primary_color || '#6366f1' }}
          >
            {organizacionSeleccionada?.type === 'personal' ? (
              <Home size={18} color="white" />
            ) : (
              <Text className="text-white font-bold text-sm">
                {organizacionSeleccionada?.name.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
              {organizacionSeleccionada?.name || 'Sin organización'}
            </Text>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {organizacionSeleccionada?.type === 'personal' 
                ? 'Espacio personal'
                : 'Organización'
              }
            </Text>
          </View>
        </View>
        <ChevronDown size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
      </Pressable>
      
      <Modal
        visible={selectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setSelectorVisible(false)}
        >
          <Pressable className={`w-full max-w-md rounded-2xl p-4 max-h-[70%] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Seleccionar espacio
            </Text>
            
            {/* Mi espacio personal */}
            {personalOrg && (
              <View className="mb-3">
                <Text className={`text-xs font-semibold uppercase mb-2 px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Personal
                </Text>
                <OrgItem org={personalOrg} isPersonal={true} />
              </View>
            )}
            
            {/* Mis organizaciones */}
            {groupOrgs.length > 0 && (
              <View className="mb-3">
                <Text className={`text-xs font-semibold uppercase mb-2 px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Mis organizaciones
                </Text>
                {groupOrgs.map(org => (
                  <OrgItem key={org.id} org={org} />
                ))}
              </View>
            )}
            
            <Pressable
              onPress={() => {
                setSelectorVisible(false);
                setModalVisible(true);
              }}
              className="flex-row items-center justify-center py-3 mt-2 border-t border-gray-200 dark:border-gray-700"
            >
              <Plus size={18} color="#6366f1" />
              <Text className="text-indigo-600 font-medium ml-2">Crear nueva organización</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      
      <CreateOrganizationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={handleOrganizacionCreated}
      />
    </View>
  );
}
