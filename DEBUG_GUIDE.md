# Multiplayer Debug Guide

## Console Commands to Run While Testing

### Check Current State
```javascript
// In browser console, check if local player exists:
document.querySelectorAll('group').forEach(g => console.log(g))

// Check Three.js scene children:
const canvas = document.querySelector('canvas');
if (canvas && canvas.__r3f) {
  console.log('Scene children:', canvas.__r3f.root.children);
}
```

## Common Issues and Solutions

### 1. Local Player Disappears
**Symptoms:** Can see other players but not yourself
**Check logs for:**
- `UNMOUNTING PLAYER` with `isLocal: true`
- Local player frame logs stopping
- Position becoming invalid

**Potential fixes:**
- Check React Strict Mode (might cause double mounting)
- Ensure unique keys for components
- Check if position state is being corrupted

### 2. Position Becomes Invalid
**Symptoms:** Player at 0,0,0 or NaN position
**Check logs for:**
- `Invalid position detected!`
- Position arrays with NaN values

**Potential fixes:**
- Add position validation before updates
- Check for race conditions in state updates

### 3. Camera Issues
**Symptoms:** Can move but can't see player
**Check logs for:**
- Camera position logs with extreme values
- Wizard position not matching camera target

**Potential fixes:**
- Ensure camera follows valid positions only
- Check if player is within camera frustum

## What to Report

When reporting the issue, please include:
1. The last 50 lines of console output before player disappears
2. Any error messages (especially with ❌ or CRITICAL)
3. The sequence of actions (who joined first, second, etc.)
4. Browser and OS information

## Temporary Workarounds

While debugging, you can try:
1. Disable React Strict Mode in index.tsx
2. Add a "recenter" button that resets position to [0, 0.5 + 2.80, 0]
3. Use a fixed camera position instead of following player