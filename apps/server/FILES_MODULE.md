# File Upload System Documentation

## Overview

This file sharing system provides comprehensive file management capabilities for the AI collaboration platform.

## Features

### ✅ Implemented Features

1. **File Upload**
   - Drag and drop support
   - Click to browse files
   - File size limit: 10MB
   - Multer middleware for handling multipart/form-data

2. **File List**
   - Display all uploaded files
   - Filter by agent or task
   - Show file metadata (size, type, date, version)
   - File type icons

3. **File Download**
   - Download files with original filename
   - Support for all file types
   - Base64 encoded transfer

4. **Version Control**
   - Automatic version numbering
   - Track file versions
   - Version badges in UI

5. **File Deletion**
   - Delete files with confirmation
   - Cascade delete children
   - Remove from disk

6. **File Hierarchy**
   - Parent-child file relationships
   - Track derived files

## API Endpoints

### POST /api/v1/files/upload
Upload a new file.

**Query Parameters:**
- `agentId` (required): ID of the agent uploading the file
- `taskId` (optional): ID of the associated task
- `parentId` (optional): ID of the parent file (for versioning)

**Body:** multipart/form-data with `file` field

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "example.pdf",
    "size": 1024,
    "mimeType": "application/pdf",
    "version": 1,
    "createdAt": "2026-03-14T...",
    "agent": {
      "id": "uuid",
      "name": "Agent Name"
    }
  }
}
```

### GET /api/v1/files
Get list of files.

**Query Parameters:**
- `taskId` (optional): Filter by task ID
- `agentId` (optional): Filter by agent ID
- `parentId` (optional): Filter by parent ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "example.pdf",
      "size": 1024,
      "mimeType": "application/pdf",
      "version": 1,
      "createdAt": "2026-03-14T...",
      "agent": { "id": "...", "name": "..." },
      "task": { "id": "...", "title": "..." },
      "parent": null,
      "childrenCount": 0
    }
  ]
}
```

### GET /api/v1/files/:id/download
Download a file.

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "example.pdf",
    "mimeType": "application/pdf",
    "size": 1024,
    "buffer": "base64-encoded-content"
  }
}
```

### DELETE /api/v1/files/:id
Delete a file.

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

## Database Schema

```sql
CREATE TABLE "files" (
  "id" TEXT PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "task_id" TEXT,
  "agent_id" TEXT NOT NULL,
  "parent_id" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE,
  FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parent_id") REFERENCES "files"("id") ON DELETE CASCADE
);
```

## Frontend Component

### Usage

```tsx
import { FileUpload } from '@/components/FileUpload';

function MyComponent() {
  const handleFileUploaded = (file) => {
    console.log('File uploaded:', file);
  };

  const handleFileDeleted = (fileId) => {
    console.log('File deleted:', fileId);
  };

  return (
    <FileUpload
      agentId="agent-uuid"
      taskId="task-uuid" // optional
      onFileUploaded={handleFileUploaded}
      onFileDeleted={handleFileDeleted}
    />
  );
}
```

### Props

- `agentId` (string, required): ID of the agent
- `taskId` (string, optional): ID of the associated task
- `onFileUploaded` (function, optional): Callback when file is uploaded
- `onFileDeleted` (function, optional): Callback when file is deleted

## File Storage

Files are stored in:
- Development: `apps/server/uploads/`
- The directory is created automatically if it doesn't exist

## Security Considerations

1. **File Size Limit**: 10MB maximum
2. **File Type Validation**: Currently allows all types (can be restricted)
3. **Agent Authorization**: Files are associated with specific agents
4. **Cascade Delete**: Children files are deleted when parent is deleted

## Future Enhancements

1. **Permission Management**
   - Role-based access control
   - File sharing between agents
   - Public/private file visibility

2. **Advanced Features**
   - File preview (images, PDFs, videos)
   - File search and filtering
   - Batch upload/download
   - Cloud storage integration (S3, etc.)

3. **Version Control**
   - Version history viewer
   - Rollback to previous versions
   - Diff viewer for text files

4. **Performance**
   - Chunked upload for large files
   - CDN integration
   - File compression

## Testing

To test the file upload system:

1. Start the server:
```bash
cd apps/server
pnpm dev
```

2. Start the web app:
```bash
cd apps/web
pnpm dev
```

3. Navigate to a page with the FileUpload component
4. Try uploading, downloading, and deleting files

## Troubleshooting

### File upload fails
- Check file size (must be < 10MB)
- Verify agent ID exists
- Check server logs for errors

### Download fails
- Verify file exists on disk
- Check file path in database
- Ensure proper permissions on uploads directory

### Database errors
- Run `npx prisma db push` to sync schema
- Check DATABASE_URL in .env file
