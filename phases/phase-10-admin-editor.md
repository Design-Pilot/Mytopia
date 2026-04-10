# Phase 10: Admin Editor

## Goal

Build a password-protected admin page where the owner can upload sprite assets, place entities on the grid, move them via drag-and-drop, and delete them.

## Prerequisites

- Phase 5 complete (interactions — hover, click, select work)
- Note: The editor benefits from all rendering phases (4-9) being done, but technically only needs Phase 5 to start. Visual features (shadows, weather, etc.) will automatically appear in the editor because they're part of the shared rendering components.

## Tech Involved

- Next.js 15 (API routes for auth, /admin page)
- React (state management for editor modes)
- PixiJS 8 + @pixi/react (canvas with editing capabilities)
- Convex (mutations for entity CRUD, file storage for uploads)
- Tailwind CSS (editor panels, forms)

## Detailed Tasks

### 1. Set up admin authentication

**Simple password approach (matching v1):**

**`src/app/api/admin/login/route.ts`:**
- POST endpoint accepting `{ password }`
- Compare against `ADMIN_PASSWORD` env var (timing-safe comparison)
- On success: set httpOnly session cookie (HMAC-SHA256 signed)
- Return 401 on failure

**`src/app/api/admin/session/route.ts`:**
- GET endpoint: validate session cookie, return `{ authenticated: true/false }`

**`src/app/api/admin/logout/route.ts`:**
- POST endpoint: clear session cookie

**`src/lib/adminSession.ts`:**
- `createAdminSession()` — sign and set cookie
- `hasAdminSession()` — verify cookie
- `clearAdminSession()` — delete cookie

**Environment variables:**
- `ADMIN_PASSWORD` — shared password
- `ADMIN_SESSION_SECRET` — for HMAC signing

### 2. Create admin page layout

**`src/app/admin/page.tsx`:**

Three states:
1. **Loading**: checking session
2. **Locked**: show password input form
3. **Ready**: show editor UI

Layout when ready:
```
┌──────────────────────────────────────────┬──────────┐
│                                          │          │
│          Isometric Canvas                │  Asset   │
│          (same renderer as viewer)       │  Panel   │
│                                          │          │
│                                          │          │
│                                          │          │
├──────────────────────────────────────────┤          │
│  Toolbar: [Select] [Place] [Delete]      │          │
└──────────────────────────────────────────┴──────────┘
```

### 3. Create Asset Panel component

Right sidebar showing uploaded assets:

```tsx
<div className="w-72 border-l border-slate-700 bg-slate-900 p-4 overflow-y-auto">
  <h2>Assets</h2>
  
  {/* Upload button */}
  <button onClick={handleUpload}>Upload Sprite</button>
  
  {/* Asset grid */}
  <div className="grid grid-cols-3 gap-2">
    {assets.map(asset => (
      <div 
        key={asset._id}
        onClick={() => selectAsset(asset)}
        className="cursor-pointer rounded border p-1 hover:border-amber-400"
      >
        <img src={asset.url} className="w-full aspect-square object-contain" />
        <span className="text-xs">{asset.name}</span>
      </div>
    ))}
  </div>
  
  {/* Asset type filters */}
  <div className="flex gap-1">
    <button>All</button>
    <button>Buildings</button>
    <button>Decorations</button>
    <button>Vehicles</button>
  </div>
</div>
```

### 4. Implement asset upload

Upload flow:
1. User clicks "Upload Sprite" → file picker opens
2. File selected → show preview with name input and type selector
3. User confirms → upload to Convex file storage:
   ```ts
   const uploadUrl = await generateUploadUrl();
   await fetch(uploadUrl, { method: "POST", body: file });
   await createAsset({ name, storageId, type, ... });
   ```
4. Asset appears in the panel

Supported: PNG images only. Show file size and dimensions.

### 5. Implement editor modes

Three modes controlled by toolbar:

**Select mode** (default):
- Click entity to select
- Shows entity info in a details panel
- Can edit name, description, etc. via form

**Place mode** (activated when asset is selected from panel):
- Cursor changes to crosshair
- Ghost preview follows cursor (semi-transparent sprite at hover tile)
- Click tile to place entity:
  ```ts
  await createEntity({
    type: selectedAsset.type,
    name: selectedAsset.name,
    gridX: tileX,
    gridY: tileY,
    assetId: selectedAsset._id,
  });
  ```
- After placing, stay in place mode (can place multiple)
- Press Escape or click toolbar to exit place mode

**Delete mode**:
- Cursor changes to crosshair with red tint
- Click entity to delete it (with confirmation)
- `await removeEntity(entityId)`

### 6. Implement drag-to-move

In Select mode, when an entity is selected:
- Click and drag the entity to move it
- Show ghost preview at the drag destination
- On drop: `await moveEntity(entityId, newGridX, newGridY)`
- Snap to grid (round to nearest tile)

Drag detection:
- onPointerDown on entity → start potential drag
- onPointerMove → if moved > 5px, enter drag mode
- onPointerUp → if dragging, complete move; if not, it was a click (select)

### 7. Create entity details panel

When an entity is selected in Select mode, show an editable form:

```tsx
<div className="fixed left-4 bottom-4 z-50 w-80 rounded-xl bg-slate-900/95 p-4">
  <img src={entity.spriteUrl} className="h-16 w-16 object-contain" />
  <input value={entity.name} onChange={...} placeholder="Name" />
  <textarea value={entity.description} onChange={...} placeholder="Description" />
  <input value={entity.url} onChange={...} placeholder="URL" />
  <input value={entity.techStack?.join(", ")} onChange={...} placeholder="Tech stack" />
  <select value={entity.category}>
    <option>project</option>
    <option>company</option>
    <option>education</option>
  </select>
  <button onClick={handleSave}>Save</button>
  <button onClick={handleDelete} className="text-red-400">Delete</button>
</div>
```

### 8. Implement admin API proxy

Like v1, admin writes should go through Next.js API routes:

**`src/app/api/admin/route.ts`:**
- POST endpoint that validates session
- Maps operation to Convex mutation
- Injects admin password server-side

**OR simpler approach**: Since Convex mutations are called from the client and we're using session cookies, we could skip the proxy and call mutations directly from the admin page. Add admin guard in Convex mutations that checks a password argument.

**Choose the simpler approach for v2**: Call Convex mutations directly from admin page. Guard mutations with admin password sent from client (password stored in session/memory after login).

### 9. Handle real-time updates

Since Convex queries are reactive:
- When admin places/moves/deletes an entity, ALL connected viewers update instantly
- The admin sees their own changes immediately
- No manual refresh needed

### 10. Add keyboard shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Exit place/delete mode, deselect |
| `Delete` / `Backspace` | Delete selected entity |
| `V` | Switch to Select mode |
| `P` | Switch to Place mode (if asset selected) |

## Testing Steps (Chrome DevTools)

| # | What to Test | How to Verify |
|---|-------------|---------------|
| 1 | Login page | /admin shows password input |
| 2 | Wrong password | Incorrect password shows error, stays locked |
| 3 | Correct password | Correct password shows editor UI |
| 4 | Session persists | Refresh /admin — stays authenticated |
| 5 | Logout | Logout button clears session, returns to login |
| 6 | Asset upload | Upload PNG → appears in asset panel |
| 7 | Asset preview | Uploaded assets show thumbnail and name |
| 8 | Place mode | Select asset → cursor becomes crosshair |
| 9 | Ghost preview | In place mode, semi-transparent sprite follows cursor |
| 10 | Place entity | Click tile → entity appears on grid |
| 11 | Place persists | Refresh → placed entity still there |
| 12 | Select entity | Click entity → selected (glow) + details panel |
| 13 | Edit entity | Change name in details → save → name updated |
| 14 | Drag to move | Drag entity to new tile → snaps to grid |
| 15 | Move persists | Refresh → entity at new position |
| 16 | Delete entity | Select → delete → entity removed |
| 17 | Delete persists | Refresh → entity gone |
| 18 | Real-time | Open viewer in another tab → admin changes appear live |
| 19 | Keyboard shortcuts | Escape deselects, Delete removes, etc. |
| 20 | Console clean | No errors |

## Checklist

- [ ] Admin login API route created
- [ ] Admin session management (cookie-based HMAC)
- [ ] Admin logout API route
- [ ] Admin page with loading/locked/ready states
- [ ] Password form works
- [ ] Session persists across refreshes
- [ ] Editor layout: canvas + sidebar + toolbar
- [ ] Asset panel shows uploaded assets
- [ ] Asset upload works (file picker → Convex storage)
- [ ] Asset type filter works
- [ ] Select mode: click to select entity
- [ ] Place mode: ghost preview at cursor
- [ ] Place mode: click to create entity
- [ ] Delete mode: click to delete entity
- [ ] Drag-to-move: drag entity to new tile
- [ ] Move snaps to grid
- [ ] Entity details panel shows on select
- [ ] Entity details editable (name, description, url, techStack, category)
- [ ] Save button persists changes to Convex
- [ ] Keyboard shortcuts work (Escape, Delete, V, P)
- [ ] Real-time: changes visible in viewer tab
- [ ] No console errors

## Acceptance Criteria

1. Admin page is password-protected; session persists
2. Sprites can be uploaded and appear in the asset panel
3. Entities can be placed on the grid by selecting an asset and clicking a tile
4. Entities can be dragged to new positions
5. Entities can be deleted
6. Entity metadata can be edited (name, description, URL, etc.)
7. All changes persist (survive page refresh)
8. Changes appear in real-time in a separate viewer tab

## Files to Create / Modify

| Action | File |
|--------|------|
| Create | `src/app/admin/page.tsx` |
| Create | `src/app/api/admin/login/route.ts` |
| Create | `src/app/api/admin/session/route.ts` |
| Create | `src/app/api/admin/logout/route.ts` |
| Create | `src/lib/adminSession.ts` |
| Create | `src/components/admin/AssetPanel.tsx` |
| Create | `src/components/admin/EditorToolbar.tsx` |
| Create | `src/components/admin/EntityDetailsPanel.tsx` |
| Create | `src/components/admin/AssetUploader.tsx` |
| Create | `src/components/admin/GhostPreview.tsx` (placement preview) |
| Create | `src/hooks/useEditorMode.ts` (mode state management) |
| Modify | `src/components/EntityLayer.tsx` (add drag support in editor) |

## Blockers / Notes

_Updated during development._

**Auth decision**: Start with simple password auth. If it causes friction, switch to Clerk later. The password approach is proven from v1 and is simpler for a solo dev.
