
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}


const express = require('express')
const GNRequest = require('./apis/gerencianet.js')
const knex = require('../database/connection');



const app = express()

app.use(express.json())

app.set('view engine', 'ejs');
app.set('views', 'src/views')

const reqGNAlready = GNRequest({
    clientId: process.env.GN_CLIENT_ID,
    clientSecret: process.env.GN_CLIENT_SECRET,
});


//conectar ao banco de dados, linkar a cobrança a ele
app.get('/', (req, res)=>{
    res.redirect('http://mswareg.mswareg.com:8080')
})

app.get('/charge/:userId', async (req, res)=>{

    const users = await knex.select('*').where({id: req.params.userId}).table('users');
    const valueToPay = req.query.value != undefined || req.query.value.toString().indexOf('.') != -1 ? req.query.value : 1.00


    console.log(users)

    if(users.length<1){
        res.render('qrcode', {
            imagem: 'l',
            qrCodeTxt: 'l'
        })
    }else{
        
        try {
            const chargeDatas = await knex.select('*').where({ userId: req.params.userId, chargeValue: valueToPay }).table("charge")
            
            
            if (chargeDatas.length<1) {
                const endpoint = `${process.env.GN_ENDPOINT}/v2/cob`;
                
                const reqGN = await reqGNAlready;

                const dataCob = {
                    calendario: {
                        expiracao: 3000
                    },
                    devedor: {
                        cpf: "12345678909",
                        nome: "Mswareg"
                    },
                    valor: {
                        original: `${valueToPay}`
                    },
                    chave: "db61e025-43f2-4b7d-82b6-58b4ee67959f",
                    solicitacaoPagador: "Se possível, informe seu nickname para caso haja um improvável problema, devolver o seu dinheiro."
                }


                const cobResponse = await reqGN.post('v2/cob', dataCob)




                const qrcodeResponse = await reqGN.get(`v2/loc/${cobResponse.data.loc.id}/qrcode`)

                const saveDb = `{
                        "calendario": { "criacao": "${cobResponse.data.calendario.criacao}", "expiracao": ${cobResponse.data.calendario.expiracao} },
                        "txid": "${cobResponse.data.txid}",
                        "revisao": ${cobResponse.data.revisao},
                        "loc": {
                            "id": ${cobResponse.data.loc.id},
                            "location": "${cobResponse.data.loc.location}",
                            "tipoCob": "${cobResponse.data.loc.tipoCob}",
                            "criacao": "${cobResponse.data.loc.criacao}"
                        },
                        "location": "${cobResponse.data.location}",
                        "status": "${cobResponse.data.status}",
                        "devedor": { "cpf": "${cobResponse.data.devedor.cpf}", "nome": "${cobResponse.data.devedor.nome}" },
                        "valor": { "original": "${cobResponse.data.valor.original}" },
                        "chave": "${cobResponse.data.chave}",
                        "solicitacaoPagador": "${cobResponse.data.solicitacaoPagador}",
                        "userId": ${req.params.userId},
                        "qrcode": "${qrcodeResponse.data.imagemQrcode}",
                        "qrcodetxt": "${qrcodeResponse.data.qrcode}"
                    }`

                    try {
                        const insertCharge = await knex.insert({ userId: req.params.userId, chargeId: cobResponse.data.txid, chargeValue: cobResponse.data.valor.original, chargeStatus: cobResponse.data.status, chargeJson: saveDb }).table("charge")
                        console.log(insertCharge)
                    } catch (error) {
                        console.log(error)
                    }

                res.render('qrcode', {
                    imagem: qrcodeResponse.data.imagemQrcode,
                    qrCodeTxt: qrcodeResponse.data.qrcode
                })
            }else{

                for (let i = 0; i < chargeDatas.length; i++) {
                    const date1 = new Date(chargeDatas[i].chargeJson.loc.criacao);
                    const date2 = new Date();
    
                    if ((date2.getTime() - date1.getTime()) / 1000 < 3000 && chargeDatas[i].status != "pago") {
                        res.render('qrcode',{
                            imagem: chargeDatas[i].chargeJson.qrcode,
                            qrCodeTxt: chargeDatas[i].chargeJson.qrcodetxt,
                            old: true
                        })
                        break;
                    }else{
                        if (chargeDatas[i].status == "pago") {
                            continue;
                        }else{
                            try {
                                var deleteCob = await knex.delete().where({ chargeId: chargeDatas[i].chargeId }).table('charge')
                                console.log(deleteCob);
                                res.send('deletou');
                            } catch (error) {
                                console.log(error)
                                res.send('deu erro');
        
                            }
                        }
                    }
                    
                }
            }

        } catch (error) {
            console.log('o erro esta aqui')
            console.log(error)
        }
        
        
    }

    
})

app.get('/cobrancas', async (req, res)=>{
    const reqGN = await reqGNAlready;

    const cobResponse = await reqGN.get('/v2/cob?inicio=2022-11-19T16:01:35Z&fim=2022-11-30T20:10:00Z')

    console.log(cobResponse.data)
    res.send(cobResponse.data)

})


app.post('/webhook(/pix)?', (req, res)=>{
    
    console.log(req.body)

    const pixObj = {...req.body.pix[0]}
    
    console.log(pixObj)


    res.send('200')
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



