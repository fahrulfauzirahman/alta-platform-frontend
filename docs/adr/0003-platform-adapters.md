# ADR 0003: Platform adapters

Shared code calls PlatformAdapter, never Tauri directly. Web selects webAdapter, desktop selects tauriAdapter.
