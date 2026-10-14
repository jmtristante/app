import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

// Configuración OAuth de Dropbox
const DROPBOX_AUTH_URL = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';

// Estas credenciales se configuran en tu proyecto
// Las obtienes de: https://www.dropbox.com/developers/apps
const DROPBOX_CLIENT_ID = process.env.EXPO_PUBLIC_DROPBOX_CLIENT_ID || '';
const DROPBOX_REDIRECT_URI = process.env.EXPO_PUBLIC_DROPBOX_REDIRECT_URI || '';

export interface DropboxConfig {
  access_token: string;
  account_id: string;
  account_name: string;
  refresh_token?: string;
}

export class DropboxService {
  private accessToken: string | null = null;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Inicia el flujo OAuth de Dropbox
   */
  static async startAuth(): Promise<DropboxConfig | null> {
    if (!DROPBOX_CLIENT_ID) {
      throw new Error('Dropbox credentials not configured. Check .env file.');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'politonos',
      path: 'dropbox/callback',
    });

    console.log('Dropbox Auth - Redirect URI:', redirectUri);
    console.log('Dropbox Auth - Client ID:', DROPBOX_CLIENT_ID);

    const authUrl = `${DROPBOX_AUTH_URL}?client_id=${DROPBOX_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&token_access_type=offline&scope=files.content.write files.content.read files.metadata.write files.metadata.read`;

    console.log('Dropbox Auth - Opening:', authUrl);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    console.log('Dropbox Auth - Result:', result);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const fragment = url.hash.substring(1);
      const params = new URLSearchParams(fragment);
      
      const accessToken = params.get('access_token');
      const uid = params.get('uid');
      const account_id = params.get('account_id');

      console.log('Dropbox Auth - Token:', accessToken ? 'Present' : 'Missing');
      console.log('Dropbox Auth - Account ID:', account_id);

      if (accessToken && account_id) {
        return {
          access_token: accessToken,
          account_id: account_id,
          account_name: uid || 'Dropbox User',
        };
      }
    }

    if (result.type === 'cancel') {
      throw new Error('Autenticación cancelada por el usuario');
    }

    if (result.type === 'dismiss') {
      throw new Error('Ventana de autenticación cerrada');
    }

    return null;
  }

  /**
   * Crea una carpeta en Dropbox
   */
  async createFolder(path: string): Promise<string> {
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path,
        autorename: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    const data = await response.json();
    return data.metadata.path_display;
  }

  /**
   * Sube un archivo a Dropbox
   */
  async uploadFile(
    file: { uri: string; name: string; type: string },
    dropboxPath: string
  ): Promise<{ id: string; path: string; size: number }> {
    // Leer el archivo
    const fileBlob = await fetch(file.uri).then(r => r.blob());
    const fileContent = await fileBlob.arrayBuffer();

    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
          mute: false,
        }),
      },
      body: fileContent,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_summary || 'Failed to upload file');
    }

    const data = await response.json();
    return {
      id: data.id,
      path: data.path_display,
      size: data.size,
    };
  }

  /**
   * Obtiene un enlace compartido para un archivo
   */
  async getSharedLink(fileId: string): Promise<string> {
    const response = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: fileId,
        settings: {
          requested_visibility: 'public',
        },
      }),
    });

    if (!response.ok) {
      // Si ya existe un link compartido, obtenerlo
      const existingLink = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: fileId,
        }),
      });

      const existingData = await existingLink.json();
      if (existingData.links && existingData.links.length > 0) {
        return existingData.links[0].url;
      }

      throw new Error('Failed to create shared link');
    }

    const data = await response.json();
    return data.url;
  }

  /**
   * Elimina un archivo de Dropbox
   */
  async deleteFile(path: string): Promise<void> {
    const response = await fetch('https://api.dropboxapi.com/2/files/delete_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(folderPath: string): Promise<Array<{ id: string; name: string; path: string; size: number }>> {
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: folderPath,
        recursive: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return data.entries.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      path: entry.path_display,
      size: entry.size,
    }));
  }
}
