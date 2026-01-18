/**
 * 电影分镜表视图
 * 使用 TanStack Table 实现可编辑的分镜数据表格
 */

import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  CellContext,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Download,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  Image,
  Video,
} from 'lucide-react';

// ============ 类型定义 ============

interface Shot {
  id: number;
  sceneId: number;
  sceneName: string;
  order: number;
  shotType: string;
  cameraMove: string;
  duration: number;
  composition: string;
  lens: string;
  storyDesc: string;
  visualDesc: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  thumbUrl?: string;
  hasVideo?: boolean;
}

interface StoryboardTableProps {
  shots: Shot[];
  onUpdateShot: (shotId: number, field: keyof Shot, value: unknown) => void;
  onDeleteShots: (shotIds: number[]) => void;
  onDuplicateShot: (shotId: number) => void;
  onSelectShot: (shotId: number) => void;
  className?: string;
}

// ============ 可编辑单元格组件 ============

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
}

function EditableCell({ value, onChange, type = 'text', options }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className="px-2 py-1 cursor-pointer hover:bg-zinc-800 rounded min-h-[24px] truncate"
        onClick={() => setIsEditing(true)}
        title={String(value)}
      >
        {value || <span className="text-zinc-600">-</span>}
      </div>
    );
  }

  if (type === 'select' && options) {
    return (
      <select
        value={String(editValue)}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        autoFocus
        className="w-full px-2 py-1 bg-zinc-800 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="flex flex-col gap-1">
        <textarea
          value={String(editValue)}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          rows={3}
          className="w-full px-2 py-1 bg-zinc-800 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none resize-none"
        />
        <div className="flex gap-1">
          <button onClick={handleSave} className="p-1 bg-green-600 rounded">
            <Check className="w-3 h-3" />
          </button>
          <button onClick={handleCancel} className="p-1 bg-zinc-700 rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <input
      type={type}
      value={editValue}
      onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      autoFocus
      className="w-full px-2 py-1 bg-zinc-800 border border-blue-500 rounded text-sm text-zinc-100 focus:outline-none"
    />
  );
}

// ============ 状态徽章 ============

function StatusBadge({ status }: { status: Shot['status'] }) {
  const styles = {
    pending: 'bg-zinc-700 text-zinc-300',
    generating: 'bg-blue-900 text-blue-300',
    completed: 'bg-green-900 text-green-300',
    failed: 'bg-red-900 text-red-300',
  };

  const labels = {
    pending: '待处理',
    generating: '生成中',
    completed: '已完成',
    failed: '失败',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ============ 分镜表主组件 ============

export function StoryboardTable({
  shots,
  onUpdateShot,
  onDeleteShots,
  onDuplicateShot,
  onSelectShot,
  className = '',
}: StoryboardTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // 镜头类型选项
  const shotTypeOptions = [
    { value: 'WS', label: '全景 (WS)' },
    { value: 'LS', label: '远景 (LS)' },
    { value: 'MS', label: '中景 (MS)' },
    { value: 'MCU', label: '中近景 (MCU)' },
    { value: 'CU', label: '近景 (CU)' },
    { value: 'ECU', label: '特写 (ECU)' },
    { value: 'POV', label: '主观镜头 (POV)' },
    { value: 'OTS', label: '过肩镜头 (OTS)' },
  ];

  // 运镜选项
  const cameraMoveOptions = [
    { value: 'static', label: '静止' },
    { value: 'pan', label: '摇镜' },
    { value: 'tilt', label: '俯仰' },
    { value: 'dolly', label: '推拉' },
    { value: 'track', label: '跟踪' },
    { value: 'crane', label: '升降' },
    { value: 'zoom', label: '变焦' },
    { value: 'handheld', label: '手持' },
  ];

  // ============ 列定义 ============

  const columns = useMemo<ColumnDef<Shot>[]>(
    () => [
      // 选择列
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-zinc-600"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-zinc-600"
          />
        ),
        size: 40,
      },
      // 缩略图
      {
        id: 'thumbnail',
        header: '预览',
        cell: ({ row }) => (
          <div className="w-16 h-10 bg-zinc-800 rounded overflow-hidden flex items-center justify-center">
            {row.original.thumbUrl ? (
              <img
                src={row.original.thumbUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : row.original.hasVideo ? (
              <Video className="w-4 h-4 text-zinc-500" />
            ) : (
              <Image className="w-4 h-4 text-zinc-500" />
            )}
          </div>
        ),
        size: 80,
      },
      // 场景
      {
        accessorKey: 'sceneName',
        header: '场景',
        cell: ({ getValue }) => (
          <span className="text-zinc-400">{getValue<string>()}</span>
        ),
        size: 100,
      },
      // 序号
      {
        accessorKey: 'order',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1"
            onClick={() => column.toggleSorting()}
          >
            序号
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        size: 60,
      },
      // 镜头类型
      {
        accessorKey: 'shotType',
        header: '景别',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'shotType', v)}
            type="select"
            options={shotTypeOptions}
          />
        ),
        size: 100,
      },
      // 运镜
      {
        accessorKey: 'cameraMove',
        header: '运镜',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'cameraMove', v)}
            type="select"
            options={cameraMoveOptions}
          />
        ),
        size: 100,
      },
      // 时长
      {
        accessorKey: 'duration',
        header: '时长(s)',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<number>()}
            onChange={(v) => onUpdateShot(row.original.id, 'duration', v)}
            type="number"
          />
        ),
        size: 70,
      },
      // 构图
      {
        accessorKey: 'composition',
        header: '构图',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'composition', v)}
          />
        ),
        size: 100,
      },
      // 镜头
      {
        accessorKey: 'lens',
        header: '镜头',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'lens', v)}
          />
        ),
        size: 80,
      },
      // 剧情描述
      {
        accessorKey: 'storyDesc',
        header: '剧情描述',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'storyDesc', v)}
            type="textarea"
          />
        ),
        size: 200,
      },
      // 画面描述
      {
        accessorKey: 'visualDesc',
        header: '画面描述',
        cell: ({ getValue, row }) => (
          <EditableCell
            value={getValue<string>()}
            onChange={(v) => onUpdateShot(row.original.id, 'visualDesc', v)}
            type="textarea"
          />
        ),
        size: 200,
      },
      // 状态
      {
        accessorKey: 'status',
        header: '状态',
        cell: ({ getValue }) => <StatusBadge status={getValue<Shot['status']>()} />,
        size: 80,
      },
      // 操作
      {
        id: 'actions',
        header: '操作',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectShot(row.original.id)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
              title="编辑"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDuplicateShot(row.original.id)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
              title="复制"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteShots([row.original.id])}
              className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        size: 100,
      },
    ],
    [onUpdateShot, onSelectShot, onDuplicateShot, onDeleteShots]
  );

  // ============ 表格实例 ============

  const table = useReactTable({
    data: shots,
    columns,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedRowIds = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map((key) => shots[parseInt(key)]?.id)
    .filter(Boolean);

  // ============ 批量操作 ============

  const handleBatchDelete = useCallback(() => {
    if (selectedRowIds.length > 0 && confirm(`确定删除 ${selectedRowIds.length} 个镜头吗？`)) {
      onDeleteShots(selectedRowIds);
      setRowSelection({});
    }
  }, [selectedRowIds, onDeleteShots]);

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="搜索..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 筛选 */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700 rounded">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* 批量操作 */}
          {selectedRowIds.length > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-zinc-400">
                已选 {selectedRowIds.length} 项
              </span>
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1 px-2 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
            </div>
          )}

          {/* 导出 */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700 rounded">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-zinc-900 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-800"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-zinc-800 hover:bg-zinc-900/50 ${
                  row.getIsSelected() ? 'bg-blue-900/20' : ''
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 text-sm text-zinc-200"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* 空状态 */}
        {shots.length === 0 && (
          <div className="flex items-center justify-center h-64 text-zinc-500">
            暂无分镜数据
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="flex items-center justify-between p-3 border-t border-zinc-800 text-sm text-zinc-500">
        <span>共 {shots.length} 个镜头</span>
        <span>
          总时长: {shots.reduce((sum, shot) => sum + (shot.duration || 0), 0)} 秒
        </span>
      </div>
    </div>
  );
}

export default StoryboardTable;
