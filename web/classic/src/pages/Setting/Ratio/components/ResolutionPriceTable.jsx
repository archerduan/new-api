import React, { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const numericDraftRegex = /^(\d+(\.\d*)?|\.\d*)?$/;

function ResolutionPriceTable({ value, onChange, disabled = false }) {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    // Parse value into rows
    try {
      const parsed = value ? JSON.parse(value) : null;

      if (!parsed || typeof parsed !== 'object') {
        // Single number format or empty
        setRows([
          {
            id: 1,
            resolution: 'default',
            price: value || '',
          },
        ]);
        return;
      }

      // Object format
      const rowsData = Object.entries(parsed).map(([resolution, price], index) => ({
        id: index + 1,
        resolution,
        price: typeof price === 'number' ? String(price) : '',
      }));

      if (rowsData.length === 0) {
        rowsData.push({ id: 1, resolution: 'default', price: '' });
      }

      setRows(rowsData);
    } catch {
      setRows([{ id: 1, resolution: 'default', price: value || '' }]);
    }
  }, [value]);

  const notifyChange = useCallback(
    (newRows) => {
      // If only one default row, return simple number format
      if (
        newRows.length === 1 &&
        (newRows[0].resolution === 'default' || newRows[0].resolution === '')
      ) {
        onChange(newRows[0].price);
        return;
      }

      // Convert to object format
      const newValue = {};
      newRows.forEach((row) => {
        const res = row.resolution.trim();
        if (res) {
          const priceNum = parseFloat(row.price) || 0;
          newValue[res] = priceNum;
        }
      });

      onChange(JSON.stringify(newValue));
    },
    [onChange]
  );

  const addRow = useCallback(() => {
    const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
    const newRows = [...rows, { id: newId, resolution: '', price: '' }];
    setRows(newRows);
    notifyChange(newRows);
  }, [rows, notifyChange]);

  const updateRow = useCallback(
    (id, field, val) => {
      const newRows = rows.map((row) =>
        row.id === id ? { ...row, [field]: val } : row
      );
      setRows(newRows);
      notifyChange(newRows);
    },
    [rows, notifyChange]
  );

  const deleteRow = useCallback(
    (id) => {
      let newRows = rows.filter((row) => row.id !== id);
      if (newRows.length === 0) {
        newRows = [{ id: 1, resolution: 'default', price: '' }];
      }
      setRows(newRows);
      notifyChange(newRows);
    },
    [rows, notifyChange]
  );

  const columns = [
    {
      title: t('分辨率'),
      dataIndex: 'resolution',
      width: '40%',
      render: (text, record) => (
        <Input
          value={record.resolution}
          placeholder={t('1K, 2K, 4K, 1024x1024, default')}
          disabled={
            disabled ||
            (record.resolution === 'default' && rows.length === 1)
          }
          onChange={(val) => updateRow(record.id, 'resolution', val)}
        />
      ),
    },
    {
      title: t('价格'),
      dataIndex: 'price',
      width: '40%',
      render: (text, record) => (
        <Input
          prefix="$"
          value={record.price}
          placeholder="0.01"
          disabled={disabled}
          onChange={(val) => {
            if (numericDraftRegex.test(val)) {
              updateRow(record.id, 'price', val);
            }
          }}
        />
      ),
    },
    {
      title: t('操作'),
      dataIndex: 'actions',
      width: '20%',
      render: (text, record) => (
        <Button
          type="tertiary"
          icon={<IconDelete />}
          disabled={disabled || rows.length === 1}
          onClick={() => deleteRow(record.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ marginTop: 10 }}>
      <Text strong>{t('分辨率定价')}</Text>
      <Table
        columns={columns}
        dataSource={rows}
        pagination={false}
        style={{ marginTop: 10 }}
        rowKey="id"
      />
      <Button
        icon={<IconPlus />}
        style={{ marginTop: 10 }}
        disabled={disabled}
        onClick={addRow}
      >
        {t('添加分辨率')}
      </Button>
      <div style={{ marginTop: 10 }}>
        <Text type="tertiary" size="small">
          {t(
            '为不同分辨率设置不同价格。如果请求的分辨率未配置，将使用 "default" 价格。支持的格式：1K, 2K, 4K, 1024x1024, high_1024x1024 等。'
          )}
        </Text>
      </div>
    </div>
  );
}

export default ResolutionPriceTable;
