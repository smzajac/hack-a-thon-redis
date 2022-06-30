const express = require("express");
const http = require("http");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");
// const client = Redis.createClient({url: 'redis://10.18.227.3:6379'});
const client = Redis.createClient('localhost', '6379');
// const client = Redis.createClient();

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {await client.connect();})();

const app = express();
app.use(cors());
const port = 3000;
const DEFAULT_EXPIRATION = 3600;

app.get("/photos", async (req, res) => {
	let startTime = new Date().getTime();
	const albumId = req.query.albumId

	try {
		let result = await client.get(`photos?albumId=${albumId}`);
		if(result != null) {
			console.log('cached hit')
			res.json(JSON.parse(result))
		} else {
			console.log('client hit')
			const { data } = await axios.get( "https://jsonplaceholder.typicode.com/photos",
				{params: { albumId }}
			)
			client.setEx(`photos?albumId=${albumId}`, DEFAULT_EXPIRATION, JSON.stringify(data))
			res.json(data)
		}
		//see the time difference in fetch
		console.log(new Date(). getTime() - startTime)
	} catch (err){
		console.error(err)
	}
})

app.get("/photos/:id", async (req, res) => {
	let startTime = new Date().getTime();

	try {
		let result = await client.get(`photos/${req.params.id}`);
		if(result != null) {
			console.log('cached hit')
			res.json(JSON.parse(result))
		} else {
			console.log('client hit')
			const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`)

			client.setEx(`photos/${req.params.id}`, DEFAULT_EXPIRATION, JSON.stringify(data))
			res.json(data)
		}
		//see the time difference in fetch
		console.log(new Date(). getTime() - startTime)
	} catch (err){
		console.error(err)
	}

	//see time difference in fetch
	console.log(new Date(). getTime() - startTime)
})

app.listen(port, () => {
	console.log(`app listening on port ${port}`)
  })