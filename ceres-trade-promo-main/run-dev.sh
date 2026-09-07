#!/bin/bash
# Ceres Trade Promo — Local Dev Server

DIR="$(cd "$(dirname "$0")" && pwd)"

export SNOWFLAKE_ACCOUNT="NYNKYBM-IJ81701"
export SNOWFLAKE_USER="ANDANGCH"
export SNOWFLAKE_PRIVATE_KEY_PATH="$DIR/rsa_key.p8"
# export SNOWFLAKE_PRIVATE_KEY_PASSPHRASE="your-passphrase"  # uncomment if key is encrypted

cd "$DIR" && npm run dev
