import React from 'react';
import { useOpeningTree } from '../providers/OpeningTreeProvider';

type TreeSelectorProps = {
  selectedTree: string;
  onTreeChange: (tree: string) => void;
};

export const TreeSelector = ({ selectedTree, onTreeChange }: TreeSelectorProps) => {
  const { treeNames, loading, error } = useOpeningTree();

  if (loading) {
    return <div style={{ padding: '8px', fontSize: '14px', color: '#666' }}>Loading trees...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '8px', fontSize: '14px', color: '#d32f2f' }}>
        Error loading trees: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
      <label
        htmlFor="tree-selector"
        style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}
      >
        Opening Tree:
      </label>
      <select
        id="tree-selector"
        value={selectedTree}
        onChange={(e) => onTreeChange(e.target.value)}
        style={{
          padding: '4px 8px',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          minWidth: '200px',
          color: '#333',
        }}
      >
        {treeNames.map((treeName) => (
          <option key={treeName} value={treeName}>
            {treeName}
          </option>
        ))}
      </select>
    </div>
  );
};
