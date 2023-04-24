const colors = require('colors');
const myRL = require('serverline')
const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const openpgp = require('openpgp');


const server = https.createServer({
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./privkey.pem')
},function(req,res){
	res.writeHead(200);
});

const wss = new WebSocket.WebSocketServer({ server });

clients = [];


wss.on('connection', function connection(ws,req) {

	console.log(("New connection from "+req.socket.remoteAddress).brightBlue);

  user = {
    connected : false,
    username : null,
    key : null,
    verifyTime : null,
    new : true,
    ws : ws,
    friends : [],
  };

  clients.push(user);
  ws.user = user;

  ws.on('close',function close() {

    console.log("Client disconnected".red)

    //Remove from clients list
    for(var k=0;k<clients.length;k++){
      if(clients[k].ws == ws){
        clients.splice(k, 1);
        break;
      }
    }

    network_send_all_users();

  });

	ws.on('message', async function message(data) {
		data = JSON.parse(data);
    //console.table(data);
    switch(data.name){
      case "verify":
        let pubKey = fs.readFileSync("./users/"+ws.user.username.toLowerCase()+".data").toString();
        let verified = await verify_message(pubKey,data.message);
        if(verified){

          if(ws.user.new) {
            //Tell user to save their key
            network_send(ws,{
              name:"save_key",
              username: ws.user.username,
            })
          }



		//Delete any users online with the same name 
		for(var k=0;k<clients.length;k++){
			if(clients[k].username == ws.user.username && clients[k].ws!=ws ){
				network_send(clients[k].ws,{
					name:"error",
					message:"Logged in from another location."
				});
				clients[k].ws.close();
			}
		}
          ws.user.connected = true;
          network_send(ws,{
            name:"connected",
          });
          network_send_all_users();


        }else{
          network_send(ws,{
            name:"error",
            message:"Failed to verify for user"
          });
          return;        
        }
      break;
      case "friends":
        ws.user.friends = data.friends;
      break;
      case "message":
        let to = data.to;
        let from = ws.user.username;

        let user;
        for(var k=0;k<clients.length;k++){
          if(clients[k].username == to) {
            user = clients[k];
            break;
          }
        }

        if(user==null) return;
        if(!user.friends.includes(from)) return;

        network_send(user.ws,{
          name:"message",
          from : from,
          message : data.message,
        })

      break;
      case "connect":
        //Make sure username valid
       let checkName = data.username.toLowerCase();
       if(!isValid(checkName) || checkName.length>15 || checkName.length==0){
        
          network_send(ws,{
            name:"error",
            message:"Please enter a valid name"
          })

        return;
       }

       ws.user.key = data.key;


       //Check to see if username exists 
       if(!fs.existsSync("./users/"+checkName+".data")){
          fs.writeFileSync("./users/"+checkName+".data",data.key);
          ws.user.new = true;
       }else{
          //Verify they are using the same public key 
          let pubKey = fs.readFileSync("./users/"+checkName+".data").toString();
          if(pubKey!=data.key){
            network_send(ws,{
              name:"error",
              message:"Username already exists (Incorrect public key for user)"
            })    
            return;       
          }
       }
       
      ws.user.username = data.username;

       //Start verification
       let verifyTime = Date.now();
       ws.user.verifyTime = verifyTime;
       network_send(ws,{
        name:"verify",
        time : verifyTime,
       })

      break;
    }
	});

});

server.listen(42069);


network_send = function(ws,data){
  ws.send(JSON.stringify(data));
}

network_send_all = function(data){
  for(var k=0;k<clients.length;k++){
    clients[k].ws.send(JSON.stringify(data));
  }
}

network_send_all_users = function(){
  let userList = [];
  for (var k=0;k<clients.length;k++){
    if(!clients[k].connected) continue;
    userList.push({
      username : clients[k].username,
      key : clients[k].key
    })
  }
  network_send_all({
    name : "connected_users",
    userList : userList,
  });
}



myRL.init()
myRL.setPrompt('> ')

myRL.on('line', function(line) {
  console.log('cmd:', line)
  switch (line) {
    default:
      console.log(eval(line));
      break;
    case 'help':
      console.log('help: To get this message.')
      break
  }

})


async function verify_message(publicKeyArmored,cleartextMessage){
  const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

  let theirHex =  publicKey.keyPacket.keyID.toHex();

  const signedMessage = await openpgp.readCleartextMessage({
    cleartextMessage // parse armored message
  });

  let goodToGo = true;
  let readHex;

  try {

    const verificationResult = await openpgp.verify({
        message: signedMessage,
        verificationKeys: publicKey
    });

    const { signature,verified, keyID } = verificationResult.signatures[0];
    readHex = keyID.toHex();

  }catch(e){
    goodToGo=false;
  }


  return new Promise(resolve => {
    if(goodToGo && readHex == theirHex){
      resolve(true);
    }else{
      resolve(false);
    }
  });

}

function isValid(str){
  return !/[^A-Za-z0-9]/g.test(str);
 }

console.log("PGPEncrypt Server started! Listening on port 42069.".brightGreen);
