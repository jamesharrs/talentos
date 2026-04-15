// client/src/hooks/useRecordSync.js
// Subscribe to SSE events for a specific record and call a callback when
// a matching event arrives. Zero-dependency, auto-reconnects.
import { useEffect, useRef } from 'react';
import { getTenantSlug } from '../apiClient.js';

/**
 * useRecordSync(recordId, onUpdate)
 *
 * Opens a persistent SSE connection shared across all components in the page
 * (one EventSource per tab, keyed by tenant). When the server pushes an event
 * whose record_id matches, onUpdate(event) is called so the component can
 * reload only its own data.
 *
 * @param {string|null} recordId  - The record to watch. Pass null to skip.
 * @param {function}    onUpdate  - Called with the event object on any match.
 * @param {string[]}    [types]   - Optional event type filter. Default: all task/event types.
 */

// Shared EventSource instance per tab (one connection, many listeners)
let sharedEs = null;
let esListeners = new Set(); // { types, recordId, cb }
let esRetryTimer = null;

function openSharedES() {
  if (sharedEs) return;
  const slug = (() => { try { return getTenantSlug() || ''; } catch { return ''; } })();
  const url = `/api/events/stream${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`;

  sharedEs = new EventSource(url);

  sharedEs.onmessage = (e) => {
    if (!e.data || e.data.trim() === '') return;
    let event;
    try { event = JSON.parse(e.data); } catch { return; }
    for (const listener of esListeners) {
      if (listener.recordId && event.record_id !== listener.recordId) continue;
      if (listener.types && !listener.types.includes(event.type)) continue;
      try { listener.cb(event); } catch (_) {}
    }
  };

  sharedEs.onerror = () => {
    sharedEs?.close();
    sharedEs = null;
    if (!esRetryTimer) {
      esRetryTimer = setTimeout(() => { esRetryTimer = null; openSharedES(); }, 5000);
    }
  };
}

const TASK_TYPES = ['task_created', 'task_updated', 'task_deleted',
                    'event_created', 'event_updated', 'event_deleted'];

export function useRecordSync(recordId, onUpdate, types = TASK_TYPES) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate; // always call the latest cb without re-subscribing

  useEffect(() => {
    if (!recordId) return;

    const listener = {
      recordId,
      types,
      cb: (ev) => cbRef.current(ev),
    };

    esListeners.add(listener);
    openSharedES();

    return () => { esListeners.delete(listener); };
  }, [recordId]); // eslint-disable-line react-hooks/exhaustive-deps
}
