#!/bin/bash
FILE='build/css/build.min.css'
if [ ! -f $FILE ]; then
  echo 'ERROR: Build file could not be found or is not readable. Please build first with `./run build`'
  exit 1
fi

THRESHOLD=400000
CURRENTSIZE=$(du -b $FILE | cut -f 1)
REPONSESTART='Your generated CSS is '
REPONSEJOIN=' with a threshold of '
MESSAGE=$REPONSESTART$CURRENTSIZE$REPONSEJOIN$THRESHOLD
if [ $CURRENTSIZE -lt $THRESHOLD ]; then
  STATUS='SUCCESS: '
  EXIT=0
else
  STATUS='ERROR: '
  EXIT=1
fi

echo $STATUS$MESSAGE
exit $EXIT
