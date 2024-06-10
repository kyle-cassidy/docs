import { BlockNoteEditor as BlockNoteEditorCore } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import React, { useEffect, useMemo } from 'react';
import { WebrtcProvider } from 'y-webrtc';

import { Box } from '@/components';
import { useAuthStore } from '@/core/auth';
import { Pad } from '@/features/pads/pad-management';

import useSavePad from '../hook/useSavePad';
import { usePadStore } from '../stores';
import { randomColor } from '../utils';

import { BlockNoteToolbar } from './BlockNoteToolbar';

interface BlockNoteEditorProps {
  pad: Pad;
}

export const BlockNoteEditor = ({ pad }: BlockNoteEditorProps) => {
  const { createProvider, padsStore } = usePadStore();
  const provider = padsStore?.[pad.id]?.provider;

  if (!provider) {
    createProvider(pad.id, pad.content);
    return null;
  }

  return <BlockNoteContent pad={pad} provider={provider} />;
};

interface BlockNoteContentProps {
  pad: Pad;
  provider: WebrtcProvider;
}

export const BlockNoteContent = ({ pad, provider }: BlockNoteContentProps) => {
  const { userData } = useAuthStore();
  const { setEditor, padsStore } = usePadStore();
  useSavePad(pad.id, provider.doc, pad.abilities.partial_update);

  const storedEditor = padsStore?.[pad.id]?.editor;
  const editor = useMemo(() => {
    if (storedEditor) {
      return storedEditor;
    }

    return BlockNoteEditorCore.create({
      collaboration: {
        provider,
        fragment: provider.doc.getXmlFragment('document-store'),
        user: {
          name: userData?.email || 'Anonymous',
          color: randomColor(),
        },
      },
    });
  }, [provider, storedEditor, userData?.email]);

  useEffect(() => {
    setEditor(pad.id, editor);
  }, [setEditor, pad.id, editor]);

  return (
    <Box
      $css={`
        &, & > .bn-container, & .ProseMirror {
          height:100%
        };
        & .collaboration-cursor__caret.ProseMirror-widget{
          word-wrap: initial;
        }
      `}
    >
      <BlockNoteView
        editor={editor}
        formattingToolbar={false}
        editable={pad.abilities.partial_update}
      >
        <BlockNoteToolbar />
      </BlockNoteView>
    </Box>
  );
};
