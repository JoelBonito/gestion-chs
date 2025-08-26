
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveUploadRequest {
  fileName: string;
  fileContent: string; // base64 encoded
  mimeType: string;
  entityType?: string;
  entityId?: string;
}

// Mapeamento das pastas específicas criadas no Google Drive
const FOLDER_MAPPING = {
  'produto': '1DFOXDGhkKfHm1FceL4p8C4bHRKhxMPUh', // Pasta ARTIGOS
  'financeiro': '1DFOXDGhkKfHm1FceL4p8C4bHRKhxMPUh', // Pasta FINANCEIRO
  'default': '1DFOXDGhkKfHm1FceL4p8C4bHRKhxMPUh' // Pasta principal como fallback
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileContent, mimeType, entityType, entityId }: GoogleDriveUploadRequest = await req.json();

    // Get the service account key from Supabase secrets
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('Google Service Account Key not found in secrets');
    }

    console.log('Service account key length:', serviceAccountKey.length);
    console.log('Service account key first 50 chars:', serviceAccountKey.substring(0, 50));

    let credentials;
    try {
      credentials = JSON.parse(serviceAccountKey);
    } catch (parseError) {
      console.error('Error parsing service account key:', parseError);
      console.error('Raw key value:', serviceAccountKey);
      throw new Error(`Failed to parse service account key: ${parseError.message}`);
    }

    console.log('Using service account:', credentials.client_email);

    // Create JWT for Google API authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/drive.file',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour
      iat: now
    };

    // Create JWT token
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const signatureInput = encodedHeader + '.' + encodedPayload;
    
    // Import the private key
    const privateKeyPem = credentials.private_key;
    const privateKeyFormatted = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const privateKeyBuffer = Uint8Array.from(atob(privateKeyFormatted), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Sign the JWT
    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = signatureInput + '.' + signature;

    // Exchange JWT for access token
    console.log('Requesting access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token request failed:', errorText);
      throw new Error(`Failed to get access token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Access token obtained successfully');

    // Determinar a pasta correta baseada no entityType
    let folderId = FOLDER_MAPPING.default; // Pasta principal como fallback
    
    if (entityType) {
      if (entityType === 'produto') {
        // Buscar a subpasta ARTIGOS dentro da pasta principal
        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='ARTIGOS' and mimeType='application/vnd.google-apps.folder' and '${FOLDER_MAPPING.produto}' in parents`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
          console.log('Using ARTIGOS folder for produto');
        }
      } else if (entityType === 'financeiro') {
        // Buscar a subpasta FINANCEIRO dentro da pasta principal
        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='FINANCEIRO' and mimeType='application/vnd.google-apps.folder' and '${FOLDER_MAPPING.financeiro}' in parents`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
          console.log('Using FINANCEIRO folder for financeiro');
        }
      }
    }

    console.log('Using folder ID:', folderId);

    // Upload file to Google Drive
    console.log('Uploading file to Google Drive...');
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      parents: [folderId]
    };

    // Convert base64 to binary
    const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

    const multipartRequestBody = 
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      'Content-Transfer-Encoding: binary\r\n\r\n' +
      String.fromCharCode.apply(null, Array.from(binaryContent)) +
      close_delim;

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartRequestBody,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Upload failed: ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('File uploaded successfully:', uploadData.id);

    // Make file publicly readable (optional)
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    // Return the file information
    const result = {
      fileId: uploadData.id,
      webViewLink: `https://drive.google.com/file/d/${uploadData.id}/view`,
      downloadLink: `https://drive.google.com/uc?export=download&id=${uploadData.id}`,
      name: uploadData.name,
      mimeType: uploadData.mimeType || mimeType,
      size: uploadData.size ? parseInt(uploadData.size) : 0
    };

    console.log('Upload completed successfully:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-upload function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
