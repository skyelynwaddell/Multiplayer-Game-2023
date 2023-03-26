// Importing the required modules for web app
const express =require("express");
const app = express();
const path = require("path");
const hbs = require("hbs");
const mongoose = require("mongoose");
const User = require("./User");
const nodemailer = require('nodemailer');

//public database
const uri = 'mongodb+srv://your-username:your-password@yourdatabase.mongodb.net/?retryWrites=true&w=majority';
async function connect()
{
    try
    {
    await mongoose.connect(uri)
    console.log("Connected to Mongo DB!")
    } catch (error)
    {
    console.error(error);
    }
}
connect();
var spawn_x = ""
var spawn_y = ""

const templatePath = path.join(__dirname,'../Multiplayer-Server/templates')
app.use(express.json())
app.set("view engine","hbs")
app.set("views",templatePath)
app.use(express.urlencoded({extended:false}))
const appPort = 3003;
// Importing the required modules game server
const WebSocketServer = require('ws');
const serverPort = 2002;

// Creating a new websocket server
const server = new WebSocketServer.Server({ port: serverPort })
var players = [];
var clientID = 0;
var rooms = 0

//#region Player Update Event
function stateUpdate(){
    for(let i in players){
        var playerInfoStateUpdate = {
            id: players[i].id,
            name: players[i].name,
            email: players[i].email,
            password: players[i].password,
            x: players[i].x,
            y: players[i].y,
            state: players[i].state,
            dirx: players[i].dirx,
            playerColor: players[i].playerColor,
            playerText: players[i].playerText,
            currentRoom: players[i].currentRoom,
            eventName: "state_update",
        }

        //recieved player info > sending to all other clients
        for (let j in players){
            players[j].socketObject.send(JSON.stringify(playerInfoStateUpdate));
        }
    }
    setTimeout(stateUpdate,16);
}
stateUpdate();
//#endregion

//#region Game Server
server.on("connection", ws => 
{
    ws.clientID = clientID;
	//code that should execute just after the player connects
    console.log("Player Connected!");
    rooms++;
    //when the client sends us a message
    ws.on("message", data => 
    {
      //  console.log(`Client has sent us: ${data}`);
        var realData = JSON.parse(data);
        var eventName = realData.eventName;

        switch(eventName)
        {
            case "create_player_request":
            clientID++;
            ws.clientID = clientID;
            
            var player = 
            {
                id: clientID,
                name: realData.name,
                email : realData.email,
                confirm : realData.confirmed,
                password: realData.password,
                x: 20,
                y: 20,
                state: realData.state,
                playerText: realData.playerText,
                playerColor: realData.playerColor,
                currentRoom: realData.currentRoom,
                dirx: 1,
                socketObject: ws,
            }
            players.push(player);

            //load user information from database and send it to client
            User.findOne({ name: realData.name}).then((result)=>{
                console.log(result)
                if (result!=null)
                {
                user_name = result.name;
                player_color = result.color;
                spawn_x = result.x;
                spawn_y = result.y;

            //tell client that server has succesfully created the player & stats
            ws.send(
                JSON.stringify({
                    eventName: "created_you",
                    id: clientID,
                    name: user_name,
                    color: player_color,
                    x: spawn_x,
                    y: spawn_y,
                    
                })
            );
            console.log(user_name + " has just logged in!")
                }else{ var user_name = "username"}              
                }) 
            break;

            case "player_update":
                for (let i in players){
                    if (players[i].id == realData.id){

                        players[i].name = realData.name;
                        players[i].password = realData.password;
                        players[i].email = realData.email;
                        players[i].confirmed = realData.confirmed,
                        players[i].x = realData.x;
                        players[i].y = realData.y;
                        players[i].state = realData.state;
                        players[i].dirx = realData.dirx;
                        players[i].playerColor = realData.playerColor;
                        players[i].currentRoom = realData.currentRoom;
                        players[i].playerText = realData.playerText;
                    }
                }
            break;

            case "login":
            var playerName = realData.name
            var playerPassword = realData.password;

            User.findOne({ name: playerName , password: playerPassword ,}).select("name").select("password").select("confirmed").lean().then(result => {
                if (result){
                    console.log("Account exists in the database")
                   
                    ws.send(JSON.stringify({
                            eventName: "login_confirmed",
                            correctDetails: "true",
                            isConfirmed: result.confirmed,
                        })
                    );
                }else{
                    console.log("Account Doesnt Exist!")
                    ws.send(JSON.stringify({
                        eventName: "login_confirmed",
                        correctDetails: "false",
                        isConfirmed: "false",
                    })
                );
                }
            })
            break;
           
            case "sign_up":
            var playerName = realData.name;
            User.findOne({ name: playerName, }).select("name").select("confirmed").lean().then(result => {
                if (result && result.confirmed) {
                    console.log("Cant Create an Account that Already Exists!")
                    ws.send(
                        JSON.stringify({
                            eventName: "does_user_exist",
                            exists: "true",
                        })
                    );
                }else
                {
                User.findOneAndRemove({name:playerName})
                 console.log("Succesfully Created a New User!")
                //save new user data to mongodb
                const user = new User({
                name : realData.name,
                password : realData.password,
                email : realData.email,
                opt: realData.opt,
                confirmed : realData.confirmed,
                color : realData.color,
                x : 10,
                y : 10,
                room : realData.currentRoom,
                })
                user.save().then(() => console.log("User added to MongoDB"))

                // Send Confirmation Email
                const emailHTML = (`
                <h1>` + "Thank you for signing up for My Game " + user.name + "!" + `<br>` 
                +"Confirmation Code: "+ user.opt + `</h1>
                `);

                async function MailFunction(){
                    const transporter = nodemailer.createTransport({
                        service: "Hotmail",
                        auth: {
                            user: 'your-email@hotmail.com',
                            pass: 'emailpassword'
                        },
                    });
                    const info = await transporter.sendMail({
                        from: 'your-name <your-email@hotmail.com>',
                        to: realData.email,
                        subject: 'Confirmation Email',
                        html: emailHTML,
                    })
                    console.log("Email Confirmation sent! (" + info.messageId + ")");
                }
                MailFunction()
                .catch(e => console.log("Error Occured! " + e));

                ws.send(
                    JSON.stringify({
                        eventName: "does_user_exist",
                        exists: "false",
                    })
                );
                }
            });
            break;

            //#region Sending Chat System
            case "send_chat":
            var chat_string = realData.chatText;
            var typing_user = realData.typingUser;
            var current_room = realData.currentRoom;
            var player_color = realData.playerColor;

            var stringToSend =
            {
                eventName: "recieve_chat",
                chatText: chat_string,
                typingUser: typing_user,
                currentRoom: current_room,
                playerColor: player_color,
            }
            console.log(typing_user + ": " +chat_string);
            for(let i in players)
            {
                players[i].socketObject.send(JSON.stringify(stringToSend))

            }
            break;
            //#endregion

            //#region Email Confirmation
            case "confirm":
            var inputOPT = realData.inputOPT
            var playerName = realData.playerName

            User.findOne({ name: playerName, opt: inputOPT }).select("name").select("opt").lean().then(result => {
                if (result) {
                    console.log("confirmation succeeded")

                    User.collection.updateOne({ name : playerName},{ $set :{confirmed :"true"}})
                    console.log("Confirmed account status changed in DB");

                    ws.send(
                        JSON.stringify({
                            eventName: "confirm_useraccount",
                            confirm: "true"
                        })
                    );
                }else
                {
                 console.log("confirmation code wrong")
                 ws.send(
                    JSON.stringify({
                        eventName: "confirm_useraccount",
                        confirm: "false"
                    })
                );
                }
            })
            break;
            //#endregion

            //#region BoilerCode
            /*
            ------------------------------------------
            //send data to local player
            case "js_event":
            var stringRecieved = realData.example_var;    //turn variable recieved from the local player into a String

            ws.send(JSON.stringify({                      //send following table to local player
                    eventName: "gml_event",               //the event state in GML
                    example_var: stringRecieved,          //add new entry(s) to list
                    example_var: stringToRecieve,         //add new entry(s) to list
                }));
            break;
            //send data to local player
            //------------------------------------------
            
            //------------------------------------------
            //send data to all clients
            case "js_event":
            var stringToRecieve = realData.example_var;    //turn variable recieved from player into a String

            var stringToSend =                              //create a table to send to all players
            {
            eventName: "gml_event",                     //the event state in GML
            example_var: stringToRecieve,                   //add new entry(s) to list
            example_var: stringToRecieve,                   //add new entry(s) to list
            }
            for(let i in players)                           //check how many players there currently is
            {
            players[i].socketObject.send(
                JSON.stringify(stringToSend))               //send above table to all players
            }
            break;
            //send data to all clients
            -----------------------------------------
            */
            //#endregion BoilerCode

            default:
            break;
        }

    })
    //#region client disconnects from server
    ws.on("close", () => 
    { 
    console.log("Player Disconnected!");
    var clientWhoDisconnected = ws.clientID;
    var stringToSend = 
    {
        name: clientWhoDisconnected,
        eventName: "destroy_player",
    }
    for(let i in players)
    {
        players[i].socketObject.send(JSON.stringify(stringToSend))
        if(players[i].id == clientWhoDisconnected)
        {
            players.splice(i,1);
        }
    }
    })
    //handling client connection error
    ws.onerror = function () 
    {
        console.log("An Error Occurred!!!");
    }
});
    //#endregion

console.log("The WebSocket Game Server is Running");
app.listen(appPort, ()=>{console.log("Website Server is Online")});