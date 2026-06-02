#!/bin/bash

VIDEO="input.mp4"
NUM_CLIPS=10
CLIP_DURATION=5
SCENE_THRESHOLD=0.25

mkdir -p clips

echo "Detecting scenes..."

ffmpeg -hide_banner -i "$VIDEO" \
-vf "select='gt(scene,$SCENE_THRESHOLD)',metadata=print" \
-f null - 2>&1 |
awk '
/pts_time:/ {
    if (match($0, /pts_time:([0-9.]+)/)) {
        ts = substr($0, RSTART + 9, RLENGTH - 9)
    }
}

/lavfi.scene_score=/ {
    if (match($0, /lavfi.scene_score=([0-9.]+)/)) {
        score = substr($0, RSTART + 18, RLENGTH - 18)
        print score, ts
    }
}
' |
sort -nr |
head -n "$NUM_CLIPS" > scenes.txt

echo "Generating MP4 clips..."

cat scenes.txt | while read SCORE TS; do
(
    SAFE_TS=$(echo "$TS" | tr '.' '_')

    ffmpeg -hide_banner -loglevel error \
        -ss "$TS" \
        -t "$CLIP_DURATION" \
        -i "$VIDEO" \
        -an \
        -c:v h264_videotoolbox \
        -vf "crop='min(iw,ih)':'min(iw,ih)',fps=12" \
        -b:v 2M \
        -movflags +faststart \
        "clips/scene_${SAFE_TS}.mp4"
) &
done

wait

echo "Done."
echo "Generated clips:"
ls clips/
