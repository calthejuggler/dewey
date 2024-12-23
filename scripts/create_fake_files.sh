#!/usr/bin/env bash
#
# Usage: ./create_mkv_files.sh <count>
# Example: ./create_mkv_files.sh 5
# This will create:
#   EXAMPLE_MOVIE_t00.mkv
#   EXAMPLE_MOVIE_t01.mkv
#   EXAMPLE_MOVIE_t02.mkv
#   EXAMPLE_MOVIE_t03.mkv
#   EXAMPLE_MOVIE_t04.mkv
#   EXAMPLE_MOVIE_t05.mkv
#

# If the user didn't provide the count, default to 5
COUNT=${1:-5}
PREFIX="SHAUN_OF_THE_DEAD"

echo "Creating directory: $PREFIX"

mkdir "$PREFIX"

for (( i=0; i<=COUNT; i++ )); do
  # Use printf to pad the number with zero if needed
  FILENAME=$(printf "%s/%s_t%02d.mkv" "$PREFIX" "$PREFIX" "$i")
  echo "Creating file: $FILENAME"
  touch "$FILENAME"
done

