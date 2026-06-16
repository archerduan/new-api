/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useState } from 'react';
import {
  Button,
  Input,
  Table,
  Banner,
  Space,
  TextArea,
  Radio,
  RadioGroup,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { API, showError, showSuccess } from '../../../helpers';

const OPTION_KEY = 'resolution_price_setting.prices';

const DEFAULT_PRICES = {
  '1K': 0.792,
  '2K': 0.792,
  '4K': 1.418,
};

function parseInitialPrices(rawValue) {
  if (!rawValue) return { ...DEFAULT_PRICES };
  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length > 0
    ) {
      return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_PRICES };
}

function objectToRows(prices) {
  return Object.entries(prices).map(([key, price], index) => ({
    id: index + 1,
    key,
    price: Number(price) || 0,
  }));
}

function rowsToObject(rows) {
  const prices = {};
  for (const row of rows) {
    const k = row.key.trim();
    if (!k) continue;
    prices[k] = Number(row.price) || 0;
  }
  return prices;
}

export default function ResolutionPriceSettings({ options }) {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState('visual');
  const [rows, setRows] = useState([]);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [nextRowId, setNextRowId] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rawValue = options['resolution_price_setting.prices'];
    const prices = parseInitialPrices(rawValue);
    const initialRows = objectToRows(prices);
    setRows(initialRows);
    setJsonText(JSON.stringify(prices, null, 2));
    setJsonError('');
    setNextRowId(initialRows.length + 1);
  }, [options]);

  const syncFromRows = (nextRows) => {
    setRows(nextRows);
    setJsonText(JSON.stringify(rowsToObject(nextRows), null, 2));
    setJsonError('');
  };

  const handleJsonChange = (text) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setJsonError(t('JSON must be an object'));
        return;
      }
      const nextRows = objectToRows(parsed);
      setRows(nextRows);
      setNextRowId(nextRows.length + 1);
      setJsonError('');
    } catch (error) {
      setJsonError(error.message || t('Invalid JSON'));
    }
  };

  const updateRow = (id, field, value) => {
    syncFromRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    const newRow = { id: nextRowId, key: '', price: 0 };
    setNextRowId((prev) => prev + 1);
    syncFromRows([...rows, newRow]);
  };

  const removeRow = (id) => {
    syncFromRows(rows.filter((r) => r.id !== id));
  };

  const resetToDefault = () => {
    const initialRows = objectToRows(DEFAULT_PRICES);
    setRows(initialRows);
    setJsonText(JSON.stringify(DEFAULT_PRICES, null, 2));
    setJsonError('');
    setNextRowId(initialRows.length + 1);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      showSuccess(t('Copied to clipboard'));
    } catch {
      showError(t('Failed to copy'));
    }
  };

  const handleSave = async () => {
    if (editMode === 'json' && jsonError) {
      showError(t('Please fix JSON errors before saving'));
      return;
    }

    setLoading(true);
    try {
      const currentPrices = rowsToObject(rows);
      const res = await API.put('/api/option/', {
        key: OPTION_KEY,
        value: JSON.stringify(currentPrices),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('Resolution prices saved successfully'));
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t('Failed to save resolution prices'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('Resolution'),
      dataIndex: 'key',
      key: 'key',
      render: (text, record) => (
        <Input
          value={text}
          placeholder='1K, 2K, 4K, 1024x1024, etc.'
          onChange={(value) => updateRow(record.id, 'key', value)}
        />
      ),
    },
    {
      title: t('Price ($/call)'),
      dataIndex: 'price',
      key: 'price',
      width: 200,
      render: (text, record) => (
        <Input
          type='number'
          min={0}
          step={0.01}
          value={text}
          onChange={(value) => updateRow(record.id, 'price', Number(value) || 0)}
        />
      ),
    },
    {
      title: t('Actions'),
      key: 'actions',
      width: 100,
      render: (text, record) => (
        <Button
          type='danger'
          icon={<IconDelete />}
          onClick={() => removeRow(record.id)}
        />
      ),
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <Banner
        type='info'
        description={
          <div>
            <div>
              {t(
                'Configure per-call pricing for different resolutions ($/call). Used for image/video generation tasks.'
              )}
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>{t('Format')}:</strong> <code>1K</code>{' '}
              {t('is the default price for 1K resolution; ')}
              <code>1K:model-name*</code>{' '}
              {t('overrides for matching model prefix.')}
            </div>
          </div>
        }
      />

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <RadioGroup
          type='button'
          value={editMode}
          onChange={(e) => setEditMode(e.target.value)}
        >
          <Radio value='visual'>{t('Visual Editor')}</Radio>
          <Radio value='json'>{t('JSON Editor')}</Radio>
        </RadioGroup>
      </div>

      <Space spacing={8} style={{ marginBottom: 16 }}>
        {editMode === 'visual' ? (
          <>
            <Button icon={<IconPlus />} onClick={addRow}>
              {t('Add')}
            </Button>
            <Button onClick={resetToDefault}>{t('Restore defaults')}</Button>
          </>
        ) : (
          <>
            <Button onClick={handleCopyJson}>{t('Copy')}</Button>
            <Button onClick={resetToDefault}>{t('Restore defaults')}</Button>
          </>
        )}
      </Space>

      {editMode === 'visual' ? (
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          empty={t('No resolutions configured')}
        />
      ) : (
        <div>
          <TextArea
            value={jsonText}
            onChange={handleJsonChange}
            rows={12}
            style={{ fontFamily: 'monospace' }}
          />
          {jsonError && (
            <div style={{ color: 'red', marginTop: 8 }}>{jsonError}</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Button
          theme='solid'
          type='primary'
          onClick={handleSave}
          loading={loading}
          disabled={editMode === 'json' && !!jsonError}
        >
          {t('Save resolution prices')}
        </Button>
      </div>
    </div>
  );
}
