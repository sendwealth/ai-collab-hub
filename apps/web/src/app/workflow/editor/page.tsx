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
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/styles/workflow.css';

import { Toolbar } from '@/components/workflow/Toolbar';
import { NodeLibrary } from '@/components/workflow/NodeLibrary';
import { PropertyPanel } from '@/components/workflow/PropertyPanel';
import { ExecutionResultPanel } from '@/components/workflow/ExecutionResultPanel';
import { nodeTypes } from '@/components/workflow/CustomNodes';
import { toast } from '@/components/ui/use-toast';

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

// Workflow validation result type
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Execution result type
interface ExecutionResult {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  totalDuration?: number;
  steps: Array<{
    nodeId: string;
    nodeType: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    output?: Record<string, any>;
    error?: string;
    startedAt?: string;
    completedAt?: string;
    duration?: number;
  }>;
  context?: Record<string, any>;
  error?: string;
}

function WorkflowEditorPage() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showResultPanel, setShowResultPanel] = useState(false);

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

  /**
   * Validate workflow definition
   */
  const validateWorkflow = useCallback((): ValidationResult => {
    const errors: string[] = [];

    // Check for start node
    const startNodes = nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
      errors.push('工作流必须包含一个开始节点');
    } else if (startNodes.length > 1) {
      errors.push('工作流只能有一个开始节点');
    }

    // Check for end node
    const endNodes = nodes.filter((n) => n.type === 'end');
    if (endNodes.length === 0) {
      errors.push('工作流必须包含至少一个结束节点');
    }

    // Check node connections
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // Check if all nodes are connected (except isolated nodes)
    nodes.forEach((node) => {
      if (node.type !== 'start' && !connectedNodeIds.has(node.id)) {
        errors.push(`节点 "${node.id}" 未连接到工作流`);
      }
    });

    // Check for cycles (simple check)
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter((e) => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          if (hasCycle(edge.target)) return true;
        } else if (recursionStack.has(edge.target)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    const startNode = nodes.find((n) => n.type === 'start');
    if (startNode && hasCycle(startNode.id)) {
      errors.push('工作流中存在循环依赖');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }, [nodes, edges]);

  /**
   * Convert ReactFlow graph to workflow definition
   */
  const convertToWorkflowDefinition = useCallback(() => {
    const definition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        agentId: node.data?.agentId,
        condition: node.data?.condition,
        delay: node.data?.delay,
        config: node.data?.config || {},
      })),
      edges: edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        condition: edge.data?.condition,
      })),
    };

    return definition;
  }, [nodes, edges]);

  const handleSave = useCallback(() => {
    if (!reactFlowInstance) return;

    const flow = reactFlowInstance.toObject();
    const json = JSON.stringify(flow, null, 2);

    // Save to localStorage
    localStorage.setItem('workflow', json);

    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: '工作流已保存' });
    console.log('Workflow saved:', flow);
  }, [reactFlowInstance]);

  /**
   * Run workflow
   */
  const handleRun = useCallback(async () => {
    if (!reactFlowInstance) return;

    // Validate workflow
    const validation = validateWorkflow();
    if (!validation.valid) {
      validation.errors.forEach((error) => toast({ title: error, variant: 'destructive' }));
      return;
    }

    // Convert to workflow definition
    const definition = convertToWorkflowDefinition();

    setIsExecuting(true);
    setShowResultPanel(true);
    setExecutionResult({
      status: 'running',
      steps: [],
    });

    try {
      const response = await fetch('http://localhost:3000/api/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ definition }),
      });

      const result = await response.json();

      if (result.status === 'completed') {
        toast({ title: '工作流执行成功' });
      } else {
        toast({ title: `工作流执行失败: ${result.error || '未知错误'}`, variant: 'destructive' });
      }

      setExecutionResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '执行出错';
      toast({ title: `执行出错: ${errorMsg}`, variant: 'destructive' });
      setExecutionResult({
        status: 'failed',
        steps: [],
        error: errorMsg,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [reactFlowInstance, validateWorkflow, convertToWorkflowDefinition]);

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

    toast({ title: '工作流已导出' });
  }, [reactFlowInstance]);

  const handleSettings = useCallback(() => {
    toast({ title: '设置功能开发中...' });
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
        isExecuting={isExecuting}
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

        {/* Execution Result Panel */}
        {showResultPanel && (
          <ExecutionResultPanel
            result={executionResult}
            isLoading={isExecuting}
            onClose={() => setShowResultPanel(false)}
          />
        )}
      </div>
    </div>
  );
}

// Wrap with ReactFlowProvider
export default function WorkflowEditorPageWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowEditorPage />
    </ReactFlowProvider>
  );
}
