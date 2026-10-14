import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Calendar, Users, Music2, TrendingUp, UserPlus, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardProps {
  organizacionId: string | null;
  isEmpty?: boolean;
}

interface DashboardStats {
  proximoEnsayo: { fecha: string; lugar: string } | null;
  proximaActuacion: { fecha: string; lugar: string; dias: number } | null;
  musicosActivos: number;
  totalMusicos: number;
  piezasRepertorio: number;
  piezasPorTrabajar: number;
}

interface ActividadItem {
  id: string;
  tipo: 'ensayo' | 'actuacion' | 'repertorio' | 'musico';
  titulo: string;
  fecha: string;
  color: string;
}

export default function Dashboard({ organizacionId, isEmpty = false }: DashboardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!organizacionId) {
      setLoading(false);
      return;
    }
    
    const fetchDashboardData = async () => {
      try {
        // Obtener estadísticas básicas
        const [musicosRes, cancionesRes, ensayosRes, actuacionesRes] = await Promise.all([
          supabase.from('musicians').select('id, active').eq('organization_id', organizacionId),
          supabase.from('songs').select('id').eq('organization_id', organizacionId),
          supabase.from('rehearsals')
            .select('id, title, rehearsal_date, location')
            .eq('organization_id', organizacionId)
            .gte('rehearsal_date', new Date().toISOString())
            .order('rehearsal_date')
            .limit(1),
          supabase.from('performances')
            .select('id, title, event_date, venue_name')
            .eq('organization_id', organizacionId)
            .gte('event_date', new Date().toISOString())
            .order('event_date')
            .limit(1),
        ]);
        
        const musicos = musicosRes.data || [];
        const canciones = cancionesRes.data || [];
        const ensayos = ensayosRes.data || [];
        const actuaciones = actuacionesRes.data || [];
        
        const musicosActivos = musicos.filter(m => m.active).length;
        
        setStats({
          proximoEnsayo: ensayos[0] ? {
            fecha: new Date(ensayos[0].rehearsal_date).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }),
            lugar: ensayos[0].location || 'Por definir',
          } : null,
          proximaActuacion: actuaciones[0] ? {
            fecha: new Date(actuaciones[0].event_date).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short'
            }),
            lugar: actuaciones[0].venue_name || 'Por definir',
            dias: Math.ceil((new Date(actuaciones[0].event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          } : null,
          musicosActivos,
          totalMusicos: musicos.length,
          piezasRepertorio: canciones.length,
          piezasPorTrabajar: 0, // TODO: Implementar estado de trabajo
        });
        
        // Generar actividad reciente (ejemplo)
        const actividadItems: ActividadItem[] = [];
        
        if (ensayos[0]) {
          actividadItems.push({
            id: 'ensayo-1',
            tipo: 'ensayo',
            titulo: ensayos[0].title || 'Ensayo programado',
            fecha: 'Próximamente',
            color: '#6366f1',
          });
        }
        
        if (actuaciones[0]) {
          actividadItems.push({
            id: 'actuacion-1',
            tipo: 'actuacion',
            titulo: actuaciones[0].title || 'Actuación programada',
            fecha: `En ${Math.ceil((new Date(actuaciones[0].event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} días`,
            color: '#10b981',
          });
        }
        
        setActividad(actividadItems);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [organizacionId]);
  
  // Si no hay organización seleccionada
  if (isEmpty || !organizacionId) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-indigo-100'}`}>
          <FileText size={28} color="#6366f1" />
        </View>
        <Text className={`text-lg font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Crea tu primera organización
        </Text>
        <Text className={`text-sm text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Comienza gestionando tu grupo musical desde el panel lateral
        </Text>
      </View>
    );
  }
  
  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }
  
  if (!stats) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>Error al cargar datos</Text>
      </View>
    );
  }
  
  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="flex-1 p-6">
        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <View className="w-1/2 px-2 mb-4">
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: '#6366f1' + '20' }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
                  <Calendar size={16} color="#6366f1" />
                </View>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Próximo ensayo
                </Text>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.proximoEnsayo?.fecha || 'No programado'}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats.proximoEnsayo?.lugar || ''}
              </Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: '#10b981' + '20' }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
                  <Users size={16} color="#10b981" />
                </View>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Próxima actuación
                </Text>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.proximaActuacion?.fecha || 'No programada'}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats.proximaActuacion?.lugar || ''}
              </Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: '#f59e0b' + '20' }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
                  <TrendingUp size={16} color="#f59e0b" />
                </View>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Músicos activos
                </Text>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.musicosActivos}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                de {stats.totalMusicos} total
              </Text>
            </View>
          </View>
          
          <View className="w-1/2 px-2 mb-4">
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: '#8b5cf6' + '20' }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
                  <Music2 size={16} color="#8b5cf6" />
                </View>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Repertorio
                </Text>
              </View>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats.piezasRepertorio}
              </Text>
              <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {stats.piezasPorTrabajar} por trabajar
              </Text>
            </View>
          </View>
        </View>

        {/* Actividad reciente */}
        {actividad.length > 0 && (
          <View className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} mb-6`}>
            <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Próximos eventos
            </Text>
            
            {actividad.map((item) => {
              const Icon = item.tipo === 'ensayo' ? Calendar : 
                          item.tipo === 'actuacion' ? Users : Music2;
              return (
                <View key={item.id} className={`flex-row items-center py-3 ${isDark ? 'border-gray-700' : 'border-gray-100'} border-b`}>
                  <View style={{ backgroundColor: item.color + '20' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Icon size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.titulo}
                    </Text>
                    <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.fecha}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
