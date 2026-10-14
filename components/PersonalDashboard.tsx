import { View, Text, Pressable } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { Calendar, Users, Music2, TrendingUp, Home } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

interface PersonalDashboardProps {
  userId: string | null;
}

interface ConsolidatedStats {
  proximoEnsayo: { fecha: string; org: string; tipo: string } | null;
  proximaActuacion: { fecha: string; org: string; tipo: string } | null;
  organizacionesActivas: number;
  piezasRepertorio: number;
  totalEnsayosPendientes: number;
  totalActuacionesPendientes: number;
}

interface ActividadItem {
  id: string;
  tipo: 'ensayo' | 'actuacion';
  titulo: string;
  organizacion: string;
  fecha: string;
  color: string;
  esPersonal: boolean;
}

export default function PersonalDashboard({ userId }: PersonalDashboardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { organizations } = useUserOrganizations();
  const [stats, setStats] = useState<ConsolidatedStats | null>(null);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || organizations.length === 0) {
      setLoading(false);
      return;
    }

    const fetchConsolidated = async () => {
      try {
        const orgIds = organizations.map(o => o.id);
        
        const [ensayosRes, actuacionesRes, cancionesRes] = await Promise.all([
          supabase.from('rehearsals')
            .select('id, title, rehearsal_date, location, organization_id')
            .in('organization_id', orgIds)
            .gte('rehearsal_date', new Date().toISOString())
            .order('rehearsal_date')
            .limit(5),
          supabase.from('performances')
            .select('id, title, event_date, venue_name, organization_id')
            .in('organization_id', orgIds)
            .gte('event_date', new Date().toISOString())
            .order('event_date')
            .limit(5),
          supabase.from('songs')
            .select('id')
            .in('organization_id', orgIds),
        ]);

        const ensayos = ensayosRes.data || [];
        const actuaciones = actuacionesRes.data || [];
        const canciones = cancionesRes.data || [];

        const getOrgName = (orgId: string) => {
          const org = organizations.find(o => o.id === orgId);
          return org?.name || 'Desconocida';
        };

        const getOrgType = (orgId: string) => {
          const org = organizations.find(o => o.id === orgId);
          return org?.type === 'personal' ? 'Personal' : 'Grupo';
        };

        setStats({
          proximoEnsayo: ensayos[0] ? {
            fecha: new Date(ensayos[0].rehearsal_date).toLocaleDateString('es-ES', { 
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            org: getOrgName(ensayos[0].organization_id),
            tipo: getOrgType(ensayos[0].organization_id),
          } : null,
          proximaActuacion: actuaciones[0] ? {
            fecha: new Date(actuaciones[0].event_date).toLocaleDateString('es-ES', { 
              day: 'numeric', month: 'short'
            }),
            org: getOrgName(actuaciones[0].organization_id),
            tipo: getOrgType(actuaciones[0].organization_id),
          } : null,
          organizacionesActivas: organizations.length,
          piezasRepertorio: canciones.length,
          totalEnsayosPendientes: ensayos.length,
          totalActuacionesPendientes: actuaciones.length,
        });

        const items: ActividadItem[] = [];
        
        ensayos.forEach((e, i) => {
          items.push({
            id: `ensayo-${i}`,
            tipo: 'ensayo',
            titulo: e.title || 'Ensayo',
            organizacion: getOrgName(e.organization_id),
            fecha: new Date(e.rehearsal_date).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            color: '#6366f1',
            esPersonal: organizations.find(o => o.id === e.organization_id)?.type === 'personal',
          });
        });

        actuaciones.forEach((a, i) => {
          items.push({
            id: `actuacion-${i}`,
            tipo: 'actuacion',
            titulo: a.title || 'Actuación',
            organizacion: getOrgName(a.organization_id),
            fecha: new Date(a.event_date).toLocaleDateString('es-ES', {
              day: 'numeric', month: 'short', hour: '2-digit'
            }),
            color: '#10b981',
            esPersonal: organizations.find(o => o.id === a.organization_id)?.type === 'personal',
          });
        });

        // Ordenar por fecha
        items.sort((a, b) => {
          const aFecha = a.fecha.includes(':') ? new Date(a.fecha) : new Date(a.fecha);
          const bFecha = b.fecha.includes(':') ? new Date(b.fecha) : new Date(b.fecha);
          return aFecha.getTime() - bFecha.getTime();
        });

        setActividad(items.slice(0, 8));
      } catch (error) {
        console.error('Error fetching consolidated data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConsolidated();
  }, [userId, organizations]);

  if (loading) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>Cargando...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className={`flex-1 items-center justify-center p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-indigo-100'}`}>
          <Home size={28} color="#6366f1" />
        </View>
        <Text className={`text-lg font-semibold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Bienvenido a tu espacio personal
        </Text>
        <Text className={`text-sm text-center mt-2 max-w-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Aquí verás toda tu actividad musical consolidada: ensayos, actuaciones y repertorio de todas tus organizaciones.
        </Text>
      </View>
    );
  }

  const StatCard = ({ icon: Icon, color, label, value, subValue }: any) => (
    <View className="w-1/2 px-2 mb-4">
      <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className="flex-row items-center mb-2">
          <View style={{ backgroundColor: color + '20' }} className="w-8 h-8 rounded-lg items-center justify-center mr-2">
            <Icon size={16} color={color} />
          </View>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</Text>
        </View>
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</Text>
        {subValue && <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{subValue}</Text>}
      </View>
    </View>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className={`px-6 py-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b`}>
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Mi espacio</Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Vista consolidada de toda tu actividad musical
        </Text>
      </View>

      <View className="flex-1 p-6">
        <View className="flex-row flex-wrap -mx-2 mb-6">
          <StatCard icon={Calendar} color="#6366f1" label="Próximo ensayo" value={stats.proximoEnsayo?.fecha || 'Ninguno'} subValue={stats.proximoEnsayo?.org} />
          <StatCard icon={Users} color="#10b981" label="Próxima actuación" value={stats.proximaActuacion?.fecha || 'Ninguna'} subValue={stats.proximaActuacion?.org} />
          <StatCard icon={TrendingUp} color="#f59e0b" label="Organizaciones" value={stats.organizacionesActivas.toString()} subValue={`${stats.totalEnsayosPendientes} ensayos`} />
          <StatCard icon={Music2} color="#8b5cf6" label="Repertorio total" value={stats.piezasRepertorio.toString()} subValue={`${stats.totalActuacionesPendientes} actuaciones`} />
        </View>

        <View className={`p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} mb-6`}>
          <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Próximos eventos
          </Text>
          
          {actividad.length === 0 ? (
            <Text className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No hay eventos programados
            </Text>
          ) : (
            actividad.map((item) => {
              const Icon = item.tipo === 'ensayo' ? Calendar : Users;
              return (
                <Pressable 
                  key={item.id} 
                  className={`flex-row items-center py-3 ${isDark ? 'border-gray-700' : 'border-gray-100'} border-b`}
                >
                  <View style={{ backgroundColor: item.color + '20' }} className="w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Icon size={18} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.titulo}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.fecha}</Text>
                      <View className={`w-1 h-1 rounded-full mx-2 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`} />
                      <Text className={`text-xs ${item.esPersonal ? 'text-indigo-500' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                        {item.organizacion}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>
    </View>
  );
}
