import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Membership {
  organization_id: string;
  role: string;
  joined_at: string;
}

export function useUserMembership(organizationId: string | null) {
  const { user } = useAuth();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !organizationId) {
      setMembership(null);
      setLoading(false);
      return;
    }

    const fetchMembership = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id, role, joined_at')
          .eq('user_id', user.id)
          .eq('organization_id', organizationId)
          .single();

        if (error) throw error;

        setMembership(data);
      } catch (error) {
        console.error('Error fetching membership:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembership();
  }, [user, organizationId]);

  return { membership, loading };
}
