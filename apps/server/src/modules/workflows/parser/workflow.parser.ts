import { Injectable, BadRequestException } from '@nestjs/common';
import { WorkflowDefinitionDto, WorkflowNodeDto, WorkflowEdgeDto } from '../dto/workflow.dto';

export interface ParsedWorkflow {
  nodes: Map<string, WorkflowNodeDto>;
  edges: Map<string, WorkflowEdgeDto[]>;
  startNode: string;
  endNodes: string[];
  adjacencyList: Map<string, string[]>;
}

@Injectable()
export class WorkflowParser {
  /**
   * Parse and validate workflow definition
   */
  parse(definition: WorkflowDefinitionDto): ParsedWorkflow {
    // Validate nodes
    const nodes = this.parseNodes(definition.nodes);

    // Validate edges
    const edges = this.parseEdges(definition.edges, nodes);

    // Build adjacency list
    const adjacencyList = this.buildAdjacencyList(definition.edges);

    // Find start and end nodes
    const { startNode, endNodes } = this.findTerminalNodes(nodes);

    // Validate workflow structure
    this.validateWorkflow(nodes, edges, startNode, endNodes);

    return {
      nodes,
      edges,
      startNode,
      endNodes,
      adjacencyList,
    };
  }

  /**
   * Parse and validate nodes
   */
  private parseNodes(nodes: WorkflowNodeDto[]): Map<string, WorkflowNodeDto> {
    const nodeMap = new Map<string, WorkflowNodeDto>();

    for (const node of nodes) {
      // Check for duplicate IDs
      if (nodeMap.has(node.id)) {
        throw new BadRequestException(`Duplicate node ID: ${node.id}`);
      }

      // Validate node type specific requirements
      this.validateNode(node);

      nodeMap.set(node.id, node);
    }

    return nodeMap;
  }

  /**
   * Parse and validate edges
   */
  private parseEdges(edges: WorkflowEdgeDto[], nodes: Map<string, WorkflowNodeDto>): Map<string, WorkflowEdgeDto[]> {
    const edgeMap = new Map<string, WorkflowEdgeDto[]>();

    for (const edge of edges) {
      // Check source node exists
      if (!nodes.has(edge.from)) {
        throw new BadRequestException(`Edge source node not found: ${edge.from}`);
      }

      // Check target node exists
      if (!nodes.has(edge.to)) {
        throw new BadRequestException(`Edge target node not found: ${edge.to}`);
      }

      // Add to edge map
      if (!edgeMap.has(edge.from)) {
        edgeMap.set(edge.from, []);
      }
      edgeMap.get(edge.from)!.push(edge);
    }

    return edgeMap;
  }

  /**
   * Build adjacency list for graph traversal
   */
  private buildAdjacencyList(edges: WorkflowEdgeDto[]): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    for (const edge of edges) {
      if (!adjList.has(edge.from)) {
        adjList.set(edge.from, []);
      }
      adjList.get(edge.from)!.push(edge.to);
    }

    return adjList;
  }

  /**
   * Find start and end nodes
   */
  private findTerminalNodes(nodes: Map<string, WorkflowNodeDto>): { startNode: string; endNodes: string[] } {
    let startNode: string | null = null;
    const endNodes: string[] = [];

    for (const [id, node] of nodes) {
      if (node.type === 'start') {
        if (startNode !== null) {
          throw new BadRequestException('Workflow can only have one start node');
        }
        startNode = id;
      } else if (node.type === 'end') {
        endNodes.push(id);
      }
    }

    if (startNode === null) {
      throw new BadRequestException('Workflow must have a start node');
    }

    if (endNodes.length === 0) {
      throw new BadRequestException('Workflow must have at least one end node');
    }

    return { startNode, endNodes };
  }

  /**
   * Validate individual node
   */
  private validateNode(node: WorkflowNodeDto): void {
    switch (node.type) {
      case 'task':
        if (!node.agentId && !node.config?.agentId) {
          throw new BadRequestException(`Task node ${node.id} must have an agentId`);
        }
        break;

      case 'condition':
        if (!node.condition) {
          throw new BadRequestException(`Condition node ${node.id} must have a condition expression`);
        }
        break;

      case 'delay':
        if (!node.delay || node.delay <= 0) {
          throw new BadRequestException(`Delay node ${node.id} must have a positive delay value`);
        }
        break;

      case 'loop':
        if (!node.config?.maxIterations) {
          throw new BadRequestException(`Loop node ${node.id} must have maxIterations in config`);
        }
        break;
    }
  }

  /**
   * Validate overall workflow structure
   */
  private validateWorkflow(
    nodes: Map<string, WorkflowNodeDto>,
    edges: Map<string, WorkflowEdgeDto[]>,
    startNode: string,
    endNodes: string[]
  ): void {
    // Check all nodes are reachable from start
    const reachable = this.getReachableNodes(startNode, edges);
    for (const [nodeId] of nodes) {
      if (!reachable.has(nodeId)) {
        throw new BadRequestException(`Node ${nodeId} is not reachable from start`);
      }
    }

    // Check all end nodes are reachable
    for (const endNode of endNodes) {
      if (!reachable.has(endNode)) {
        throw new BadRequestException(`End node ${endNode} is not reachable from start`);
      }
    }

    // Check for cycles (except loops)
    this.checkForCycles(nodes, edges, startNode);
  }

  /**
   * Get all nodes reachable from a start node
   */
  private getReachableNodes(startNode: string, edges: Map<string, WorkflowEdgeDto[]>): Set<string> {
    const reachable = new Set<string>();
    const queue = [startNode];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;

      reachable.add(current);

      const outgoingEdges = edges.get(current) || [];
      for (const edge of outgoingEdges) {
        if (!reachable.has(edge.to)) {
          queue.push(edge.to);
        }
      }
    }

    return reachable;
  }

  /**
   * Check for invalid cycles in workflow
   */
  private checkForCycles(
    nodes: Map<string, WorkflowNodeDto>,
    edges: Map<string, WorkflowEdgeDto[]>,
    startNode: string
  ): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = edges.get(nodeId) || [];
      for (const edge of neighbors) {
        const targetNode = nodes.get(edge.to);

        // Allow cycles in loop nodes
        if (targetNode?.type === 'loop') {
          continue;
        }

        if (!visited.has(edge.to)) {
          if (hasCycle(edge.to)) return true;
        } else if (recursionStack.has(edge.to)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    if (hasCycle(startNode)) {
      throw new BadRequestException('Workflow contains an invalid cycle (only loop nodes can have cycles)');
    }
  }

  /**
   * Get next nodes from current node
   */
  getNextNodes(
    nodeId: string,
    edges: Map<string, WorkflowEdgeDto[]>,
    context: Record<string, any>
  ): WorkflowEdgeDto[] {
    const outgoingEdges = edges.get(nodeId) || [];

    return outgoingEdges.filter(edge => {
      // If edge has a condition, evaluate it
      if (edge.condition !== undefined) {
        return this.evaluateCondition(edge.condition, context);
      }

      return true;
    });
  }

  /**
   * Evaluate condition expression
   */
  private evaluateCondition(condition: boolean | string, context: Record<string, any>): boolean {
    if (typeof condition === 'boolean') {
      return condition;
    }

    // Simple expression evaluation (can be enhanced with a proper expression engine)
    try {
      // Replace context variables
      let expr = condition;
      for (const [key, value] of Object.entries(context)) {
        expr = expr.replace(new RegExp(`\\$${key}`, 'g'), JSON.stringify(value));
      }

      // Safely evaluate (basic implementation)
      // In production, use a proper expression evaluator like expr-eval
      return eval(expr);
    } catch (error) {
      throw new BadRequestException(`Failed to evaluate condition: ${condition}`);
    }
  }
}
