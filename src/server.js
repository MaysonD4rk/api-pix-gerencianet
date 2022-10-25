if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const GNRequest = require('./apis/gerencianet.js')




const app = express()

app.set('view engine', 'ejs');
app.set('views', 'src/views')

app.get('/', async (req, res)=>{
    
    const endpoint = `${process.env.GN_ENDPOINT}/v2/cob`;
    
    const reqGN = await GNRequest();
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