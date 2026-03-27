/**
 * FeatureFlags — React hook + FeatureGate component
 *
 * Usage:
 *   const flags = useFeatureFlags();
 *   if (flags.ai_copilot) { ... }
 *
 *   <FeatureGate flag="voice_copilot"><VoiceCopilot/></FeatureGate>
 *
 * Wrap in App.jsx after login:
 *   <FeatureFlagsProvider environmentId={selectedEnv?.id}>
 *     {children}
 *   </FeatureFlagsProvider>
 */
import { useState, useEffect, useContext, createContext, useCallback } from 'react';

const FlagsContext = createContext({});
let _cachedFlags = null, _cacheEnvId = null;

export function FeatureFlagsProvider({ environmentId, children }) {
  const [flags, setFlags]   = useState(_cachedFlags || {});
  const [loading, setLoading] = useState(!_cachedFlags);

  const loadFlags = useCallback(async () => {
    if (!environmentId) return;
    if (_cacheEnvId === environmentId && _cachedFlags) { setFlags(_cachedFlags); setLoading(false); return; }
    try {
      const res = await fetch(`/api/feature-flags?environment_id=${environmentId}`);
      if (res.ok) { const data = await res.json(); _cachedFlags = data; _cacheEnvId = environmentId; setFlags(data); }
    } catch { setFlags({}); }
    finally { setLoading(false); }
  }, [environmentId]);

  useEffect(() => { loadFlags(); }, [loadFlags]);
  return <FlagsContext.Provider value={{ flags, loading, reload: loadFlags }}>{children}</FlagsContext.Provider>;
}

/** Full flags object */
export function useFeatureFlags() { return useContext(FlagsContext).flags; }

/** Single flag — defaults to true (fail-open) while loading */
export function useFlag(flagKey) {
  const { flags, loading } = useContext(FlagsContext);
  if (loading) return true;
  return flags[flagKey] ?? true;
}

/** Renders children only when flag is enabled */
export function FeatureGate({ flag, fallback = null, children }) {
  const enabled = useFlag(flag);
  return enabled ? children : fallback;
}

/** Call after toggling a flag in Settings to force a reload */
export function invalidateFlagCache() { _cachedFlags = null; _cacheEnvId = null; }
