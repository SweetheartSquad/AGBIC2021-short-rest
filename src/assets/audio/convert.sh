for f in *.wav ; do ffmpeg -i "$f" -acodec libmp3lame -q:a 2 "${f%.*}.mp3"; done
