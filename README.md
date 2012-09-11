# Chatta Box

> Author @ Eric Reinsmidt, eric@reinsmidt.com

> THIS SOFTWARE IS SUPPLIED WITHOUT WARRANTY OR LIABILITY OF ANY KIND!!!

> It is released under some undecided FOSS license

### INSTALLATION

To successfully run this chat system there are two essential elements:
	1. Node.js Server installed with the Node Package Manager (NPM)
	2. Redis NoSQL Database

### Node.js:
	The latest version of Node.js can be found at http://nodejs.org/download/ or can be downloaded using the Git protocol with the command 'git clone git://github.com/joyent/node.git'
	While Node.js can be run in a Windows environment, it is preferred to run in a Unix environment. The reason is that the NoSQL database used in this application, Redis, is not fully developed in the Windows environment. In addition, most of the tools here are in their infancy, so a current version of all components is fully advised.

### Redis:
	Redis can be installed a number of ways, but the most efficient way to ensure you are getting the most recent version is again to use git 'git clone git://github.com/antirez/redis.git'

### Other Dependencies:
	Using the NPM, it is a simple matter to install all other dependencies.

### Edit Files to Your System:
	You will need to edit the files to run successfully on your server. The only necessary edits are to adjust the IP address and port number you would like to serve your chat server on. Please make the following edits:
		1. In server.js
			line 26:
				app.listen(3000); // change 3000 to port you want to serve at
		2. In assets/js/chattabox.js
			line 2:
				var socket = io.connect('http://erics.homeip.net:3000'); // change http://erics.homeip.net to IP of your choice, e.g. http://yoursite.net and change 3000 to the port you chose in server.js

#### Directions:
	1. Successfully install Node.js and Redis
	2. Copy included files to location of choice
	3. Open a terminal
	4. 'cd path/to/included \files'
	5. 'npm install -d' (this will install all needed dependencies automagically)
	6. 'redis-server' (this will start the NoSQL server)
	7. 'node server.js' (this will start the HTTP server that serves files and connects sockets for chat)
	8. Open a browser and point it to <your IP>:<your port>
	9. Chat away!