#!/usr/bin/env node

import('../dist/index-simple.js')
  .then((m) => m.main())
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
