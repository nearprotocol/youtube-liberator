#!/bin/sh

URL="$1"
DEST_DIR="$2"

mkdir -p $DEST_DIR
cd $DEST_DIR

youtube-dl -o '%(id)s.%(ext)s' $URL -f mp4 --write-thumbnail --write-info-json
ipfs add -r . | tee ipfs.out
