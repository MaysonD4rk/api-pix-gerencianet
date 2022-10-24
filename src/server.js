if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const axios = require('axios')
const fs = require('fs')
const path = require('path')
const https = require('https');
const express = require('express')


const cert = fs.readFileSync(
    path.resolve(__dirname, `../certs/${process.env.GN_CERT}`)
)

const credentials = Buffer.from(
    `${process.env.GN_CLIENT_ID}:${process.env.GN_CLIENT_SECRET}`
).toString('base64')

const app = express()

app.set('view engine', 'ejs');
app.set('views', 'src/views')

app.get('/', async (req, res)=>{

    const agent = new https.Agent({
        pfx: cert,
        passphrase: ""
    })
    
    const authResponse = await axios({
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
    })
    
    const accessToken = authResponse.data?.access_token;

    const reqGN = axios.create({
        baseURL: process.env.GN_ENDPOINT,
        httpsAgent: agent,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const endpoint = `${process.env.GN_ENDPOINT}/v2/cob`;

    const dataCob = {
        calendario: {
            expiracao: 3600
        },
        devedor: {
            cpf: "12345678909",
                nome: "Maison Fabiano"
        },
        valor: {
            original: "100.00"
        },
        chave: "db61e025-43f2-4b7d-82b6-58b4ee67959f",
        solicitacaoPagador: "Informe o número ou identificador do pedido."
    }

    const config = {
        httpsAgent: agent,
        headers: {
            Authorization: `bearer ${accessToken}`,
            'Content-Type': "application/json"
        }
    }

    const cobResponse = await reqGN.post('v2/cob', dataCob)

    const qrcodeResponse = await reqGN.get(`v2/loc/${cobResponse.data.loc.id}/qrcode`)

    res.render('qrcode',{
        imagem: qrcodeResponse.data.imagemQrcode
    })
    
})



app.listen(8000, ()=>{
    console.log('running')
})


/*
curl --request POST \
  --url https://api-pix-h.gerencianet.com.br/oauth/token \
  --header 'Authorization: Basic Q2xpZW50X0lkX2NjOWE0MTlhNmU2MmNiY2E2OTgzNGRlZThmZDQwOWYxYTExMDE5NTg6Q2xpZW50X1NlY3JldF8wMjlkY2IyMDI4NTgwYjRlNGU4MDIyMDQyNGViYjRjNmVjZjM5NzQz' \
  --header 'Content-Type: application/json' \
  --data '{
	"grant_type": "client_credentials"
}'

*/