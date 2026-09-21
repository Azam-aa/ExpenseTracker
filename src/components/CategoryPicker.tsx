import { TxType } from '../models/types';
import { useAppStore } from '../store/useAppStore';
import {
  MdRestaurant,
  MdDirectionsBus,
  MdShoppingCart,
  MdReceiptLong,
  MdMovie,
  MdLocalHospital,
  MdSchool,
  MdHome,
  MdMoreHoriz,
  MdAttachMoney,
  MdWork,
  MdReplay,
  MdCardGiftcard,
  MdCategory,
  MdClose
} from 'react-icons/md';

interface CategoryPickerProps {
  type: TxType;
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onClose: () => void;
}

export const getCategoryIcon = (iconName: string, size = 22) => {
  switch (iconName) {
    case 'MdRestaurant': return <MdRestaurant size={size} />;
    case 'MdDirectionsBus': return <MdDirectionsBus size={size} />;
    case 'MdShoppingCart': return <MdShoppingCart size={size} />;
    case 'MdReceiptLong': return <MdReceiptLong size={size} />;
    case 'MdMovie': return <MdMovie size={size} />;
    case 'MdLocalHospital': return <MdLocalHospital size={size} />;
    case 'MdSchool': return <MdSchool size={size} />;
    case 'MdHome': return <MdHome size={size} />;
    case 'MdAttachMoney': return <MdAttachMoney size={size} />;
    case 'MdWork': return <MdWork size={size} />;
    case 'MdReplay': return <MdReplay size={size} />;
    case 'MdCardGiftcard': return <MdCardGiftcard size={size} />;
    default: return <MdMoreHoriz size={size} />;
  }
};

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  type,
  selectedCategoryId,
  onSelect,
  onClose
}) => {
  const { categories } = useAppStore();

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'BOTH'
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 'var(--app-max-width)',
          backgroundColor: 'var(--color-sheet)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          padding: '16px 16px calc(var(--safe-bottom) + 20px) 16px',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text)' }}>
            Select Category
          </span>
          <button onClick={onClose} style={{ color: 'var(--color-text-dim)', fontSize: '24px' }}>
            <MdClose />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            overflowY: 'auto',
            paddingBottom: '8px'
          }}
        >
          {/* Uncategorized Option */}
          <div
            onClick={() => onSelect(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '8px 4px',
              borderRadius: '10px',
              backgroundColor:
                selectedCategoryId === null ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text)',
                marginBottom: '6px'
              }}
            >
              <MdCategory size={22} />
            </div>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--color-text)',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}
            >
              None
            </span>
          </div>

          {filteredCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => onSelect(cat.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.12)' : 'transparent'
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: cat.color || 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    marginBottom: '6px'
                  }}
                >
                  {getCategoryIcon(cat.icon, 22)}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-text)',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                >
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
