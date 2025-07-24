import { ChevronUpIcon, ChevronDownIcon } from "@/app/components/Icon";

export default function ListViewToggleButton({
  showList,
  onClick,
  className = "",
}: {
  showList: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={showList ? "Collapse session list" : "Expand session list"}
    >
      {showList ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </button>
  );
}
