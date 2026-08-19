# Dynamic station buttons

Normally every station button needs its callsign typed in by hand. With dynamic station buttons you set up a page of blank buttons once, and they fill themselves from whatever stations you have open in TrackAudio.

- [Before you start](#before-you-start)
- [Quick setup](#quick-setup)
- [How buttons get their station](#how-buttons-get-their-station)
- [Splitting one station across several buttons](#splitting-one-station-across-several-buttons)
- [What separates one station from the next](#what-separates-one-station-from-the-next)
- [Volume dials](#volume-dials)
- [Mixing fixed and dynamic buttons](#mixing-fixed-and-dynamic-buttons)
- [Things worth knowing](#things-worth-knowing)
- [Troubleshooting](#troubleshooting)

## Before you start

- TrackAudio must be running and connected to voice. Until it is, dynamic buttons stay empty.
- Everything lives on **one Stream Deck page**. The plugin can only see the page that is currently showing, so buttons on a second page would be given the same stations as the first.
- You add and remove stations **in TrackAudio**, not by switching Stream Deck profiles. This is the opposite of how fixed buttons work — see [Things worth knowing](#things-worth-knowing).

## Quick setup

1. Drop as many **Station status** buttons onto a page as you want stations.
2. Open each one and tick **Follow TrackAudio**.
3. Leave **Callsign** empty. It is ignored while Follow TrackAudio is on.
4. Connect to voice in TrackAudio and add your stations there.

Your buttons fill in as the stations come up, each showing its callsign. Buttons with no station yet show a dashed outline.

Dynamic buttons label themselves with the callsign so you can tell them apart. If you would rather use the space for something else, untick **Show callsign** under Advanced options. Volume dials label themselves the same way.

That is the whole setup. Everything below is about layouts with more than one button per station, and what to do when something looks wrong.

## How buttons get their station

Stations are handed out in the order they appear in TrackAudio: the first station you add goes to the first button, the second to the second, and so on.

Once a button has a station it keeps it. Adding a new station in TrackAudio does not shuffle everything along — the new station takes the first free button instead. Removing a station frees its button, and the next station you add reuses it.

This is deliberate. A button that changes frequency while you are working traffic is worse than a blank one, so nothing moves unless you make it move.

Buttons are filled left to right, top to bottom.

## Splitting one station across several buttons

Station buttons can show different things: whether the station is receiving, whether it is transmitting, or the last callsign heard on the frequency. Many people give one station a button for each and line them up in a column.

The plugin keeps those together. Buttons that sit next to each other and show *different* things are treated as one station:

```text
┌──────┬──────┬──────┐
│  RX  │  RX  │  RX  │
├──────┼──────┼──────┤
│  TX  │  TX  │  TX  │   3 stations, one per column
├──────┼──────┼──────┤
│ Last │ Last │ Last │
└──────┴──────┴──────┘
```

Rows work exactly the same way:

```text
┌──────┬──────┬──────┐
│  RX  │  TX  │ Last │   station 1
├──────┼──────┼──────┤
│  RX  │  TX  │ Last │   station 2
└──────┴──────┴──────┘
```

You do not have to tell the plugin which way round your layout is. It works it out from the buttons themselves and picks whichever reading gives it the most complete groups.

What counts as "showing something different" is the combination of two settings:

| Button | Listen to | Last received callsigns |
| --- | --- | --- |
| RX | RX | 0 |
| TX | TX | 0 |
| XC | XC | 0 |
| Last callsign | RX | 1 or more |

So an RX button and a last-callsign button count as different, even though both are set to listen to RX.

## What separates one station from the next

A run of buttons stops being one station when it hits any of these:

- **The same thing twice.** Two RX buttons side by side are two stations, not one station shown twice. This is what keeps a plain row of RX buttons working as a row of separate stations.
- **An empty key.** Leave a gap and the run ends there.
- **Any other button.** A push to talk or TrackAudio status button in the middle of a column splits it.
- **A button with a callsign typed in.** Fixed buttons are not part of any group.

If you want two neighbouring buttons to be separate stations even though they show different things, put a gap between them or move one of them.

## Volume dials

**Station volume** dials on a Stream Deck + have the same **Follow TrackAudio** setting.

A dial takes the station of the buttons directly above it, so the dial in the first column controls the station shown in the first column. If your layout runs in rows rather than columns, dials are filled in their own left-to-right order instead.

## Mixing fixed and dynamic buttons

You can have both on the same page. A button with a callsign typed in behaves exactly as it always has and is skipped when stations are handed out. This is useful for stations you always want in the same place — UNICOM, GUARD, or your home tower — with the rest of the page left dynamic.

## Things worth knowing

**GUARD and UNICOM never take a slot.** TrackAudio always has them open, so they would sit on your first two buttons forever. Give them fixed buttons if you want them.

**Auto-add does not apply to dynamic buttons.** Fixed buttons push their callsigns into TrackAudio when you switch profiles. Dynamic buttons cannot — they take their callsign *from* TrackAudio, so adding it back would change the list and reshuffle them. On a dynamic page, TrackAudio is in charge and you add stations there.

**Auto set RX and auto set speaker still work.** They apply when a station lands on a button rather than when it is added in TrackAudio.

**Restarting Stream Deck starts over.** Assignments are not saved. When the plugin restarts it reads the station list fresh and fills the buttons again. If TrackAudio's stations have not changed you get the same layout back; if they have, you may not.

**More than one Stream Deck** shares a single run of stations, ordered by device. The same station never appears on two decks.

## Troubleshooting

| What you see | Why | What to do |
| --- | --- | --- |
| Every button is blank with a dashed outline | TrackAudio is not connected to voice, or has no stations open | Connect in TrackAudio and add a station |
| Buttons stay blank after adding a station in TrackAudio | The plugin is not connected to TrackAudio | Check the TrackAudio status button, and that TrackAudio is running |
| Several buttons show the same station when they should be separate | They sit next to each other showing different things, so they were grouped | Put an empty key between them, or make them show the same thing |
| One station is spread over buttons that should be separate stations | Same as above | As above |
| A column that should be one station is split in two | Two buttons in it show the same thing | Check **Listen to** and **Last received callsigns** on each — see the table in [Splitting one station across several buttons](#splitting-one-station-across-several-buttons) |
| Buttons filled in rows when you wanted columns | The layout was ambiguous, so the wrong reading scored higher | Make the layout consistent: give every station the same set of buttons in the same order |
| A button shows the warning triangle | That station was in TrackAudio and has gone | It clears itself when the station list next updates |

The warning triangle and the dashed outline mean different things. The triangle means a station was expected and is missing; the dashed outline means the button is waiting for a station and there is not one for it yet.

### Getting a log

Debug logging is compiled in when the plugin is built, not switched on at runtime. A normal build only logs warnings and errors. To get the detail — including which buttons were grouped together and which station each group was given — build with debug logging on:

```bash
LOG_LEVEL=debug npm run build
```

`npm run watch` does the same thing. See [DEVELOPMENT.md](../DEVELOPMENT.md) for the build setup.
