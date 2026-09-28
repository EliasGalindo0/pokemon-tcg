#!/bin/sh
set -e
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads
export HOME=/tmp
exec su-exec nextjs "$@"
