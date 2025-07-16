import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Api } from '../../../api';
import type { OpeningTree } from '../../../api/types';

type OpeningTreeContextType = {
  trees: OpeningTree[];
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
  const [trees, setTrees] = useState<OpeningTree[]>([]);
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

        const treesResponse = await Api.openingTrees.getOpeningTrees();

        // Handle both array of trees and array of strings
        const treesArray = Array.isArray(treesResponse) ? treesResponse : [];
        const processedTrees: OpeningTree[] = treesArray.map((tree: any) => {
          if (typeof tree === 'string') {
            return { name: tree, path: tree };
          }
          return {
            name: tree.name || tree.id || String(tree),
            path: tree.path || tree.name || tree.id || String(tree),
          };
        });

        const names = processedTrees.map((tree) => tree.name);
        console.log('Trees:', processedTrees);
        console.log('Tree names:', names);

        setTrees(processedTrees);
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
    trees,
    treeNames,
    loading,
    error,
  };

  return <OpeningTreeContext.Provider value={value}>{children}</OpeningTreeContext.Provider>;
};
