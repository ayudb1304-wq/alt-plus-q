import { useBoardStore } from '../store/boardStore';
import type { CanvasItem as CanvasItemType } from '../../types/board';
import TextItem from './items/TextItem';
import LinkItem from './items/LinkItem';
import SnippetItem from './items/SnippetItem';

interface Props {
  item: CanvasItemType;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onShiftSelect: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDuplicate: () => void;
}

export default function CanvasItem(props: Props) {
  const { item, onDuplicate } = props;
  const addItem = useBoardStore((s) => s.addItem);

  function handleDuplicate() {
    addItem({
      ...item,
      id: crypto.randomUUID(),
      position: { x: item.position.x + 20, y: item.position.y + 20 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  const duplicateFn = onDuplicate ?? handleDuplicate;

  if (item.type === 'text') {
    return <TextItem {...props} onDuplicate={duplicateFn} />;
  }

  if (item.type === 'snippet') {
    return <SnippetItem {...props} onDuplicate={duplicateFn} />;
  }

  if (item.type === 'link') {
    return (
      <LinkItem
        item={item}
        isSelected={props.isSelected}
        onSelect={props.onSelect}
        onShiftSelect={props.onShiftSelect}
        onDuplicate={duplicateFn}
      />
    );
  }

  return null;
}
