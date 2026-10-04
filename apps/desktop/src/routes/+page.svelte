<script lang="ts">
  import { AppShell } from "@alta/app-shell";
  import { ReferenceItems } from "@alta/reference-items";
  import { tauriAdapter } from "@alta/platform/tauri";
  
  const tenantId = "00000000-0000-0000-0000-000000000001";
  const baseUrl = "/api";
</script>
<AppShell>
  <span slot="topbar"><strong>ALTA</strong>&nbsp;Desktop</span>
  <span slot="sidebar">Reference demo</span>
  <ReferenceItems baseUrl={baseUrl} tenantId={tenantId} heading="Reference items" platform={tauriAdapter} />
</AppShell>
