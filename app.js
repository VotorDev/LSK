import { SecretNetworkClient } from "https://esm.sh/secretjs";

const page_version = "0.2";

const CHAIN_ID = "secret-4";

const sScrtCodeHash = "af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e";

const lskCodeHash = "4dd433b8d9c234c33f27bcd14f3348bc57d96440a92b77cee7d0c925b8eed58e";

const lskAddress = "secret1d3upraxjwv0d30aahm7j8pu2a2p7g9lhe72ch3";

let scrtAddress = '';
let isConnected = false;

function setVersion() {
  document.getElementById('version').innerText = `Version: ${page_version}`;
}

async function connectWallet() {
    if (window.keplr) {
        window.wallet = window.keplr;
        console.log("Using Keplr");
    } else if(window.leap){
        window.wallet = window.leap;
        console.log("Using Leap");
    }else {
        console.log("No wallet detected");
      document.getElementById('walletAddress').innerText = "No wallet detected";
    }
        await window.wallet.enable(CHAIN_ID);
        const offlineSigner = window.wallet.getOfflineSigner(CHAIN_ID);
        const accounts = await offlineSigner.getAccounts();
        scrtAddress = accounts[0].address;
        isConnected = true;

        document.getElementById('scrtAddress').innerText = scrtAddress;
        document.getElementById('tokensBtn').removeAttribute('disabled');
}

function img_create(src) {
    var img = IEWIN ? new Image() : document.createElement('img');
    img.src = src;
    img.style.width = "640px";
    img.style.height = "auto";
    return img;
}

async function getTokenInfo(token_id, client, contract, auth){
  let tokenInfo = await client.query.snip721.GetTokenInfo({
    contract: contract,
    auth: auth,
    token_id: token_id
  })

  let tokenImg = img_create(tokenInfo['all_nft_info']['info']['extension']['media'][0]['url']);
  
  document.getElementById('kongs').appendChild(tokenImg);
}

async function getTokens(){
  const url = "https://lcd.secret.express";

  // To create a readonly secret.js client, just pass in a LCD endpoint
  const secretjs = new SecretNetworkClient({
    url,
    chainId: CHAIN_ID,
    wallet: window.wallet,
    walletAddress: scrtAddress,
    encryptionUtils: window.wallet.getEnigmaUtils(CHAIN_ID),
  });

  const {
    balance: { amount },
  } = await secretjs.query.bank.balance(
    {
      address: scrtAddress,
      denom: "uscrt",
    },
  );

  console.log(`I have ${Number(amount) / 1e6} SCRT!`);

  let permit = await secretjs.utils.accessControl.permit.sign(
    scrtAddress,
    CHAIN_ID,
    "LSK-migration",
    [lskAddress],
    ["owner"]
  )

  let lskContract = {
      address: lskAddress,
      codeHash: lskCodeHash
    };
  
  let lskAuth = {
      permit: permit
    };
  
  let tokens = await secretjs.query.snip721.GetOwnedTokens({
    contract: lskContract,
    owner: scrtAddress,
    auth: lskAuth,
  });
  console.log(tokens);
  console.log(tokens['token_list']['tokens']);
  document.getElementById('tokens').innerText = `tokens: ${tokens['token_list']['tokens']}`
  
  for (let token_id of tokens['token_list']['tokens'][0]) {
    await getTokenInfo(token_id, secretjs, lskContract, lskAuth);
  }
}

window.onload = async () => {
    setVersion();
    document.getElementById("tokensBtn").onclick=getTokens;
    connectWallet();
};
