import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Api } from '../../../api';

type OpeningTreeContextType = {
  treeNames: string[];
  loading: boolean;
  error: string | null;
};

const OpeningTreeContext = createContext<OpeningTreeContextType | undefined>(undefined);

export const useOpeningTree = () => {
  const context = useContext(OpeningTreeContext);
  if (context === undefined) {
    throw new Error('useOpeningTree must be used within an OpeningTreeProvider');
  }
  return context;
};

type OpeningTreeProviderProps = {
  children: ReactNode;
};

export const OpeningTreeProvider = ({ children }: OpeningTreeProviderProps) => {
  const [treeNames, setTreeNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const fetchOpeningTrees = async () => {
      if (fetchingRef.current) return;

      try {
        fetchingRef.current = true;
        setLoading(true);
        setError(null);

        const trees = await Api.openingTrees.getOpeningTrees();

        // Extract tree names from the array
        const names = Array.isArray(trees)
          ? trees.map((tree: any) =>
              typeof tree === 'string' ? tree : tree.name || tree.id || String(tree)
            )
          : [];
        console.log('Tree names:', names);

        setTreeNames(names);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('Error fetching opening trees:', err);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchOpeningTrees();
  }, []);

  const value = {
    treeNames,
    loading,
    error,
  };

  return <OpeningTreeContext.Provider value={value}>{children}</OpeningTreeContext.Provider>;
};
