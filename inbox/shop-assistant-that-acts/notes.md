# Project: a shop assistant that acts (my notes)

Topic: Many models, one app. Planned item: "Project: a shop assistant that acts" (project, tag "Many models, one app · Project"). ~30 min, hands-on. Combines the three lessons before it.

## Goal
A customer-service assistant for a small business (I picked a bus-tour company; a Singapore estate shop works as well). It answers price questions from a database, draws a picture of the place it is talking about, and speaks the reply.

## Build order
1. System message: short, polite, accurate, say "I don't know" when unsure.
2. Database: SQLite table `prices(city, price)`; `get_price` and `set_price` functions.
3. Tool description + the chat loop that handles tool calls (many, chained).
4. Image helper: when a tool call mentions a place, generate a pop-art style picture for it.
5. Voice helper: turn the final reply into audio.
6. Screen with `gr.Blocks`: a row with a chatbot on the left and an image panel on the right, a text box underneath, and a microphone/audio player for the reply. The send callback first puts the user message into the chat, then a second callback calls the model, and finally updates chat, image and audio.

## Shape of the finished thing
user text -> chat loop (model + DB tools) -> reply text -> image(place) + speech(reply) -> screen.

## What I got wrong
- Generated an image on every message: it costs money and is slow. Do it only when a tool actually looked up a place.
- Two callbacks fighting over the same history list: split "add the user message" from "get the answer".

## Try it yourself
1. Add a tool "book a trip" that writes a row in a second table.
2. Print every tool call to the console so you can see what the model asked for.
3. Replace the database with a CSV and see what changes.

## Takeaways
Chat model + tools + other media models = an assistant that does things. Keep each piece small and testable. Cost control matters (images, long histories). This is the bridge into agents.
