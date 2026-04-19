import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    ignores: ['node_modules/**', 'dist/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        // Browser
        window: 'readonly', document: 'readonly', console: 'readonly',
        fetch: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly',
        setInterval: 'readonly', clearInterval: 'readonly',
        URL: 'readonly', URLSearchParams: 'readonly',
        FileReader: 'readonly', FormData: 'readonly', Blob: 'readonly',
        File: 'readonly', navigator: 'readonly', performance: 'readonly',
        CustomEvent: 'readonly', Event: 'readonly',
        SpeechRecognition: 'readonly', webkitSpeechRecognition: 'readonly',
        MutationObserver: 'readonly', ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        HTMLElement: 'readonly', Element: 'readonly', Node: 'readonly',
        crypto: 'readonly', atob: 'readonly', btoa: 'readonly',
        alert: 'readonly', confirm: 'readonly',
        process: 'readonly',  // Vite injects process.env
        React: 'readonly',    // JSX transform
        TextDecoder: 'readonly', TextEncoder: 'readonly',
        AbortController: 'readonly', AbortSignal: 'readonly',
        ReadableStream: 'readonly', WritableStream: 'readonly',
        queueMicrotask: 'readonly', structuredClone: 'readonly',
        EventTarget: 'readonly', EventSource: 'readonly',
        WebSocket: 'readonly', Worker: 'readonly',
        Image: 'readonly', Audio: 'readonly', Video: 'readonly',
        OffscreenCanvas: 'readonly', DOMParser: 'readonly',
        history: 'readonly', location: 'readonly',
        getComputedStyle: 'readonly', matchMedia: 'readonly',
        scrollTo: 'readonly', scrollBy: 'readonly',
        open: 'readonly', close: 'readonly', print: 'readonly',
        clearImmediate: 'readonly', setImmediate: 'readonly',
      },
    },
    rules: {
      // ── Errors: definite bugs ────────────────────────────────────────────
      'no-undef':                        'error',
      'no-duplicate-case':               'error',
      'no-unreachable':                  'error',
      'no-async-promise-executor':       'error',
      'no-constant-condition':           'error',
      'no-self-assign':                  'error',
      'use-isnan':                       'error',

      // ── React hooks: the stale-closure bugs we've hit ────────────────────
      'react-hooks/rules-of-hooks':      'error',   // hooks inside conditions = crash
      'react-hooks/exhaustive-deps':     'warn',    // missing deps = stale closure

      // ── Warnings: worth fixing over time ─────────────────────────────────
      'no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none',   // ignore unused vars in catch(e)
      }],
      'prefer-const':   'warn',
      'no-var':         'warn',
      'eqeqeq':         ['warn', 'smart'],
      'require-await':  'warn',

      // ── Off: too noisy for the existing codebase ─────────────────────────
      'no-empty':       'off',
      'no-console':     'off',
    },
  },
];
