import { useOpeningTree } from '../providers/OpeningTreeProvider';

type TreeSelectorProps = {
  selectedTree: string;
  onTreeChange: (tree: string) => void;
};

export const TreeSelector = ({ selectedTree, onTreeChange }: TreeSelectorProps) => {
  const { treeNames, loading, error } = useOpeningTree();

  if (loading) {
    return <div className="p-2 text-sm text-gray-500">Loading trees...</div>;
  }

  if (error) {
    return <div className="p-2 text-sm text-red-600">Error loading trees: {error}</div>;
  }

  return (
    <div className="p-2 border-b border-gray-300">
      <label htmlFor="tree-selector" className="text-sm font-bold mr-2">
        Opening Tree:
      </label>
      <select
        id="tree-selector"
        value={selectedTree}
        onChange={(e) => onTreeChange(e.target.value)}
        className="text-sm px-2 py-1 border border-gray-300 rounded bg-white text-gray-800"
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
