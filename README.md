# Multiplayer Game 2023
 Features: Login System, Email Confirmation, Character Selection & Main Lobby Room <br>
Languages/Programs: Javascript/NodeJS & GameMaker Studio 2
<br>

-Must replace MongoDB url with the one from your account in server.js
<br>
-Must replace Hotmail account with you Hotmail account in server.js 
<br>
*Please look into setting your hotmail up
(do not use any other mailing service unless you know how to change the code to implement it)*
<br><br>
-Download VSCode & GameMaker Studio 2
<br>
-Google and Download NodeJS
<br>
-Google and Download MongoDB community edition (skip atlas download in installer)
<br>
-In Vscode click "File> Open Folder in Workspace" Select the /Server folder
<br>
-In Vscode click "Terminal > New Terminal"
<br>

*You need to install dependancies for this server to run in the terminal inside the root server of your /Server folder. Do this inside VSCode Terminal window.*

Commands for modules to install: <br>
> sudo apt install npm <br>
> sudo npm install <br>

Once all is installed you should be able to start the server by typing the following command into the VScode terminal. <br>
> node server.js 


Open GameMaker, run the project and confirm you can connect to the server. <br>

All done :3
<br><br>
-*to run on a vps, get a debian linux vps and install apache and all dependencies above.* <br>
-*make proxy pass with apache to example a folder called /server on vps that also links the games port which is default 2002* (you will need to google how to create a proxy pass in apache)<br>
-*&& instead of connecting to localhost in gamemaker connect to the ip address of your server followed by the proxypass folder (example 256.235.233/server/*
-*You can use the build npm function on server.js file and create an executable file that you can simply run on VPS to start your backend server. (Also google how to do this)*
