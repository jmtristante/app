import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Partitura {
  id: string;
  organization_id: string;
  title: string;
  composer?: string;
  instrument?: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  storage_provider: string;
  storage_id: string;
  created_at: string;
  updated_at: string;
}

export function usePartituras(organizationId: string | null) {
  const { user } = useAuth();
  const [partituras, setPartituras] = useState<Partitura[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !organizationId) {
      setPartituras([]);
      setLoading(false);
      return;
    }

    const fetchPartituras = async () => {
      try {
        const { data, error } = await supabase
          .from('partituras')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setPartituras(data || []);
      } catch (error) {
        console.error('Error fetching partituras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartituras();
  }, [user, organizationId]);

  const createPartitura = async (partitura: Omit<Partitura, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('partituras')
      .insert([partitura])
      .select()
      .single();

    if (error) throw error;

    setPartituras([data, ...partituras]);
    return data;
  };

  const updatePartitura = async (id: string, updates: Partial<Partitura>) => {
    const { data, error } = await supabase
      .from('partituras')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setPartituras(partituras.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePartitura = async (id: string) => {
    const { error } = await supabase
      .from('partituras')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setPartituras(partituras.filter(p => p.id !== id));
  };

  return { partituras, loading, createPartitura, updatePartitura, deletePartitura };
}
