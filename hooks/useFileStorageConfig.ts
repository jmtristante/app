import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface FileStorageConfig {
  id: string;
  organization_id: string;
  provider: 'google_drive' | 'dropbox' | 'onedrive' | 'local';
  provider_config: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useFileStorageConfig(organizationId: string | null) {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<FileStorageConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !organizationId) {
      setConfigs([]);
      setLoading(false);
      return;
    }

    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('file_storage_configs')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('is_active', true)
          .order('is_default', { ascending: false });

        if (error) throw error;

        setConfigs(data || []);
      } catch (error) {
        console.error('Error fetching file storage configs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [user, organizationId]);

  const saveConfig = async (config: Omit<FileStorageConfig, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('file_storage_configs')
      .insert([config])
      .select()
      .single();

    if (error) throw error;

    setConfigs([...configs, data]);
    return data;
  };

  const updateConfig = async (id: string, updates: Partial<FileStorageConfig>) => {
    const { data, error } = await supabase
      .from('file_storage_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    setConfigs(configs.map(c => c.id === id ? data : c));
    return data;
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase
      .from('file_storage_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setConfigs(configs.filter(c => c.id !== id));
  };

  const getDefaultConfig = () => configs.find(c => c.is_default) || configs[0];

  return { configs, loading, saveConfig, updateConfig, deleteConfig, getDefaultConfig };
}
