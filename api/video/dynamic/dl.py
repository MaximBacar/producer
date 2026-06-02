from yt_dlp import YoutubeDL

url = "https://www.youtube.com/watch?v=SpXw0qiy3Wo&list=RDSpXw0qiy3Wo&start_radio=1"

ydl_opts = {
    "format": "best",
}

with YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])