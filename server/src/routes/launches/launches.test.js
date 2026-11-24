const request = require('supertest')

const app = require('../../app')
const {mongoConnect, mongoDisconnect} = require('../../services/mongo')
const {loadPlanetsData} = require('../../models/planets.model')

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect()
        await loadPlanetsData()
    })

    afterAll(async () => {
        await mongoDisconnect()
    })
    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect(200)
                .expect('content-type', /json/)
        })
    })

    describe('Test POST /launches', () => {
        const completeLaunchData = {
            mission: 'ZTM155',
            rocket: 'ZTM Experimental IS1',
            launchDate: 'October 21, 2028',
            target: 'Kepler-442 b',
        }

        const launchDataWithoutDate = {
            mission: 'ZTM155',
            rocket: 'ZTM Experimental IS1',
            target: 'Kepler-442 b',
        }

        const launchDataWithInvalidDate = {
            mission: 'ZTM155',
            rocket: 'ZTM Experimental IS1',
            launchDate: 'yellow',
            target: 'Kepler-442 b',
        }

        test('It should respond with 201 success', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(completeLaunchData)
                .expect(201)
                .expect('content-type', /json/)

            const requestDate = new Date(
                completeLaunchData.launchDate,
            ).valueOf()
            const responseDate = new Date(response.body.launchDate).valueOf()
            expect(responseDate).toBe(requestDate)

            expect(response.body).toMatchObject(launchDataWithoutDate)
        })
        test('It should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDataWithoutDate)
                .expect(400)
                .expect('content-type', /json/)

            expect(response.body).toStrictEqual({
                error: 'Missing required launch property',
            })
        })
        test('It should catch invalid dates', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(launchDataWithInvalidDate)
                .expect(400)
                .expect('content-type', /json/)

            expect(response.body).toStrictEqual({
                error: 'Invalid launch date',
            })
        })
    })
})
