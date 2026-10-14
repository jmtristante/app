import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { usePartituras } from '@/hooks/usePartituras';
import { useFileStorageConfig } from '@/hooks/useFileStorageConfig';
import { Music2, Upload, Trash2, FileText } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DropboxService } from '@/services/dropbox';
import { GoogleDriveService } from '@/services/googleDrive';
import { useState } from 'react';

interface MiRepertorioScreenProps {
  organizacionId: string | null;
}

export default function MiRepertorioScreen({ organizacionId }: MiRepertorioScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { partituras, loading, createPartitura, deletePartitura } = usePartituras(organizacionId);
  const { configs, loading: configsLoading } = useFileStorageConfig(organizacionId);
  const [uploading, setUploading] = useState(false);

  const handleSeleccionarArchivo = async () => {
    const defaultConfig = configs.find(c => c.is_default) || configs[0];
    if (!defaultConfig) {
      Alert.alert('Error', 'No hay almacenamiento configurado. Configura un proveedor primero.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'audio/*', 'application/*'],
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      await handleSubirArchivo(file, defaultConfig);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al seleccionar archivo');
    }
  };

  const handleSubirArchivo = async (
    file: { uri: string; name: string; mimeType?: string; size?: number },
    config: any
  ) => {
    setUploading(true);
    try {
      let storageId = '';
      let fileUrl = '';

      if (config.provider === 'dropbox') {
        const service = new DropboxService(config.provider_config.access_token);
        
        // Crear carpeta si no existe
        const folderPath = '/politonos/partituras';
        try {
          await service.createFolder(folderPath);
        } catch (e) {
          // Carpeta ya existe
        }

        // Subir archivo
        const dropboxPath = `${folderPath}/${file.name}`;
        const result = await service.uploadFile(
          { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' },
          dropboxPath
        );

        storageId = result.id;
        fileUrl = dropboxPath;
      } else if (config.provider === 'google_drive') {
        const service = new GoogleDriveService(
          config.provider_config.access_token,
          config.provider_config.refresh_token
        );
        
        // Crear carpeta si no existe
        let folderId = config.provider_config.folder_id;
        if (!folderId) {
          folderId = await service.createFolder('Politonos');
          // Guardar folder_id para futuras subidas
        }

        // Subir archivo
        const result = await service.uploadFile(
          { uri: file.uri, name: file.name, type: file.mimeType || 'application/pdf' },
          folderId
        );

        storageId = result.id;
        fileUrl = `https://drive.google.com/file/d/${result.id}/view`;
      }

      // Guardar en la base de datos
      await createPartitura({
        organization_id: organizacionId!,
        title: file.name.replace(/\.[^/.]+$/, ''), // Quitar extensión
        composer: undefined,
        instrument: undefined,
        file_url: fileUrl,
        file_type: file.mimeType?.split('/')[1] || 'pdf',
        file_size: file.size || 0,
        storage_provider: config.provider,
        storage_id: storageId,
      });

      Alert.alert('Éxito', 'Partitura subida correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al subir la partitura');
    } finally {
      setUploading(false);
    }
  };

  const handleEliminar = async (partitura: any) => {
    Alert.alert(
      'Eliminar partitura',
      `¿Estás seguro de que quieres eliminar "${partitura.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Eliminar del proveedor de almacenamiento
              const config = configs.find(c => c.provider === partitura.storage_provider);
              if (config) {
                if (partitura.storage_provider === 'dropbox') {
                  const service = new DropboxService(config.provider_config.access_token);
                  await service.deleteFile(partitura.storage_id);
                } else if (partitura.storage_provider === 'google_drive') {
                  const service = new GoogleDriveService(
                    config.provider_config.access_token,
                    config.provider_config.refresh_token
                  );
                  await service.deleteFile(partitura.storage_id);
                }
              }

              // Eliminar de la base de datos
              await deletePartitura(partitura.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Error al eliminar la partitura');
            }
          },
        },
      ]
    );
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return 'PDF';
    if (fileType?.includes('audio')) return '♫';
    return '';
  };

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
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mi repertorio</Text>
            <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {partituras.length} {partituras.length === 1 ? 'partitura' : 'partituras'}
            </Text>
          </View>
          <Pressable
            onPress={handleSeleccionarArchivo}
            disabled={uploading || configs.length === 0}
            className={`bg-indigo-600 px-4 py-2 rounded-lg flex-row items-center ${
              uploading || configs.length === 0 ? 'opacity-50' : ''
            }`}
          >
            {uploading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Upload size={18} color="white" />
            )}
            <Text className="text-white font-semibold ml-2">
              {uploading ? 'Subiendo...' : 'Subir'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        {configs.length === 0 && (
          <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-yellow-900/20' : 'bg-yellow-50'}`}>
            <Text className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-800'}`}>
              ️ No tienes almacenamiento configurado. Configura un proveedor en la sección "Almacenamiento" para poder subir partituras.
            </Text>
          </View>
        )}

        {partituras.length === 0 ? (
          <View className={`p-8 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Music2 size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`text-center mt-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              No hay partituras
            </Text>
            <Text className={`text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sube tu primera partitura con el botón de arriba
            </Text>
          </View>
        ) : (
          partituras.map((partitura) => {
            const provider = configs.find(c => c.provider === partitura.storage_provider);
            const providerName = provider ? (provider.provider === 'dropbox' ? 'Dropbox' : 'Google Drive') : 'Desconocido';

            return (
              <View key={partitura.id} className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <View className="flex-row items-center">
                  <View className={`w-12 h-12 rounded-lg items-center justify-center mr-3 ${isDark ? 'bg-gray-700' : 'bg-indigo-100'}`}>
                    <Text className="text-2xl">{getFileIcon(partitura.file_type)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {partitura.title}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {providerName} • {partitura.file_type?.toUpperCase()} • {Math.round((partitura.file_size || 0) / 1024)} KB
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleEliminar(partitura)}
                    className={`p-2 rounded-lg ${isDark ? 'active:bg-gray-700' : 'active:bg-gray-100'}`}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
