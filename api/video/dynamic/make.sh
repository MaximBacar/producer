#!/bin/bash

CLIP_DIR="clips"
AUDIO="audio.mp3"
OUTPUT="output.mp4"

TMP_LIST="concat_list.txt"

echo "Getting audio duration..."

DURATION=$(ffprobe -v error -show_entries format=duration \
-of default=noprint_wrappers=1:nokey=1 "$AUDIO")

echo "Audio duration: $DURATION seconds"

echo "Collecting clips..."

# SAFE: macOS-compatible random shuffle
CLIPS=($(ls "$CLIP_DIR"/*.mp4 | python3 -c "
import random,sys
clips=sys.stdin.read().strip().split()
random.shuffle(clips)
print('\n'.join(clips))
"))

if [ ${#CLIPS[@]} -eq 0 ]; then
    echo "No clips found in $CLIP_DIR"
    exit 1
fi

echo "Building concat list..."

> "$TMP_LIST"

TOTAL=0
INDEX=0

while (( $(echo "$TOTAL < $DURATION" | bc -l) )); do

    CLIP="${CLIPS[$INDEX % ${#CLIPS[@]}]}"

    echo "file '$CLIP'" >> "$TMP_LIST"

    # assume ~5 sec clips
    TOTAL=$(echo "$TOTAL + 5" | bc)

    INDEX=$((INDEX + 1))

done

echo "Generating video..."

ffmpeg -hide_banner -loglevel error \
    -f concat -safe 0 -i "$TMP_LIST" \
    -i "$AUDIO" \
    -vf "scale=1080:1080:flags=fast_bilinear,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30" \
    -c:v h264_videotoolbox \
    -b:v 10M \
    -c:a aac \
    -shortest \
    -movflags +faststart \
    "$OUTPUT"

echo "Done → $OUTPUT"