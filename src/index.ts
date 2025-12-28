// Core types and interfaces
export * from './core/types';

// Core functionality
export * from './core/path';
export * from './core/handles';

// Tools
export * from './tools/penTool';
export * from './tools/editMode';

// Renderer interface and implementations
export * from './renderer/IPathRenderer';
export * from './renderer/pathRenderer';
export * from './renderer/canvasPathRenderer';

// Backward compatibility: export SvgPathRenderer as PathRenderer
export { SvgPathRenderer as PathRenderer } from './renderer/pathRenderer';
