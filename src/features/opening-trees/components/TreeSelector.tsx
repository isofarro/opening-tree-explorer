import { useOpeningTree } from '~/features/opening-trees/providers/OpeningTreeProvider';

type TreeSelectorProps = {
  selectedTree: string;
  onTreeChange: (tree: string) => void;
};

export const TreeSelector = ({ selectedTree, onTreeChange }: TreeSelectorProps) => {
  const { treeNames, loading, error } = useOpeningTree();

  if (loading) {
    return (
      <div className="p-2 text-sm text-[var(--color-on-surface-subtle)]">Loading trees...</div>
    );
  }

  if (error) {
    return <div className="p-2 text-sm text-red-600">Error loading trees: {error}</div>;
  }

  return (
    <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
      <label
        htmlFor="tree-selector"
        className="text-sm font-bold mr-2 text-[var(--color-on-surface)]"
      >
        Opening Tree:
      </label>
      <select
        id="tree-selector"
        value={selectedTree}
        onChange={(e) => onTreeChange(e.target.value)}
        className="text-sm px-2 py-1 border border-[var(--color-border)] rounded bg-[var(--color-surface)] text-[var(--color-on-surface)]"
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
