const axios = require('axios')

const launchesDatabase = require('./launches.mongo')
const planets = require('./planets.mongo')

const DEFAULT_FLIGHT_NUMBER = 100

const SPACEX_API_URL = 'https://gateway.pipeworx.io/spacex/v4/launches/past'

async function populateLaunches() {
    const {data} = await axios.get(SPACEX_API_URL)

    if (!Array.isArray(data)) {
        throw new Error('Unexpected response from SpaceX API')
    }

    for (const [index, spacexLaunch] of data.entries()) {
        const [rocket, mission] = spacexLaunch.name
            .split('|')
            .map((part) => part.trim())

        if (!rocket || !mission) {
            console.warn(
                `Skipping launch with unexpected name: ${spacexLaunch.name}`,
            )
            continue
        }

        const launchDate = new Date(spacexLaunch.date_utc)
        if (Number.isNaN(launchDate.valueOf())) {
            console.warn(
                `Skipping launch with invalid date: ${spacexLaunch.name}`,
            )
            continue
        }

        const launch = {
            flightNumber: DEFAULT_FLIGHT_NUMBER + index + 1,
            mission,
            rocket,
            launchDate,
            customers: ['ZTM', 'NASA'],
            upcoming: false,
            success: spacexLaunch.success,
        }
        await saveLaunch(launch)
        console.log(`${launch.rocket} ${launch.mission}`)
    }
}

async function loadLaunchesData() {
    const launchDataAlreadyUploaded = await findLaunch({
        rocket: 'Falcon 9 Block 5',
        mission: 'USSF-627',
    })
    if (launchDataAlreadyUploaded) {
        console.log('Launch data already uploaded')
    } else {
        console.log('Downloading launches data...')
        await populateLaunches()
    }
}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter)
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({flightNumber: launchId})
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber')
    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER
    }
    return latestLaunch.flightNumber
}

async function getAllLaunches(skip, limit) {
    return await launchesDatabase
        .find({}, {_id: 0, __v: 0})
        .sort({flightNumber: 1})
        .skip(skip)
        .limit(limit)
}

async function saveLaunch(launch) {
    try {
        await launchesDatabase.findOneAndUpdate(
            {flightNumber: launch.flightNumber},
            launch,
            {
                upsert: true,
            },
        )
    } catch (err) {
        console.log(`Could not create new launch. Error: ${err}`)
    }
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    })
    if (!planet) {
        throw new Error('No matching planet was found')
    }

    const newFlightNumber = (await getLatestFlightNumber()) + 1

    const newLaunch = Object.assign(launch, {
        customers: ['ZTM', 'NASA'],
        upcoming: true,
        success: true,
        flightNumber: newFlightNumber,
    })

    await saveLaunch(newLaunch)
}

async function abortLaunchById(launchId) {
    const aborted = await launchesDatabase.updateOne(
        {flightNumber: launchId},
        {upcoming: false, success: false},
    )
    return aborted.modifiedCount === 1
}

module.exports = {
    existsLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    abortLaunchById,
    saveLaunch,
    loadLaunchesData,
}
