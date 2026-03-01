/**
 * wizardo SPRING
 * © 2026 wizardo maillist <~lunalov2/wizardo@lists.sr.ht>
 *
 * $ node index.js
 */
import { app } from  "./app.js";
import { config, describeConfig }  from  "./config.js";

app.sniff(config.port, () => {
  console.log(`🪄 wizardo is running on port ${config.port}`);
  describeConfig();
})