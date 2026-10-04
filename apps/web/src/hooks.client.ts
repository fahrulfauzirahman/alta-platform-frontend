// Web composition root: selects the web platform adapter. No Tauri imports allowed here.
import { webAdapter } from '@alta/platform/web';

export const platform = webAdapter;
