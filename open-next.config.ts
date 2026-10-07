import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page is prerendered, so no incremental cache storage is needed.
export default defineCloudflareConfig({});
