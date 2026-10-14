import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';

// Configuración OAuth de Google Drive
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Estas credenciales se configuran en tu proyecto
// Las obtienes de: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_REDIRECT_URI = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI || '';

export interface GoogleDriveConfig {
  access_token: string;
  refresh_token?: string;
  account_id: string;
  account_name: string;
}

export class GoogleDriveService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken || null;
  }

  /**
   * Inicia el flujo OAuth de Google Drive
   */
  static async startAuth(): Promise<GoogleDriveConfig | null> {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      throw new Error('Google Drive credentials not configured');
    }

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'politonos',
      path: 'google/callback',
    });

    const authUrl = `${GOOGLE_AUTH_URL}?client_id=${GOOGLE_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata&access_type=offline&prompt=consent`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');

      if (code) {
        // Intercambiar código por tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.access_token) {
          return {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            account_id: tokenData.scope || 'google_user',
            account_name: 'Google Drive User',
          };
        }
      }
    }

    return null;
  }

  /**
   * Crea una carpeta en Google Drive
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : ['root'],
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Sube un archivo a Google Drive
   */
  async uploadFile(
    file: { uri: string; name: string; type: string },
    parentId: string
  ): Promise<{ id: string; name: string; size: number }> {
    // Leer el archivo
    const fileBlob = await fetch(file.uri).then(r => r.blob());
    const fileContent = await fileBlob.arrayBuffer();

    const metadata = {
      name: file.name,
      parents: [parentId],
    };

    const boundary = 'boundary';
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${file.type}\r\n\r\n`;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body + fileContent + `\r\n--${boundary}--`,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      size: parseInt(data.size) || 0,
    };
  }

  /**
   * Obtiene un enlace compartible para un archivo
   */
  async getSharedLink(fileId: string): Promise<string> {
    // Hacer el archivo público
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        writersCanShare: true,
      }),
    });

    // Crear permiso público
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }

  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(folderId: string): Promise<Array<{ id: string; name: string; size: number }>> {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents&fields=files(id,name,size)`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to list files');
    }

    const data = await response.json();
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: parseInt(file.size) || 0,
    }));
  }
}
