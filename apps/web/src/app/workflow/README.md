# Workflow Editor

A visual workflow editor for creating and managing workflows with drag-and-drop functionality.

## Features

- **Visual Workflow Canvas**: Interactive canvas powered by React Flow
- **Drag-and-Drop**: Drag nodes from the library and drop onto canvas
- **Node Types**:
  - Start (Green) - Workflow starting point
  - End (Red) - Workflow ending point
  - Task (Blue) - Task execution node
  - Condition (Orange) - Conditional branching
  - Parallel (Purple) - Parallel execution
  - Delay (Gray) - Time delay
- **Node Connections**: Connect nodes to define workflow flow
- **Property Panel**: Configure node properties
- **Toolbar**: Save, run, export, and settings controls
- **Zoom Controls**: Zoom in/out of the canvas
- **Minimap**: Overview of the entire workflow

## Usage

1. **Add Nodes**: Drag nodes from the left sidebar and drop onto the canvas
2. **Connect Nodes**: Click and drag from one node's handle to another node's handle
3. **Edit Node**: Click on a node to open the property panel at the bottom
4. **Configure Properties**: Use the property panel to set node names and parameters
5. **Save Workflow**: Click the "Save" button to download the workflow as JSON
6. **Run Workflow**: Click the "Run" button to execute the workflow (coming soon)

## Components

### `/app/workflow/editor/page.tsx`
Main workflow editor page component.

### `/components/workflow/CustomNodes.tsx`
Custom node components for different node types:
- StartNode
- EndNode
- TaskNode
- ConditionNode
- ParallelNode
- DelayNode

### `/components/workflow/Toolbar.tsx`
Top toolbar with action buttons:
- Undo/Redo
- Zoom controls
- Save/Run/Export/Settings

### `/components/workflow/NodeLibrary.tsx`
Left sidebar with draggable node items.

### `/components/workflow/PropertyPanel.tsx`
Bottom panel for editing node properties.

## Dependencies

- `reactflow` - React Flow library for workflow visualization
- `@reactflow/core` - Core React Flow functionality
- `@reactflow/controls` - Zoom/pan controls
- `@reactflow/minimap` - Minimap component

## File Structure

```
apps/web/src/
├── app/workflow/editor/
│   └── page.tsx              # Main editor page
├── components/workflow/
│   ├── CustomNodes.tsx       # Node components
│   ├── Toolbar.tsx           # Toolbar component
│   ├── NodeLibrary.tsx       # Node library sidebar
│   └── PropertyPanel.tsx     # Property panel
└── styles/
    └── workflow.css          # Custom styles
```

## Future Enhancements

- [ ] Implement workflow execution engine
- [ ] Add undo/redo functionality
- [ ] Support workflow templates
- [ ] Add more node types (API, Webhook, etc.)
- [ ] Implement workflow validation
- [ ] Add collaborative editing
- [ ] Export to different formats (YAML, etc.)

## Development

The workflow editor is running on `http://localhost:3004/workflow/editor` in development mode.

## API Integration

Workflows are currently saved as JSON files. Future implementation will include:
- Save to database
- Load from database
- Share workflows with team members
- Version control for workflows
