if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const axios = require('axios')
const fs = require('fs')
const path = require('path')
const https = require('https')


const cert = fs.readFileSync(
    path.resolve(__dirname, `../certs/${process.env.GN_CERT}`)
)

const credentials = Buffer.from(
    `${process.env.GN_CLIENT_ID}:${process.env.GN_CLIENT_SECRET}`
).toString('base64')

const agent = new https.Agent({
    pfx: cert,
    passphrase: ""
})

axios({
    method: 'POST',
    url: `${process.env.GN_ENDPOINT}/oauth/token`,
    headers:{
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
    },
    httpsAgent: agent,
    data:{
        grant_type: 'client_credentials'
    }
}).then(response=>{
    console.log(response.data)
})



console.log(cert)

console.log(process.env.GN_CLIENT_ID)




/*
curl --request POST \
  --url https://api-pix-h.gerencianet.com.br/oauth/token \
  --header 'Authorization: Basic Q2xpZW50X0lkX2NjOWE0MTlhNmU2MmNiY2E2OTgzNGRlZThmZDQwOWYxYTExMDE5NTg6Q2xpZW50X1NlY3JldF8wMjlkY2IyMDI4NTgwYjRlNGU4MDIyMDQyNGViYjRjNmVjZjM5NzQz' \
  --header 'Content-Type: application/json' \
  --data '{
	"grant_type": "client_credentials"
}'

*/