# Chattabox

### INSTALLATION

To successfully run this chat system there are two essential elements:

1. Node.js Server installed with the Node Package Manager (NPM)
2. Redis NoSQL Database

### Node.js:
Get Node.js @ [nodejs.org](http://nodejs.org/).

### Redis:
Get Redis @ [redis.io](http://redis.io/).

### Other Dependencies:
Using NPM, it is simple to install all other dependencies.

### Edit Files:
You will need to edit the files to run successfully on your server. The only necessary edits are to adjust the IP address and port number you would like to serve your chat server on. Please make the following edits:

1. In server.js
```
app.listen(3000); // change 3000 to port you want to serve at
```

2. In assets/js/chattabox.js
```
var socket = io.connect(' http://example.com:3000 '); // use your domain name and the port from previous step
```

#### Directions:

Successfully install Node.js and Redis
```
$ cd your_root
$ git clone git@github.com:ericreinsmidt/chattabox.git
$ cd chattabox
$ npm install -d
$ redis-server
$ node server.js
```
Open a browser and point it to http://example.com:3000

> Copyright (c) 2012 Eric Reinsmidt

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.