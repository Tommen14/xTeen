# xTeen

This is a streaming platform designed to give everyone the chance to have their own personal "Netflix". I'm leaving the code available, and I hope you'll make good use of it!

## How to start the app

```
npm install
cd server
node server.js
```

To add a series, create a **videos** folder and an **images** folder inside the **server** directory.
In the first one (videos), create a subfolder with the exact same name as the series. Inside it, place the episodes (ideally named using the format *S1E10 - Title*, otherwise it will try to assign a default name like *episode 10*), plus the series trailer named *series-title Trailer*.
In the **images** folder, just put the wallpaper image and name it exactly like the series title (must match the one used in **videos**).

```
server/
├── videos/
│   └── NomeSerie/
│       ├── NomeSerie Trailer.mp4
│       ├── S1E1 - Titolo.mp4
│       └── S1E2 - Titolo.mp4
└── images/
    └── NomeSerie.jpg
```

Some characters in titles are not readable, so feel free to replace them with these:

& → --

? → -askm

/ → -slash

. → -pnt

: → -dpnt

Note: Only **.jpg** and **.mp4** files are accepted. If you want to hide a series, just add the **@** symbol at the beginning (or in) the series folder name inside **videos**.

## Message for devs

I'm leaving you the *rename_files.py* file that I use to rename files faster. It's a pretty "bare-bones" script where you need to tweak several values depending on the website layout you're scraping titles from. It's a simple automation using pyautogui, but it already has the correct formatting applied.

Thanks for the collaboration!