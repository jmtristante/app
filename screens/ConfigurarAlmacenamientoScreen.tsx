import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useFileStorageConfig } from '@/hooks/useFileStorageConfig';
import { Cloud, Trash2, CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { DropboxService } from '@/services/dropbox';
import { GoogleDriveService } from '@/services/googleDrive';

interface ConfigurarAlmacenamientoScreenProps {
  organizacionId: string | null;
}

const proveedores = [
  { id: 'google_drive', nombre: 'Google Drive', color: '#4285F4', icono: 'G' },
  { id: 'dropbox', nombre: 'Dropbox', color: '#0061FF', icono: 'D' },
  { id: 'onedrive', nombre: 'OneDrive', color: '#0078D4', icono: 'O' },
];

export default function ConfigurarAlmacenamientoScreen({ organizacionId }: ConfigurarAlmacenamientoScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { configs, loading, saveConfig, updateConfig, deleteConfig } = useFileStorageConfig(organizacionId);
  const [authenticating, setAuthenticating] = useState<string | null>(null);

  const handleAñadirProveedor = async (proveedorId: string) => {
    setAuthenticating(proveedorId);
    try {
      let config;

      if (proveedorId === 'dropbox') {
        config = await DropboxService.startAuth();
        if (config) {
          await saveConfig({
            organization_id: organizacionId!,
            provider: 'dropbox',
            provider_config: {
              access_token: config.access_token,
              account_id: config.account_id,
              account_name: config.account_name,
            },
            is_active: true,
            is_default: configs.length === 0,
          });
          Alert.alert('Éxito', 'Dropbox configurado correctamente');
        }
      } else if (proveedorId === 'google_drive') {
        config = await GoogleDriveService.startAuth();
        if (config) {
          await saveConfig({
            organization_id: organizacionId!,
            provider: 'google_drive',
            provider_config: {
              access_token: config.access_token,
              refresh_token: config.refresh_token,
              account_id: config.account_id,
              account_name: config.account_name,
            },
            is_active: true,
            is_default: configs.length === 0,
          });
          Alert.alert('Éxito', 'Google Drive configurado correctamente');
        }
      } else {
        Alert.alert('Info', 'OneDrive estará disponible próximamente');
      }

      if (!config) {
        Alert.alert('Error', 'No se pudo completar la autenticación');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al configurar el proveedor');
    } finally {
      setAuthenticating(null);
    }
  };

  const handleEliminarProveedor = async (id: string) => {
    try {
      await deleteConfig(id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al eliminar el proveedor');
    }
  };

  const handleEstablecerDefault = async (id: string) => {
    try {
      for (const config of configs) {
        if (config.is_default) {
          await updateConfig(config.id, { is_default: false });
        }
      }
      await updateConfig(id, { is_default: true });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al establecer el proveedor por defecto');
    }
  };

  const proveedoresConfigurados = configs.map(c => c.provider);
  const proveedoresDisponibles = proveedores.filter(p => !proveedoresConfigurados.includes(p.id));

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`px-6 py-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Almacenamiento en la nube
        </Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Configura dónde se guardarán tus partituras
        </Text>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="mb-6">
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Proveedores configurados ({configs.length})
          </Text>

          {configs.length === 0 ? (
            <View className={`p-8 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Cloud size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No hay proveedores configurados. Añade uno para empezar a subir partituras.
              </Text>
            </View>
          ) : (
            configs.map((config) => {
              const proveedor = proveedores.find(p => p.id === config.provider);
              const esDefault = config.is_default;

              return (
                <View key={config.id} className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                      style={{ backgroundColor: proveedor?.color }}
                    >
                      <Text className="text-white font-bold text-sm">{proveedor?.icono}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {proveedor?.nombre}
                      </Text>
                      {esDefault && (
                        <Text className="text-xs text-indigo-600">Proveedor por defecto</Text>
                      )}
                      <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {config.provider_config.account_name}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    {!esDefault && (
                      <Pressable
                        onPress={() => handleEstablecerDefault(config.id)}
                        className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                          isDark ? 'bg-gray-700 active:bg-gray-600' : 'bg-gray-100 active:bg-gray-200'
                        }`}
                      >
                        <CheckCircle size={16} color="#6366f1" />
                        <Text className="ml-2 text-indigo-600 font-medium text-sm">Establecer como default</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleEliminarProveedor(config.id)}
                      className={`flex-row items-center justify-center py-2 px-4 rounded-lg ${
                        isDark ? 'bg-red-900/20 active:bg-red-900/30' : 'bg-red-50 active:bg-red-100'
                      }`}
                    >
                      <Trash2 size={16} color="#ef4444" />
                      <Text className="ml-2 text-red-600 font-medium text-sm">Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {proveedoresDisponibles.length > 0 && (
          <View>
            <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Añadir proveedor
            </Text>

            {proveedoresDisponibles.map((proveedor) => (
              <Pressable
                key={proveedor.id}
                onPress={() => handleAñadirProveedor(proveedor.id)}
                disabled={authenticating !== null}
                className={`p-4 rounded-xl mb-3 flex-row items-center ${
                  isDark ? 'bg-gray-800 active:bg-gray-700' : 'bg-white active:bg-gray-100'
                } ${authenticating !== null ? 'opacity-50' : ''}`}
              >
                <View
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: proveedor.color }}
                >
                  {authenticating === proveedor.id ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-bold text-sm">{proveedor.icono}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {proveedor.nombre}
                  </Text>
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {authenticating === proveedor.id ? 'Autenticando...' : 'Click para configurar'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
