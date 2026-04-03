/**
 * Re-export from @modular/harness (migrated from local copy).
 * @see packages/harness/src/background.ts
 */
export {
  shouldRunTask,
  acquireLock,
  releaseLock,
  runBackgroundTasks,
  type BackgroundTaskDef,
  type BackgroundTaskResult,
} from '@modular/harness';
