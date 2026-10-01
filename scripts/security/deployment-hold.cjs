'use strict';

// Deliberately unconditional: removing this hold requires a reviewed source change.
process.stderr.write("CHATMCP_SECURITY_HOLD: authentication and source/runtime parity must be reviewed before activation.\n");
process.exitCode = 1;
