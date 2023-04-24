privateKey = null;
publicKey = null;
revocationCertificate = null;
username = null;
password = null;

async function encryption_sign(text){
    chat_log("Signing text "+text,"MidnightBlue");
    
    const privKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: password
    });

    const unsignedMessage = await openpgp.createCleartextMessage({ text: text });
    const signedMessage = await openpgp.sign({
    message: unsignedMessage,
    signingKeys: privKey
    });

    return new Promise(resolve => {
        resolve(signedMessage)
    });

}

async function encryption_send_message(text,key){
    text = JSON.stringify(text)
    const passphrase = password; 

    const pubKey = await openpgp.readKey({ armoredKey: key });

    const privKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: text}),
        encryptionKeys: pubKey,
        signingKeys: privKey 
    });

    return new Promise(resolve => {
        resolve(encrypted)
    });
}

async function encryption_receive_message(encrypted,key){


    const passphrase = password;

    const message = await openpgp.readMessage({
        armoredMessage: encrypted
    });


    const pubKey = await openpgp.readKey({ armoredKey: key });

    const privKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
    });

    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: pubKey, 
        decryptionKeys: privKey
    });
    /*try {
        await signatures[0].verified; // throws on invalid signature
        return new Promise(resolve => {
            resolve(JSON.parse(decrypted));
        });
    } catch (e) {
        chat_log('Signature could not be verified: ' + e.message,"red");
    }*/
    return new Promise(resolve => {
        resolve(JSON.parse(decrypted));
    });
}

async function encryption_generate(user,pass) {
    const pgpdata = await openpgp.generateKey({
        type: 'ecc', // Type of the key, defaults to ECC
        curve: 'curve25519', // ECC curve name, defaults to curve25519
        userIDs: [{ name: user}], // you can pass multiple user IDs
        passphrase: pass, // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    });
    

    //Set data

    privateKey = pgpdata.privateKey;
    publicKey = pgpdata.publicKey;
    revocationCertificate = pgpdata.revocationCertificate;
    username = user;
    password = pass;

    chat_log("Generated keys for '"+user+"'"+" using supplied password","MidnightBlue");
    
    
    return Promise.resolve();


}