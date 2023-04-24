app.style.height = window.innerWidth+"px";

window.onresize = function(){
    app.style.height = window.innerWidth+"px";
}

animationWait = function(func){
    setTimeout(func,500);
}

save_json = function(obj,fname) {
    chat_log("Encrypting JSON with password","MidnightBlue");
    let encryptedJSON = CryptoJS.AES.encrypt(JSON.stringify(obj), password).toString();
    download(encryptedJSON,fname,"text/plain");
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

read_file_contents = async function(ele){

    return new Promise(resolve => {
        var file = ele.files[0];
        if (file) {
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function (evt) {
                resolve(evt.target.result);
            }
            reader.onerror = function (evt) {
                //
            }
        
        }
    }); 
}

copyText = function(text) {
    // Get the text field
    var copyText = document.createElement("input");
    copyText.innerHTML=text;
    document.body.appendChild(copyText);

    // Select the text field
    copyText.select();
    copyText.setSelectionRange(0, 99999); // For mobile devices
  
     // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);
  
    copyText.remove();
  }