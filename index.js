import {nanoid} from 'nanoid';
import dotenv from 'dotenv';
import {mongoose} from 'mongoose';
import express, { request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';


// Basic Configuration
const app = express();
dotenv.config();

const port = process.env.PORT || 3000;

const UrlSchema = mongoose.Schema({
  urlId: {
    type: String,
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    default: Date.now(),
  }
})

const Url = mongoose.model('Url', UrlSchema);

const validateUrl = (value) => {
  const regex = new RegExp(/((?:(?:http?|ftp)[s]*:\/\/)?[a-z0-9-%\/\&=?\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?)/gi)
  return regex.test(value)  
}

const connect = () => {
  try {
    mongoose.connect(process.env.URI,{useNewUrlParser:true,useUnifiedTopology:true});    
    console.log('Connected to Database');
  } catch(err) {
    console.log('Error connecting to Database' + err.message);
  }
}

connect();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

//API endpoints
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async (req,res)=>{  
  const base = process.env.BASE;
  const urlId = nanoid();
  
  if (validateUrl(req.body.url)){
    try {
      let url = await Url.findOne({originalUrl: req.body.url})
      if(url){
        res.json(url)
      } else {
        url = new Url({
          urlId : urlId,
          originalUrl : req.body.url,
          shortUrl : `${base}/${urlId}`,                
          date: new Date()
        });
        url.save();
        res.json(url);
      }
    } catch (err) {
      res.status(400).json('Server error: ' + err.message)
    }
    
  } else {
    res.status(400).json('invalid URL')
  }  
})

app.get('/api/shorturl/:urlId', async (req,res)=>{
  try{
    const url = await Url.findOne({urlId: req.params.urlId})

    if (url) {
      res.redirect(url.originalUrl)
    } else {
      res.status(404).json('No encontrado')
    }
  } catch (err) {    
    res.status(500).json('Server error: ' + err.message)
  }

})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
