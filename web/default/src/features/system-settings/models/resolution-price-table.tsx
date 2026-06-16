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
import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { numericDraftRegex } from './model-pricing-core'

type ResolutionRow = {
  id: number
  resolution: string
  price: string
}

type ResolutionPriceTableProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ResolutionPriceTable({
  value,
  onChange,
  disabled = false,
}: ResolutionPriceTableProps) {
  const { t } = useTranslation()
  const [rows, setRows] = useState<ResolutionRow[]>([])

  useEffect(() => {
    // Parse value into rows
    try {
      const parsed = value ? JSON.parse(value) : null

      if (!parsed || typeof parsed !== 'object') {
        // Single number format or empty
        setRows([
          {
            id: 1,
            resolution: 'default',
            price: value || '',
          },
        ])
        return
      }

      // Object format
      const rowsData = Object.entries(parsed).map(([resolution, price], index) => ({
        id: index + 1,
        resolution,
        price: typeof price === 'number' ? String(price) : '',
      }))

      if (rowsData.length === 0) {
        rowsData.push({ id: 1, resolution: 'default', price: '' })
      }

      setRows(rowsData)
    } catch {
      setRows([{ id: 1, resolution: 'default', price: value || '' }])
    }
  }, [value])

  const notifyChange = useCallback(
    (newRows: ResolutionRow[]) => {
      // If only one default row, return simple number format
      if (
        newRows.length === 1 &&
        (newRows[0].resolution === 'default' || newRows[0].resolution === '')
      ) {
        onChange(newRows[0].price)
        return
      }

      // Convert to object format
      const newValue: Record<string, number> = {}
      newRows.forEach((row) => {
        const res = row.resolution.trim()
        if (res) {
          const priceNum = parseFloat(row.price) || 0
          newValue[res] = priceNum
        }
      })

      onChange(JSON.stringify(newValue))
    },
    [onChange]
  )

  const addRow = useCallback(() => {
    const newId = rows.length > 0 ? Math.max(...rows.map((r) => r.id)) + 1 : 1
    const newRows = [...rows, { id: newId, resolution: '', price: '' }]
    setRows(newRows)
    notifyChange(newRows)
  }, [rows, notifyChange])

  const updateRow = useCallback(
    (id: number, field: 'resolution' | 'price', val: string) => {
      const newRows = rows.map((row) =>
        row.id === id ? { ...row, [field]: val } : row
      )
      setRows(newRows)
      notifyChange(newRows)
    },
    [rows, notifyChange]
  )

  const deleteRow = useCallback(
    (id: number) => {
      let newRows = rows.filter((row) => row.id !== id)
      if (newRows.length === 0) {
        newRows = [{ id: 1, resolution: 'default', price: '' }]
      }
      setRows(newRows)
      notifyChange(newRows)
    },
    [rows, notifyChange]
  )

  return (
    <div className='space-y-3'>
      <div className='text-sm font-medium'>{t('Resolution pricing')}</div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40%]'>{t('Resolution')}</TableHead>
              <TableHead className='w-[40%]'>{t('Price')}</TableHead>
              <TableHead className='w-[20%]'>{t('Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.resolution}
                    placeholder={t('1K, 2K, 4K, 1024x1024, default')}
                    disabled={
                      disabled ||
                      (row.resolution === 'default' && rows.length === 1)
                    }
                    onChange={(e) =>
                      updateRow(row.id, 'resolution', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <InputGroup>
                    <InputGroupAddon>$</InputGroupAddon>
                    <InputGroupInput
                      inputMode='decimal'
                      value={row.price}
                      placeholder='0.01'
                      disabled={disabled}
                      onChange={(e) => {
                        const val = e.target.value
                        if (numericDraftRegex.test(val)) {
                          updateRow(row.id, 'price', val)
                        }
                      }}
                    />
                  </InputGroup>
                </TableCell>
                <TableCell>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    disabled={disabled || rows.length === 1}
                    onClick={() => deleteRow(row.id)}
                  >
                    <Trash2 className='h-4 w-4' />
                    <span className='sr-only'>{t('Delete')}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={disabled}
        onClick={addRow}
      >
        <Plus className='mr-2 h-4 w-4' />
        {t('Add resolution')}
      </Button>
      <p className='text-muted-foreground text-xs'>
        {t(
          'Set different prices for different resolutions. If the requested resolution is not configured, the "default" price will be used. Supported formats: 1K, 2K, 4K, 1024x1024, high_1024x1024, etc.'
        )}
      </p>
    </div>
  )
}
