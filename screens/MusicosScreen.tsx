import { View, Text } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Users } from 'lucide-react-native';

interface MusicosScreenProps {
  organizacionId: string | null;
}

export default function MusicosScreen({ organizacionId }: MusicosScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  if (!organizacionId) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>Selecciona una organización</Text>
      </View>
    );
  }
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`px-6 py-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Músicos
        </Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Gestión de músicos del grupo
        </Text>
      </View>
      
      <View className="flex-1 items-center justify-center p-6">
        <View style={{ backgroundColor: isDark ? '#1f2937' : '#fef3c7' }} className="w-16 h-16 rounded-2xl items-center justify-center mb-4">
          <Users size={28} color="#f59e0b" />
        </View>
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Equipo musical
        </Text>
        <Text className={`text-sm text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Aquí aparecerá la lista de músicos con sus perfiles, instrumentos y estadísticas
        </Text>
      </View>
    </View>
  );
}
