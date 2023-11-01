require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

// show content of post request
morgan.token('content', function (req, res) { return JSON.stringify(req.body)})

app.use(morgan(function (tokens, req, res) {
	return [
		tokens.method(req, res),
		tokens.url(req, res),
		tokens.status(req, res),
		tokens.res(req, res, 'content-length'), '-',
		tokens['response-time'](req, res), 'ms',
		tokens.content(req, res)
	].join(' ')
}))


app.get('/api/persons', (request, response) => {
	Person.find({}).then(persons => {
		response.json(persons)
	})
})

app.post('/api/persons', (request, response) => {
	const body = request.body

	if (!body.name || !body.number) {
		return response.status(400).json({
			error: 'name and/or number missing',
		})
	}

	const person = new Person({
		name: body.name,
		number: body.number,
	})

	person.save()
		.then(result => {
			console.log('added new number to database')
		})

	response.json(person)
})

app.get('/api/persons/:id', (request, response, next) => {
	Person.findById(request.params.id)
		.then(result => {
			if (!result) {
				return response.status(404).end()
			}

			response.json(result)
		})
		.catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
	const body = request.body

	const person = {
		number: body.number
	}

	Person.findByIdAndUpdate(request.params.id, person, { new: true })
		.then(result => {
			response.json(result)
		})
		.catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
	Person.findByIdAndRemove(request.params.id)
		.then(result => {
			response.status(204).end()
		})
		.catch(error => next(error))
})

app.get('/info', (request, response) => {
	Person.count({})
		.then(result => {
			const phonebookSize = `Phonebook has info for ${result} people`
			const timeStamp = Date().toString() 

			response.send(`<p>${phonebookSize}</p><p>${timeStamp}</p>`)
		})
})

const errorHandler = (error, request, response, next) => {
	console.error(error.message)

	if (error.name === 'CastError') {
		return response.status(400).send({ error: 'malformatted id' })
	}

	next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`)
})

