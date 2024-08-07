import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';
import { PDFDocument } from 'pdf-lib';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('fileId');
  const folderId = searchParams.get('folderId');

  if (fileId) {
    try {
      // Get file content
      const response = await drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, { responseType: 'arraybuffer' });

      return new NextResponse(response.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
    } catch (error) {
      console.error('Error fetching file:', error);
      return NextResponse.json({ error: 'Error fetching file' }, { status: 500 });
    }
  } else if (folderId) {
    try {
      // List files in folder
      const response = await drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/pdf'`,
        fields: 'files(id, name, mimeType)',
      });

      return NextResponse.json(response.data.files);
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Error fetching data from Google Drive' }, { status: 500 });
    }
  } else {
    try {
      // List folders
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id, name)',
      });

      return NextResponse.json(response.data.files);
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: 'Error fetching data from Google Drive' }, { status: 500 });
    }
  }
}
