const CryptoJS = require("crypto-js");
let key = CryptoJS.enc.Utf8.parse('teEb3gnyru3QCnxv'),
    aesDecrypt = (encryptedBase64Str) => {
        let decryptedData = CryptoJS.AES.decrypt(encryptedBase64Str, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return decryptedData.toString(CryptoJS.enc.Utf8);
    },
    aesEncrypt = (data) => {
        let encryptedData = CryptoJS.AES.encrypt(data, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        return encryptedData.toString();
    }
module.exports = {
    aesDecrypt,
    aesEncrypt
};