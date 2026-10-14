import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { X } from 'lucide-react-native';

const createOrgSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido').default('#6366f1'),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

interface CreateOrganizationModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOrganizationModal({ visible, onClose, onCreated }: CreateOrganizationModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
      name: '',
      primaryColor: '#6366f1',
    },
  });

  const onSubmit = async (data: CreateOrgForm) => {
    if (!user) return;

    setLoading(true);
    try {
      // Crear la organización
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          primary_color: data.primaryColor,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Añadir al usuario como admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      Alert.alert('Éxito', 'Organización creada correctamente');
      reset();
      onCreated();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al crear la organización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Nueva organización
            </Text>
            <Pressable onPress={onClose}>
              <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Nombre de la organización
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`px-4 py-3 rounded-lg border ${
                    errors.name 
                      ? 'border-red-500' 
                      : isDark ? 'border-gray-600' : 'border-gray-300'
                  } ${isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                  placeholder="Mi grupo musical"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-sm mt-1">{errors.name.message}</Text>
            )}
          </View>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-indigo-600 py-3 rounded-lg items-center mb-3"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Crear organización</Text>
            )}
          </Pressable>

          <Pressable onPress={onClose} className="items-center">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
