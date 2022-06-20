# Gyrologos Discord Bot

Gyrologos ("turn teller") is a Discord bot created to track whose turn it is in an asynchronous turn-based multiplayer environment (more specifically, Medieval II Total War hotseat). The project is imported from Replit.

### Features
The bot's main function is to search user messages for attachments. If the attachment is a .sav file (the game's save file format) and it is the message author's turn to provide a save file, it ends their turn and starts the turn of the next player in the list, and notifies everyone on the Discord group.

Other features include:
- Notifying players how long until the current turn expires, with the *!turn* or *!time* commands
- Automatically notifying the current player when his turn's time is running out (at 6, 3 and 1 hour remaining)
- Automatically ending a player's turn when he runs out of time
- Adding an image/gif to the bot's messages
- Displaying the rules
- Displaying player stats, like times won and average turn completion time
- Giving the admin the ability to add more images/gif to the database, skip a player's turn or declare a winner

![Screenshot](https://user-images.githubusercontent.com/4154061/174610242-e0f4e6ab-0f35-4037-8398-aa57a19f6787.png)
![Screenshot (1)](https://user-images.githubusercontent.com/4154061/174610248-b068d6dd-044a-4ce3-8240-403317173972.png)
![Screenshot (2)](https://user-images.githubusercontent.com/4154061/174610903-5987c737-d2fb-45b9-ac1b-4434dbc06394.png)
###### Note: The name Gyrologos is a wordplay in Greek, as "gyros" is both the word for "turn" and the fast food Gyros.
