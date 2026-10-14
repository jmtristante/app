import { View, Text, Pressable } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserCircle, Mail, Phone, LogOut } from 'lucide-react-native';

export default function PerfilScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  const userName = profile?.full_name || user?.email || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`px-6 py-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mi perfil</Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Tus datos personales
        </Text>
      </View>
      
      <View className="flex-1 p-6">
        <View className={`p-6 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-white'} mb-6`}>
          <View className="w-20 h-20 rounded-full bg-indigo-500 items-center justify-center mb-3">
            <Text className="text-white font-bold text-2xl">{userInitials}</Text>
          </View>
          <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {userName}
          </Text>
          <View className="flex-row items-center mt-2">
            <Mail size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} mb-4`}>
          <View className="flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700">
            <UserCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-3 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</Text>
            <Text className={isDark ? 'text-white' : 'text-gray-900'}>{userName}</Text>
          </View>
          <View className="flex-row items-center py-3">
            <Mail size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text className={`ml-3 flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</Text>
            <Text className={isDark ? 'text-white' : 'text-gray-900'}>{user?.email}</Text>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          className="flex-row items-center justify-center py-3 rounded-xl bg-red-50 active:bg-red-100 dark:bg-red-900/20"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="ml-2 text-red-600 font-semibold">Cerrar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}
