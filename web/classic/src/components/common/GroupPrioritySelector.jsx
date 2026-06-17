/*
Copyright (C) 2025 QuantumNous

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

import React, { useState } from 'react';
import { Typography, Tag, Button, Space, Banner } from '@douyinfe/semi-ui';
import { IconHandle, IconClose, IconChevronUp, IconChevronDown } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

/**
 * GroupPrioritySelector - 分组优先级选择器
 * 支持通过拖拽调整分组优先级顺序
 *
 * @param {Object} props
 * @param {Array} props.value - 已选分组数组，按优先级排序
 * @param {Function} props.onChange - 值变化回调
 * @param {Array} props.allGroups - 所有可选分组列表 [{value, label, ratio}]
 * @param {boolean} props.disabled - 是否禁用
 */
const GroupPrioritySelector = ({ value = [], onChange, allGroups = [], disabled = false }) => {
  const { t } = useTranslation();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // 获取分组的显示信息
  const getGroupInfo = (groupValue) => {
    const group = allGroups.find(g => g.value === groupValue);
    return group || { value: groupValue, label: groupValue };
  };

  // 处理拖拽开始
  const handleDragStart = (e, index) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  // 处理拖拽经过
  const handleDragOver = (e, index) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // 处理拖拽离开
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 处理放置
  const handleDrop = (e, dropIndex) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newValue = [...value];
    const [draggedItem] = newValue.splice(draggedIndex, 1);
    newValue.splice(dropIndex, 0, draggedItem);

    onChange && onChange(newValue);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 移除分组
  const handleRemove = (index) => {
    if (disabled) return;
    const newValue = value.filter((_, i) => i !== index);
    onChange && onChange(newValue);
  };

  // 向上移动
  const handleMoveUp = (index) => {
    if (disabled || index === 0) return;
    const newValue = [...value];
    [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
    onChange && onChange(newValue);
  };

  // 向下移动
  const handleMoveDown = (index) => {
    if (disabled || index === value.length - 1) return;
    const newValue = [...value];
    [newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
    onChange && onChange(newValue);
  };

  if (!value || value.length === 0) {
    return null;
  }

  return (
    <div className='space-y-3'>
      {/* 提示信息 */}
      <Banner
        type='info'
        description={t('选择顺序决定分组优先级：首能够由定选择通道，未选择通道时自动选择下一分组。排在前面的优先级更高。')}
        closeIcon={null}
      />

      {/* 已选择的分组计数 */}
      <div className='flex items-center justify-between'>
        <Text strong>{t('分组优先级顺序')}</Text>
        <Text type='tertiary' size='small'>
          {t('已选择 {{count}} 个分组', { count: value.length })}
        </Text>
      </div>

      {/* 分组列表 */}
      <div className='space-y-2'>
        {value.map((groupValue, index) => {
          const groupInfo = getGroupInfo(groupValue);
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <div
              key={`${groupValue}-${index}`}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-2 p-3 rounded-lg border transition-all
                ${isDragging ? 'opacity-50 border-blue-400' : ''}
                ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                ${disabled ? 'cursor-not-allowed' : 'cursor-move hover:border-blue-300 hover:shadow-sm'}
              `}
              style={{
                transition: 'all 0.2s ease',
              }}
            >
              {/* 拖拽手柄 */}
              {!disabled && (
                <IconHandle
                  className='text-gray-400 flex-shrink-0'
                  style={{ cursor: 'grab' }}
                />
              )}

              {/* 优先级标签 */}
              <Tag
                color='blue'
                size='large'
                shape='circle'
                className='flex-shrink-0'
              >
                {t('优先级')} {index + 1}
              </Tag>

              {/* 分组信息 */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2'>
                  <Text strong className='truncate'>{groupInfo.label || groupInfo.value}</Text>
                  {groupInfo.ratio && (
                    <Tag size='small' color='cyan'>
                      {t('倍率')}: {groupInfo.ratio}
                    </Tag>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              {!disabled && (
                <Space>
                  <Button
                    size='small'
                    type='tertiary'
                    icon={<IconChevronUp />}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  />
                  <Button
                    size='small'
                    type='tertiary'
                    icon={<IconChevronDown />}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === value.length - 1}
                  />
                  <Button
                    size='small'
                    type='danger'
                    theme='borderless'
                    icon={<IconClose />}
                    onClick={() => handleRemove(index)}
                  />
                </Space>
              )}
            </div>
          );
        })}
      </div>

      {/* 提示文本 */}
      <Text type='tertiary' size='small'>
        {t('拖拽调整顺序')} {t('或使用箭头按钮调整优先级')}
      </Text>
    </div>
  );
};

export default GroupPrioritySelector;
