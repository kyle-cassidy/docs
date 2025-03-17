import { Loader } from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Box, Text, TextErrors } from '@/components';
import { DocEditor } from '@/docs/doc-editor';
import { KEY_AUTH, setAuthUrl } from '@/features/auth';
import {
  Doc,
  KEY_DOC,
  useCollaboration,
  useDoc,
  useDocStore,
} from '@/features/docs/doc-management/';
import { DocTreeProvider } from '@/features/docs/doc-tree/context/DocTreeContext';
import { MainLayout } from '@/layouts';
import { useBroadcastStore } from '@/stores';
import { NextPageWithLayout } from '@/types/next';

export function DocLayout() {
  const {
    query: { id },
  } = useRouter();

  if (typeof id !== 'string') {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <DocTreeProvider initialTargetId={id}>
        <MainLayout>
          <DocPage id={id} />
        </MainLayout>
      </DocTreeProvider>
    </>
  );
}

interface DocProps {
  id: string;
}

const DocPage = ({ id }: DocProps) => {
  const {
    data: docQuery,
    isError,
    isFetching,
    error,
  } = useDoc(
    { id },
    {
      staleTime: 0,
      queryKey: [KEY_DOC, { id }],
    },
  );

  const [doc, setDoc] = useState<Doc>();
  const { setCurrentDoc } = useDocStore();
  const { addTask } = useBroadcastStore();
  const queryClient = useQueryClient();
  const { replace } = useRouter();
  useCollaboration(doc?.id, doc?.content);

  useEffect(() => {
    if (doc?.title) {
      setTimeout(() => {
        document.title = `${doc.title} - Docs`;
      }, 100);
    }
  }, [doc?.title]);

  useEffect(() => {
    if (!docQuery || isFetching) {
      return;
    }

    setDoc(docQuery);
    setCurrentDoc(docQuery);
  }, [docQuery, setCurrentDoc, isFetching]);

  useEffect(() => {
    return () => {
      console.log('unmount');
      setCurrentDoc(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * We add a broadcast task to reset the query cache
   * when the document visibility changes.
   */
  useEffect(() => {
    if (!doc?.id) {
      return;
    }

    addTask(`${KEY_DOC}-${doc.id}`, () => {
      void queryClient.resetQueries({
        queryKey: [KEY_DOC, { id: doc.id }],
      });
    });
  }, [addTask, doc?.id, queryClient]);

  if (isError && error) {
    if (error.status === 403) {
      void replace(`/403`);
      return null;
    }

    if (error.status === 404) {
      void replace(`/404`);
      return null;
    }

    if (error.status === 401) {
      void queryClient.resetQueries({
        queryKey: [KEY_AUTH],
      });
      setAuthUrl();
      void replace(`/401`);
      return null;
    }

    return (
      <Box $margin="large">
        <TextErrors
          causes={error.cause}
          icon={
            error.status === 502 ? (
              <Text $isMaterialIcon $theme="danger">
                wifi_off
              </Text>
            ) : undefined
          }
        />
      </Box>
    );
  }

  if (!doc) {
    return (
      <Box $align="center" $justify="center" $height="100%">
        <Loader />
      </Box>
    );
  }

  return <DocEditor doc={doc} />;
};

const Page: NextPageWithLayout = () => {
  return null;
};

Page.getLayout = function getLayout() {
  return <DocLayout />;
};

export default Page;
