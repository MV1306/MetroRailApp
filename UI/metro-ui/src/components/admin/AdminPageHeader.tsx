import { Typography, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  extra?: ReactNode;
}

export default function AdminPageHeader({ title, subtitle, onAdd, addLabel = 'Add', addDisabled, extra }: Props) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 20, gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Typography.Title level={4} style={{ margin: 0, color: '#1565c0', fontSize: 'clamp(15px, 3vw, 18px)' }}>
          {title}
        </Typography.Title>
        {subtitle && <Typography.Text type="secondary" style={{ fontSize: 13 }}>{subtitle}</Typography.Text>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {extra}
        {onAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}
            disabled={addDisabled} style={{ borderRadius: 8 }}>
            {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
