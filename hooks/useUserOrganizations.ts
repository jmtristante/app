import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface Organization {
  id: string;
  name: string;
  primary_color: string;
  type: 'personal' | 'group';
  owner_user_id?: string;
  created_at: string;
}

export function useUserOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [personalOrg, setPersonalOrg] = useState<Organization | null>(null);
  const [groupOrgs, setGroupOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizations([]);
      setPersonalOrg(null);
      setGroupOrgs([]);
      setLoading(false);
      return;
    }

    const fetchOrganizations = async () => {
      try {
        // Primero obtenemos los memberships del usuario
        const { data: memberships, error: membershipError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);

        if (membershipError) throw membershipError;
        if (!memberships || memberships.length === 0) {
          setOrganizations([]);
          setPersonalOrg(null);
          setGroupOrgs([]);
          setLoading(false);
          return;
        }

        // Luego obtenemos los detalles de las organizaciones
        const orgIds = memberships.map(m => m.organization_id);
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, primary_color, type, owner_user_id, created_at')
          .in('id', orgIds)
          .order('type', { ascending: false }) // personal primero
          .order('name');

        if (orgError) throw orgError;

        const allOrgs = organizations || [];
        setOrganizations(allOrgs);
        
        // Separar personal y de grupo
        const personal = allOrgs.find(o => o.type === 'personal') || null;
        const groups = allOrgs.filter(o => o.type === 'group');
        
        setPersonalOrg(personal);
        setGroupOrgs(groups);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  const isPersonal = (orgId: string) => personalOrg?.id === orgId;

  return { organizations, personalOrg, groupOrgs, loading, isPersonal };
}
