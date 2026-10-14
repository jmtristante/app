import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(data);
    setLoading(false);
    
    if (error) {
      // Mejorar mensajes de error
      let message = error.message;
      if (error.message.toLowerCase().includes('email not confirmed')) {
        message = 'Tu cuenta no está confirmada. Revisa tu correo electrónico para activar tu cuenta.';
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        message = 'Email o contraseña incorrectos.';
      }
      Alert.alert('Error', message);
    } else {
      router.replace('/');
    }
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-full max-w-md">
          <View className="mb-8">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Iniciar sesión
            </Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Accede a tu cuenta de Politonos
            </Text>
          </View>

          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 rounded-lg border ${
                    errors.email 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-700' : 'border-gray-300'
                  } ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="tu@email.com"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1">{errors.email.message}</Text>
            )}
          </View>

          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Contraseña
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 rounded-lg border ${
                    errors.password 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-700' : 'border-gray-300'
                  } ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="••••••••"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">{errors.password.message}</Text>
            )}
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-indigo-600 py-3 rounded-lg items-center mb-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Iniciar sesión</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.push('/register')}
            className="items-center"
          >
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              ¿No tienes cuenta?{' '}
              <Text className="text-indigo-600 font-semibold">Regístrate</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
