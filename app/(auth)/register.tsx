import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });
    setLoading(false);
    
    if (error) {
      // Mejorar mensajes de error
      let message = error.message;
      if (error.message.toLowerCase().includes('already registered') || 
          error.message.toLowerCase().includes('already exists')) {
        message = 'Este email ya está registrado. Revisa tu correo para confirmar tu cuenta o inicia sesión.';
      } else if (error.message.toLowerCase().includes('too many requests')) {
        message = 'Has intentado registrarte demasiadas veces. Espera unos minutos e intenta de nuevo.';
      }
      Alert.alert('Error', message);
    } else {
      Alert.alert(
        'Registro exitoso',
        'Te hemos enviado un email de confirmación. Revisa tu bandeja de entrada.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="justify-center items-center px-6 py-12 min-h-full">
        <View className="w-full max-w-md">
          <View className="mb-8">
            <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Crear cuenta
            </Text>
            <Text className={`text-base mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Regístrate en Politonos
            </Text>
          </View>

          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nombre completo
            </Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 rounded-lg border ${
                    errors.fullName 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-700' : 'border-gray-300'
                  } ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="Tu nombre"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName && (
              <Text className="text-red-500 text-sm mt-1">{errors.fullName.message}</Text>
            )}
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

          <View className="mb-4">
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

          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirmar contraseña
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 rounded-lg border ${
                    errors.confirmPassword 
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
            {errors.confirmPassword && (
              <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</Text>
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
              <Text className="text-white font-semibold text-base">Crear cuenta</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="items-center"
          >
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              ¿Ya tienes cuenta?{' '}
              <Text className="text-indigo-600 font-semibold">Iniciar sesión</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
