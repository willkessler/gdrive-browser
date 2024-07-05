'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Select, Button, Text, Container, Alert, Box, Anchor, ScrollArea, CloseButton } from '@mantine/core';
import { createStyles, rem } from '@mantine/styles';
import axios from 'axios';

const useStyles = createStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.sm,
    position: 'sticky',
    top: 0,
    backgroundColor: theme.white,
    zIndex: 1000,
  },
  signOutLink: {
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  content: {
    flex: 1,
    overflow: 'auto',
    position: 'relative',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tileWrapper: {
    position: 'relative',
    width: '100%',
    paddingBottom: '100%',
  },
  tile: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.blue[6],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
  },
  fileName: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  expandedPreview: {
    position: 'absolute',
    top: '10%',
    left: '10%',
    width: '80%',
    height: '80%',
    backgroundColor: theme.white,
    zIndex: 1000,
    boxShadow: theme.shadows.lg,
    padding: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
}));

interface File {
  id: string;
  name: string;
  mimeType: string;
}

interface Folder {
  id: string;
  name: string;
}

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
  const { classes, cx } = useStyles();
  const { data: session, status } = useSession();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewStates, setPreviewStates] = useState<{[key: string]: boolean}>({});
  const [expandedStates, setExpandedStates] = useState<{[key: string]: boolean}>({});
  const [clickedPreview, setClickedPreview] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = async () => {
    try {
      const response = await axios.get<Folder[]>('/api/gdrive');
      setFolders(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setError('Failed to fetch folders');
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
    if (session) {
      fetchFolders();
    }
  }, [session]);

  useEffect(() => {
    if (selectedFolder) {
      fetchFiles(selectedFolder);
    }
  }, [selectedFolder]);

  const debouncedSetPreviewState = useDebounce((fileId: string, state: boolean) => {
    setPreviewStates(prev => ({ ...prev, [fileId]: state }));
  }, 300);

  const handleMouseEnter = (fileId: string) => {
    debouncedSetPreviewState(fileId, true);
  };

  const handleMouseLeave = (fileId: string) => {
    debouncedSetPreviewState(fileId, false);
  };

  const handleClick = (file: File) => {
    setClickedPreview(file);
  };

  const handleDoubleClick = (file: File) => {
    window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank');
  };

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
        <Select
          style={{ width: '300px' }}
          label="Select a folder"
          placeholder="Choose a folder"
          searchable
          nothingFoundMessage="No folders found"
          data={folders.map((folder) => ({ value: folder.id, label: folder.name }))}
          value={selectedFolder}
          onChange={setSelectedFolder}
        />
        <Anchor onClick={() => signOut()} className={classes.signOutLink}>
          Sign out
        </Anchor>
      </div>
      {error && <Alert color="red">{error}</Alert>}
      <div className={classes.content}>
        <div className={classes.grid}>
          {files.map((file) => (
            <div key={file.id}>
              <div className={classes.tileWrapper}>
                <div
                  className={classes.tile}
                  onMouseEnter={() => handleMouseEnter(file.id)}
                  onMouseLeave={() => handleMouseLeave(file.id)}
                  onClick={() => handleClick(file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                >
                  {previewStates[file.id] ? (
                    <object
                      data={`/api/gdrive?fileId=${file.id}`}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                    >
                      <p>Unable to display PDF file.</p>
                    </object>
                  ) : null}
                </div>
              </div>
              <Text className={classes.fileName}>{file.name}</Text>
            </div>
          ))}
        </div>
        {clickedPreview && (
          <div className={classes.expandedPreview}>
            <CloseButton 
              onClick={() => setClickedPreview(null)} 
              className={classes.closeButton}
            />
            <object
              data={`/api/gdrive?fileId=${clickedPreview.id}`}
              type="application/pdf"
              width="100%"
              height="100%"
            >
              <p>Unable to display PDF file.</p>
            </object>
          </div>
        )}
      </div>
    </div>
  );
}

