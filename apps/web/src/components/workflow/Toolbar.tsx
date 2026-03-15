'use client';

import { Button } from '@/components/ui/button';
import { 
  Save, 
  Play, 
  Download, 
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface ToolbarProps {
  onSave?: () => void;
  onRun?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function Toolbar({
  onSave,
  onRun,
  onExport,
  onSettings,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
}: ToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-gray-900 mr-4">工作流编辑器</h1>
        
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            className="h-8 w-8 p-0"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            className="h-8 w-8 p-0"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-gray-300" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSettings}
          className="h-8"
        >
          <Settings className="w-4 h-4 mr-2" />
          设置
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="h-8"
        >
          <Download className="w-4 h-4 mr-2" />
          导出
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="h-8"
        >
          <Save className="w-4 h-4 mr-2" />
          保存
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onRun}
          className="h-8 bg-green-600 hover:bg-green-700"
        >
          <Play className="w-4 h-4 mr-2" />
          运行
        </Button>
      </div>
    </div>
  );
}
