async function handler(event, context) {
    console.log('ambiente..', JSON.stringify(process.env, null))
    console.log('evento..', JSON.stringify(event, null, 2))

    return {
        works: 'fine',
        update: true
    }
}

module.exports = {
    handler
}