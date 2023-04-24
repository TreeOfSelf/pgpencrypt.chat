
chat_getTime = function(){
	var time = new Date;
	timeFormatted = "["+time.getHours()+":"+time.getMinutes()+":"+time.getSeconds()+"] ";
	return(timeFormatted);
}

chat_log = function(text,color){

	let doScroll = false;

	if(log.scrollTop == log.scrollHeight - log.clientHeight) doScroll = true;

	console.log("[LOG] "+text);
	logMessage = document.createElement("div");
	logMessage.className="logMessage";
	logMessage.style.color =  color;
	logMessage.innerHTML = chat_getTime()+text;
	log_text.appendChild(logMessage);

	if(doScroll) log.scrollTop = log.scrollHeight - log.clientHeight;
}

chat_rand_emoji = function(username,key){
	let rand = randSeed(username.toLowerCase());
	let emojiString = "";
	emojiString+= emojis[Math.round(rand()*emojis.length)];
	emojiString+= emojis[Math.round(rand()*emojis.length)];
	emojiString+= emojis[Math.round(rand()*emojis.length)];
	return(emojiString);
}

chat_add = function(text){
	let doScroll = false;
	if(chatbox.scrollTop == chatbox.scrollHeight - chatbox.clientHeight) doScroll = true;

	chatbox.value += text;

	if(doScroll) chatbox.scrollTop = chatbox.scrollHeight - chatbox.clientHeight;
}

chat_send = async function(){
	let text = message.value;

	if(text.length==0) return;

	chat_add("You: "+text+"\n");
	
	for(var k=0;k<friends.length;k++){

		let to = friends[k];
		let toKey = friendsKeys[k];

		let eMsg = {
			name:"chat",
			data: text,
		}

		let msg = await encryption_send_message(eMsg,toKey);

		network_send({
			name : "message",
			to : to,
			message : msg
		})

	}
	message.value = "";
}


clearChat.onclick = function(){
	chatbox.value = "";
}

async function readFile(event) {
	let data =new Uint8Array(event.target.result).toString();

	for(var k=0;k<friends.length;k++){

		let to = friends[k];
		let toKey = friendsKeys[k];

		let eMsg = {
			name:"file",
			fname : fileshare.files[0].name,
			data: data,
		}

		let msg = await encryption_send_message(eMsg,toKey);

		network_send({
			name : "message",
			to : to,
			message : msg
		})

	}
	fileshare.value = "";

  }

  function downloadFile(fileName, encodedArray) {

	const file = new File([encodedArray], fileName, {type: 'text/plain'});
	const url = URL.createObjectURL(file);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
  }
  



files_send = async function(){

	if(fileshare.value == "") return;

	var reader = new FileReader();
	reader.addEventListener('load', readFile);
	reader.readAsArrayBuffer(fileshare.files[0]);
	

}

fileshareSubmit.onclick = files_send;

sendButton.onclick = chat_send;
message.onkeydown = function(e){
	if(e.key == "Enter") {
		e.preventDefault();
		chat_send();
	}
}