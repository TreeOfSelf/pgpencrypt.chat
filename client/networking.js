const socket = new WebSocket("wss://pgpencrypt.chat:42069");

socket.onopen = (event) => {
	chat_log("Connected to server at pgpencrypt.chat:42069","DarkOrchid");
};

connected_users = [];
friends = [];
friendsKeys = [];

socket.onmessage = async function(msg){
	data = JSON.parse(msg.data);
	console.table(data);
	switch(data.name){
		case "connected_users":
			connected_text.innerHTML = "";
			connected_users = [];
			for(var k=0;k<data.userList.length;k++){
				let user = data.userList[k];
				connected_users.push(user);
				let userBtn = document.createElement("div");
				userBtn.className = "userBtn";
				
				
				
				userBtn.innerHTML = chat_rand_emoji(user.username,user.key)+" "+user.username;
				userBtn.key = user.key;
				userBtn.username = user.username;
				connected_text.appendChild(userBtn);
				
				
				//add handshake checkbox only if this isn't your own user button
				if(userBtn.username!=username){
				 
					let checkMark = document.createElement("input");
					checkMark.className="connectCheckBox";
					checkMark.type="checkbox"; 
					checkMark.userBtn = userBtn;
					
					if(friends.includes(checkMark.userBtn.username)){
						checkMark.checked = true;
						checkMark.userBtn.style.backgroundColor="rgb(20,100,20)";
					}

					checkMark.onchange = function(e){
						//turning off
						if(!this.checked){
							let index = friends.indexOf(this.userBtn.username);
							if(index != -1) {
								friends.splice(index,1);
								friendsKeys.splice(index,1);
							}
							this.userBtn.style.backgroundColor="rgb(50,50,50)";
							network_send({
								name:"friends",
								friends:friends
							});
					
						//turning on
						}else{
							if(!friends.includes(this.userBtn.username)) {
								friends.push(this.userBtn.username);
								friendsKeys.push(this.userBtn.key);
							}
							this.userBtn.style.backgroundColor="rgb(20,100,20)";
							network_send({
								name:"friends",
								friends:friends
							});
						}
					}
					userBtn.appendChild(checkMark);	
				}
				

				userBtn.onclick=function(e){
					if(e.target!=this) return;
					navigator.clipboard.writeText(this.key);
					chat_log("Copied key of user "+this.username+" to clipboard","black");
					
				}
			}
		break;
		case "connected":
			loginScreen.style.opacity=0;
			animationWait(function(){loginScreen.style.display="none"})
			app.style.filter="blur(0px)";
			chat_log("Successfully verified. Welcome "+username,"MediumSeaGreen");
		break;
		case "message":
			let friendex = friends.indexOf(data.from);
			if(friendex==-1) return;
			let from = data.from;
			let fromKey = friendsKeys[friendex];
			let msg = await encryption_receive_message(data.message,fromKey);
			if(msg==null) return; 
			chat_log("Verified "+msg.name+" from "+from,"SeaGreen");
			switch(msg.name){
				case "chat":
					chat_add(from+": "+msg.data+"\n");
				break;
				case "draw":
					for(var k=0;k<msg.data.length;k++){
						draw_circle(msg.data[k][0],msg.data[k][1],msg.data[k][2],msg.data[k][3],false)
					}
					
				break;
				case "file":
					let downloadButton = document.createElement("button");
					downloadButton.className = "downloadButton";
					let fname = msg.fname;
					let fileData = new Uint8Array(msg.data.split(","));
					let fileSize = (fileData.length / 1024).toFixed(2);
					chat_log("Received "+fname+" from "+from+" "+fileSize+" KB","DarkSlateGray");
					downloadButton.fileData = fileData;
					downloadButton.fname = fname;
					downloadButton.innerHTML = fname+"</br>"+"from: "+from+ " Size: "+fileSize+ " KB";
					files.appendChild(downloadButton);
					downloadButton.onclick=function(){
						downloadFile(this.fname,this.fileData);
						this.remove();
					}

					let closeButton = document.createElement("button");
					closeButton.className = "closeBtn";
					closeButton.innerHTML = "X";
					closeButton.ele = downloadButton;
					closeButton.onclick = function(){
						this.ele.remove();
					}
					downloadButton.appendChild(closeButton);
				break;
			}
			
		break;
		case "error":
			loginError.innerHTML = data.message;
			username.value="";
			password.value="";
			inputKey.value="";
		break;
		case "save_key":
			if(inputKey.value!="") return;
			save_json({
				username : data.username,
				privateKey : privateKey,
				publicKey : publicKey,
				revocationCertificate : revocationCertificate,
			},data.username+".key")
		break;
		case "verify":
			let time = data.time;
			
			
			const signedMessage = await encryption_sign(time.toString());

			chat_log("Sending verification signature for time: "+time,"DarkOrchid");
			network_send({
				name:"verify",
				message:signedMessage
			});
	
		break;
	}
}

//Initial Connection handling
let connectButton = document.getElementById("connectButton");
connectButton.onclick = async function(){

	//New account
	if(inputKey.value == ''){
		let usernameInput = document.getElementById("usernameInput");
		let passwordInput = document.getElementById("passwordInput");
		let app = document.getElementById("app");
		if(passwordInput.value == ""){
			loginError.innerHTML = "Please enter a secure password"
			return;
		}
		await encryption_generate(usernameInput.value,passwordInput.value);
	}else{
		//Load key 
		let file = await read_file_contents(inputKey);
		chat_log("Decrypting file contents with password","MidnightBlue");
		const bytes = CryptoJS.AES.decrypt(file, filePassword.value);
		try {
			file = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
		} catch(e){
			loginError.innerHTML = "Incorrect file or password"
			return;
		}

		username = file.username;
		password = filePassword.value;
		privateKey = file.privateKey;
		publicKey = file.publicKey;
		revocationCertificate = file.revocationCertificate;
	}

	chat_log("Attempting login to account: '"+username+"'","DarkOrchid");

    network_send({
        "name" : "connect",
        "username" : username,
        "key" : publicKey,
    });
	
}


network_send = function(msg){
	socket.send(JSON.stringify(msg));
}