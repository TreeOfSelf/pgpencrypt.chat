canvas = document.getElementById("whiteboard");
ctx = canvas.getContext("2d");
ctx.fillStyle="white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

clicked = false;

circleSendList = [];
circleSendTimeout =  null;

draw_circle = async function(x,y,r,color,send=true){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();

    if(send){
        circleSendList.push([x,y,r,color]);
        clearTimeout(circleSendTimeout);
        circleSendTimeout = setTimeout(async function(){
            for(var k=0;k<friends.length;k++){
                let to = friends[k];
                let toKey = friendsKeys[k];
                let eMsg = {
                    name:"draw",
                    data: circleSendList,
                }
                let msg = await encryption_send_message(eMsg,toKey);
    
                network_send({
                    name : "message",
                    to : to,
                    message : msg
                })
            }
            circleSendList=[];
        },500)
    }
}

canvas.onmousedown = function(e){
    clicked=true;
    const rect = canvas.getBoundingClientRect()
    let r = Math.pow(2,parseInt(whiteboardSize.value));
    let color = whiteboardColor.value;
    draw_circle(e.clientX - rect.left,e.clientY - rect.top,r,color);
}

canvas.onmouseup = function(){
    clicked=false;
}

canvas.onmousemove = function(e){
    if(clicked) {
        const rect = canvas.getBoundingClientRect()
        let r = Math.pow(2,parseInt(whiteboardSize.value));
        let color = whiteboardColor.value;
        draw_circle(e.clientX - rect.left,e.clientY - rect.top,r,color);
    }
}