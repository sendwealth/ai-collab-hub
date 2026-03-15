'use client';

import { useCallback, useState, useRef, DragEvent } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/styles/workflow.css';

import { Toolbar } from '@/components/workflow/Toolbar';
import { NodeLibrary } from '@/components/workflow/NodeLibrary';
import { PropertyPanel } from '@/components/workflow/PropertyPanel';
import { nodeTypes } from '@/components/workflow/CustomNodes';

let nodeId = 0;
const getNodeId = () => `node_${nodeId++}`;

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { label: '开始' },
  },
];

const initialEdges: Edge[] = [];

export default function WorkflowEditorPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (!reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: getNodeId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      })
    );
    setSelectedNode(null);
  }, [setNodes]);

  const handleSave = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const flow = reactFlowInstance.toObject();
    const json = JSON.stringify(flow, null, 2);
    
    // Save to localStorage or API
    localStorage.setItem('workflow', json);
    
    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('Workflow saved:', flow);
  }, [reactFlowInstance]);

  const handleRun = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const flow = reactFlowInstance.toObject();
    console.log('Running workflow:', flow);
    
    // TODO: Implement workflow execution logic
    alert('工作流运行功能开发中...');
  }, [reactFlowInstance]);

  const handleExport = useCallback(() => {
    if (!reactFlowInstance) return;
    
    const flow = reactFlowInstance.toObject();
    const json = JSON.stringify(flow, null, 2);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [reactFlowInstance]);

  const handleSettings = useCallback(() => {
    alert('设置功能开发中...');
  }, []);

  const handleUndo = useCallback(() => {
    // TODO: Implement undo functionality
    console.log('Undo');
  }, []);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo functionality
    console.log('Redo');
  }, []);

  const handleZoomIn = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  }, [reactFlowInstance]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Toolbar
        onSave={handleSave}
        onRun={handleRun}
        onExport={handleExport}
        onSettings={handleSettings}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      <div className="flex-1 flex overflow-hidden">
        <NodeLibrary />

        <div className="flex-1 flex flex-col">
          <div className="flex-1" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Controls />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'start') return '#10B981';
                  if (n.type === 'end') return '#EF4444';
                  if (n.type === 'task') return '#3B82F6';
                  if (n.type === 'condition') return '#F59E0B';
                  if (n.type === 'parallel') return '#8B5CF6';
                  if (n.type === 'delay') return '#6B7280';
                  return '#9CA3AF';
                }}
                nodeColor={(n) => {
                  if (n.type === 'start') return '#10B981';
                  if (n.type === 'end') return '#EF4444';
                  if (n.type === 'task') return '#3B82F6';
                  if (n.type === 'condition') return '#F59E0B';
                  if (n.type === 'parallel') return '#8B5CF6';
                  if (n.type === 'delay') return '#6B7280';
                  return '#9CA3AF';
                }}
              />
              <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
            </ReactFlow>
          </div>

          <PropertyPanel
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      </div>
    </div>
  );
}
