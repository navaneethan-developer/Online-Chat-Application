const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, getRoomUsers, userLeave } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = 'ChatBot';

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Run when client connects
io.on('connection', (socket) => {
    
        socket.on("joinRoom", ({username, room})=>{

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);
        //console.log('New WS connect!');
        socket.emit('message', formatMessage(botName, 'Welcome to Chat Application!'));

        // Broadcast when a user connects!
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined the chat!`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)

        });
    });

    // Listen for chatMessage 
    socket.on('chatMessage', (msg)=>{

        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message',  formatMessage(user.username, msg));
        //console.log(msg);
    });

     // Runs when client disconnects.
     socket.on('disconnect', ()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`));
        }
    });

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})

