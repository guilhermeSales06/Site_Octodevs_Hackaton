require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()


//configurar o JSON
app.use(express.json())

// Models
const User = require('./models/User')

//OPEN ROUTER
app.get('/', (req,res) =>{
    res.status(200).json({msg: 'Bem vindo a nossa API'})
})

//Rota privada
app.get("/user/:id",checkToken, async(req,res)=>{
    const id = req.params.id

    //checar se o usuário existe
    const user = await User.findById(id,'-password')
    
    if(!user){
           return res.status(404).json({msg: 'Usuário não encontrado'})
    }

    res.status(200).json({user})

    function checkToken(req,res,next){
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split("")[1]

        if(token){
            return res.status(401).json({msg: 'Acesso negado!'})
        }

        try{
            const secret = process.env.SECRET
            
            jwt.verify(token, secret)

            next()
        }catch(error){
            res.status(400).json({msg: 'Token inválido!'})
        }

    }



})

//REgistrar usuário
app.post('/auth/register', async(req,res) =>{

    const {name,email, password, confirmpassword} = req.body

    //validar
    if(!name){
        return res.status(422).json({msg: 'Insira um nome!'})
    } 
    
    if(!email){
        return res.status(422).json({msg: 'Insira um email, filho da puta!'})
    } 

    if(!password){
        return res.status(422).json({msg: 'Insira uma senha!'})
    } 

    if(password !== confirmpassword){
        return res.status(422).json({msg: 'As senhas não coincidem'})
    }
    
    //checar se o usuário existe
    const userExists = await User.findOne({email: email})

    if(userExists){
        return res.status(422).json({msg: 'Por favor, utilize outro email'})
    }

    //Criar senha
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    //criar usuário
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try{

        await user.save()

        res.status(201).json({msg: 'Usuário criado com sucesso'})

    } catch(error){
        console.log(error)
        res
            .status(500)
            .json({
                msg:'Ocorreu um erro no servidor, tente novamente mais tarde'
        })
    }
})

//Login
app.post("/auth/login", async (req,res) => {
    const {email, password} = req.body
    
    //validar
    if(!email){
        return res.status(422).json({msg: 'insira um email!'})
    }
    if(!password){
        return res.status(422).json({msg:'Insira uma senha'})
    }

    //checar se o uruário existe
    const user = await User.findOne({email: email})

    if(!user){
        return res.status(404).json({msg: 'Usuário não encontrado!'})
    }

    //chegar se as senhas coincidem
    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword){
        return res.status(422).json({msg: 'Senha inválida'})
    }

    try{
        const secret = process.env.SECRET

        const token = jwt.sign(
            {
            id: user._id,
        },
        secret,
        )
        res.status(200).json({msg:'Autenticação realizada com sucesso',token})
    }catch(err){
        console.log(error)

        res.status(500).json({
        msg: 'Aconteceu algo no servidor, tente novamente mais tarde',
    })
    }
})

// Credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@noriyuki.1tab99m.mongodb.net/?retryWrites=true&w=majority`,
)
.then(()=> {
    app.listen(3000)
    console.log('conectou ao banco')
}).catch((err) => console.log(err))


