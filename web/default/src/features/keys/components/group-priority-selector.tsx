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
import { useState } from 'react'
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ApiKeyGroupOption } from './api-key-group-combobox'

type GroupPrioritySelectorProps = {
  value: string[]
  onChange: (value: string[]) => void
  allGroups: ApiKeyGroupOption[]
  disabled?: boolean
}

export function GroupPrioritySelector({
  value = [],
  onChange,
  allGroups = [],
  disabled = false,
}: GroupPrioritySelectorProps) {
  const { t } = useTranslation()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Get group info by value
  const getGroupInfo = (groupValue: string) => {
    return allGroups.find((g) => g.value === groupValue) || {
      value: groupValue,
      label: groupValue,
      desc: groupValue,
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newValue = [...value]
    const [draggedItem] = newValue.splice(draggedIndex, 1)
    newValue.splice(dropIndex, 0, draggedItem)

    onChange(newValue)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Remove group
  const handleRemove = (index: number) => {
    if (disabled) return
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  // Move up
  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return
    const newValue = [...value]
    ;[newValue[index - 1], newValue[index]] = [
      newValue[index],
      newValue[index - 1],
    ]
    onChange(newValue)
  }

  // Move down
  const handleMoveDown = (index: number) => {
    if (disabled || index === value.length - 1) return
    const newValue = [...value]
    ;[newValue[index], newValue[index + 1]] = [
      newValue[index + 1],
      newValue[index],
    ]
    onChange(newValue)
  }

  if (!value || value.length === 0) {
    return null
  }

  return (
    <div className='space-y-3'>
      {/* Info banner */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription className='text-xs'>
          {t(
            '选择顺序决定分组优先级：首能够由定选择通道，未选择通道时自动选择下一分组。排在前面的优先级更高。'
          )}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium'>
          {t('分组优先级顺序')}
        </span>
        <span className='text-muted-foreground text-xs'>
          {t('已选择 {{count}} 个分组', { count: value.length })}
        </span>
      </div>

      {/* Group list */}
      <div className='space-y-2'>
        {value.map((groupValue, index) => {
          const groupInfo = getGroupInfo(groupValue)
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index

          return (
            <div
              key={`${groupValue}-${index}`}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'bg-muted/40 flex items-center gap-3 rounded-lg border p-3 transition-all',
                isDragging && 'opacity-50 border-primary',
                isDragOver && 'border-primary bg-primary/5',
                !disabled &&
                  'cursor-move hover:border-primary/50 hover:shadow-sm',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {/* Drag handle */}
              {!disabled && (
                <GripVertical className='text-muted-foreground h-5 w-5 flex-shrink-0' />
              )}

              {/* Priority badge */}
              <Badge variant='secondary' className='flex-shrink-0'>
                {t('优先级')} {index + 1}
              </Badge>

              {/* Group info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate font-medium'>
                    {groupInfo.label || groupInfo.value}
                  </span>
                  {groupInfo.ratio !== undefined && (
                    <Badge variant='outline' className='text-xs'>
                      {t('倍率')}: {groupInfo.ratio}
                    </Badge>
                  )}
                </div>
                {groupInfo.desc && groupInfo.desc !== groupInfo.label && (
                  <div className='text-muted-foreground truncate text-xs'>
                    {groupInfo.desc}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {!disabled && (
                <div className='flex flex-shrink-0 items-center gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className='h-8 w-8'
                  >
                    <ChevronUp className='h-4 w-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => handleMoveDown(index)}
                    disabled={index === value.length - 1}
                    className='h-8 w-8'
                  >
                    <ChevronDown className='h-4 w-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    onClick={() => handleRemove(index)}
                    className='text-destructive hover:bg-destructive/10 h-8 w-8'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Hint text */}
      <p className='text-muted-foreground text-xs'>
        {t('拖拽调整顺序')} {t('或使用箭头按钮调整优先级')}
      </p>
    </div>
  )
}
