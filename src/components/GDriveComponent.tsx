// src/components/GDriveComponent.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Select, Button, Text, Container, Grid, Alert, Box, Anchor, 
         ScrollArea, Loader } from '@mantine/core';
import { createStyles, rem } from '@mantine/styles';
import axios from 'axios';

interface Folder {
  id: string;
  name: string;
}

interface File {
  id: string;
  name: string;
  mimeType: string;
}


const useStyles = createStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: theme.spacing.sm,
  },
  signOutLink: {
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  content: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  fileList: {
    width: '25%',
    paddingRight: theme.spacing.md,
  },
  fileItem: {
    cursor: 'pointer',
    padding: rem(5),
    border: `${rem(1)} solid ${theme.colors.gray[4]}`,
    margin: `${rem(5)} 0`,
    '&:hover': {
      backgroundColor: theme.colors.orange[1],
    },
  },
  previewArea: {
    flex: 1,
    overflow: 'hidden',
  },
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: rem(40),
  },
}));

function useDebounce(callback: (...args: any[]) => void, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: any[]) => {
    if (timer) {
      clearTimeout(timer);
    }
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    setTimer(newTimer);
  }, [callback, delay, timer]);

  return debouncedCallback;
}

export default function GDriveComponent() {
  const HOVER_DELAY_MS = 300; // ms
  const { classes } = useStyles();
  const { data: session, status } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isFoldersLoading, setIsFoldersLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    try {
      setIsFoldersLoading(true);
      const response = await axios.get<Folder[]>('/api/gdrive');
      setFolders(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Failed to fetch folders');
    } finally {
      setIsFoldersLoading(false);
    }
  };

  const fetchFiles = async (folderId: string) => {
    try {
      const response = await axios.get<File[]>(`/api/gdrive?folderId=${folderId}`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to fetch files');
    }
  };

  useEffect(() => {
    if (session) {
      fetchFolders();
    }
  }, [session]);

  useEffect(() => {
    if (selectedFolder) {
      fetchFiles(selectedFolder);
    }
  }, [selectedFolder]);

  const debouncedHandleFileHover = useDebounce((file: File) => {
    if (file.mimeType === 'application/pdf') {
      setSelectedFile(file);
      setPreviewUrl(`/api/gdrive?fileId=${file.id}`);
    }
  }, HOVER_DELAY_MS);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <Container size="100%" px="xs">
        <Text>Not signed in</Text>
        <Button onClick={() => signIn('google')}>Sign in with Google</Button>
      </Container>
    );
  }

 return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Anchor onClick={() => signOut()} className={classes.signOutLink}>
          Sign out
        </Anchor>
      </div>
      {error && <Alert color="red">{error}</Alert>}
      <div className={classes.content}>
        <div className={classes.fileList}>
          {isFoldersLoading ? (
            <div className={classes.loader}>
              <Loader />
            </div>
          ) : (
            <Select
              label="Select a folder"
              placeholder="Choose a folder"
              searchable
              nothingFoundMessage="No folders found"
              data={folders.map((folder) => ({ value: folder.id, label: folder.name }))}
              value={selectedFolder}
              onChange={setSelectedFolder}
            />
          )}
          <ScrollArea h="calc(100vh - 120px)" mt="md">
            {files.map((file) => (
              <Box
                key={file.id}
                onMouseEnter={() => debouncedHandleFileHover(file)}
                className={classes.fileItem}
              >
                {file.name}
              </Box>
            ))}
          </ScrollArea>
        </div>
        <div className={classes.previewArea}>
          {previewUrl && (
            <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
          )}
        </div>
      </div>
    </div>
 );
}
