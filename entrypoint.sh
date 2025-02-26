#!/bin/sh
if [ "$1" != "servers" ] && [ "$1" != "script/updateContent" ]; then
   echo "sorry, '$1' is not a command"
   exit 1
fi
# Execute the Node.js script with the given argument
exec node "$1"